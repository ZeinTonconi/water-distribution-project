import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box, Typography, Button, CircularProgress,
  Alert, Divider, IconButton, Tooltip
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import RotateRightIcon from '@mui/icons-material/RotateRight'
import { getFarm, getCrops, addCrop, updateCrop } from '../services/farmService'
import { simulateFarm } from '../services/simulationService'
import AppHeader from '../components/AppHeader'
import { PageShell, PageContent } from '../components/PageWrapper'
import FarmCanvas from '../components/FarmCanvas'
import AddParcelDialog from '../components/AddParcelDialog'
import SimulationResults from '../components/SimulationResults'
import type { Farm, Crop, ParcelGroup, SimulationResponse } from '../types'
import { CANVAS_H, CANVAS_W, getGroupArea, getScale, PADDING } from '../types'
import type { ParcelGroupFormValues } from '../components/AddParcelDialog'
import EditParcelDialog from '../components/EditParcelDialog'
import type { EditParcelValues } from '../components/EditParcelDialog'
import { v4 as uuidv4 } from 'uuid'

// install uuid: npm install uuid && npm install -D @types/uuid

const COLORS = ['#ef4444', '#a855f7', '#22c55e', '#f97316', '#84cc16', '#06b6d4', '#f59e0b']

const PRIORITY_OPTIONS = [
  { value: 'sensitive', label: '🌱 Proteger cultivos delicados' },
  { value: 'equal', label: '⚖️ Repartir igual' },
  { value: 'economic', label: '💰 Maximizar producción' },
]

export default function FarmDetail() {
  const { farmId } = useParams<{ farmId: string }>()
  const [groups, setGroups] = useState<ParcelGroup[]>([])
  const id = Number(farmId)

  const [farm, setFarm] = useState<Farm | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Canvas state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // Simulation state
  const [priority, setPriority] = useState<'sensitive' | 'equal' | 'economic'>('sensitive')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [simulating, setSimulating] = useState(false)
  const [result, setResult] = useState<SimulationResponse | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ParcelGroup | null>(null)

  const handleEditOpen = (group: ParcelGroup) => {
    setEditingGroup(group)
    setEditOpen(true)
  }

  const handleEditSave = (id: string, values: EditParcelValues) => {
    const crop = crops.find(c => c.id === Number(values.cropId))
    setGroups(prev => prev.map(g =>
      g.id === id
        ? {
          ...g,
          cropId: Number(values.cropId),
          cropName: crop?.name ?? null,
          parcelCount: Number(values.parcelCount),
          parcelWidth: Number(values.parcelWidth),
          parcelLength: Number(values.parcelLength),
          plantingDate: values.plantingDate || null,
          currentStage: values.currentStage as any || null,
        }
        : g
    ))
  }

  const loadFarm = useCallback(async () => {
    try {
      const [farmData, cropsData] = await Promise.all([getFarm(id), getCrops()])
      setFarm(farmData)
      setCrops(cropsData)

      // Convert FarmCrops from DB into canvas ParcelGroups
      const loadedGroups: ParcelGroup[] = []
      for (const fc of farmData.crops) {
        for (const parcel of fc.parcels) {
          loadedGroups.push({
            id: `${fc.id}`,  // farmCropId — one group per FarmCrop for now
            x: parcel.x,
            y: parcel.y,
            parcelCount: parcel.parcelCount,
            parcelWidth: parcel.widthM,
            parcelLength: parcel.lengthM,
            rotation: parcel.rotation,
            cropId: fc.cropId,
            cropName: fc.cropName,
            plantingDate: fc.plantingDate,
            currentStage: fc.currentStage,
          })
        }
      }
      setGroups(loadedGroups)

      const stored = sessionStorage.getItem(`sim_${id}`)
      if (stored) setResult(JSON.parse(stored))
    } catch {
      setError('No se pudo cargar la chacra')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadFarm() }, [loadFarm])

  const handleAddGroup = async (values: ParcelGroupFormValues) => {
    const crop = crops.find(c => c.id === Number(values.cropId))
    const { scaleX: scale } = getScale(farm!.farmWidthM, farm!.farmHeightM)
    const rectW = Number(values.parcelCount) * Number(values.parcelWidth) * scale
    const rectH = Number(values.parcelLength) * scale

    const farmCanvasW = farm!.farmWidthM * scale
    const farmCanvasH = farm!.farmHeightM * scale
    const farmOriginX = (CANVAS_W - farmCanvasW) / 2
    const farmOriginY = (CANVAS_H - farmCanvasH) / 2

    const halfW = rectW / 2
    const halfH = rectH / 2
    const col = groups.length % 3
    const row = Math.floor(groups.length / 3)
    const offsetX = col * Math.min(rectW + 16, (farmCanvasW - rectW) / 3)
    const offsetY = row * Math.min(rectH + 16, (farmCanvasH - rectH) / 3)

    const x = Math.min(farmOriginX + halfW + offsetX, farmOriginX + farmCanvasW - halfW)
    const y = Math.min(farmOriginY + halfH + offsetY, farmOriginY + farmCanvasH - halfH)

    try {
      // Save to backend
      const saved = await addCrop(id, {
        cropId: Number(values.cropId),
        plantingDate: crop?.isPerennial ? null : values.plantingDate || null,
        currentStage: crop?.isPerennial ? values.currentStage : null,
        parcels: [{
          parcelCount: Number(values.parcelCount),
          widthM: Number(values.parcelWidth),
          lengthM: Number(values.parcelLength),
          x,
          y,
          rotation: 0,
        }]
      })

      // Add to canvas using DB id so we can update later
      const newGroup: ParcelGroup = {
        id: `${saved.id}`,  // use DB farmCropId as group id
        x, y,
        parcelCount: Number(values.parcelCount),
        parcelWidth: Number(values.parcelWidth),
        parcelLength: Number(values.parcelLength),
        rotation: 0,
        cropId: Number(values.cropId),
        cropName: crop?.name ?? null,
        plantingDate: values.plantingDate || null,
        currentStage: values.currentStage as any || null,
      }
      setGroups(prev => [...prev, newGroup])
    } catch (err: any) {
      setError(err.message || 'Error al agregar cultivo')
    }
  }

  const handleMove = async (groupId: string, x: number, y: number) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, x, y } : g))

    const group = groups.find(g => g.id === groupId)
    if (!group) return

    try {
      await updateCrop(id, Number(groupId), {
        parcels: [{
          parcelCount: group.parcelCount,
          widthM: group.parcelWidth,
          lengthM: group.parcelLength,
          x,
          y,
          rotation: group.rotation,
        }]
      })
    } catch {
      // silent — position will be wrong on next reload but not critical
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedId) return
    try {
      await updateCrop(id, Number(selectedId), { isHarvested: true })
      setGroups(prev => prev.filter(g => g.id !== selectedId))
      setSelectedId(null)
    } catch (err: any) {
      setError('Error al eliminar el cultivo')
    }
  }

  const handleRotateSelected = async () => {
    if (!selectedId) return
    const group = groups.find(g => g.id === selectedId)
    if (!group) return

    const newRotation = group.rotation === 0 ? 90 : 0
    setGroups(prev => prev.map(g =>
      g.id === selectedId ? { ...g, rotation: newRotation } : g
    ))

    try {
      await updateCrop(id, Number(selectedId), {
        parcels: [{
          parcelCount: group.parcelCount,
          widthM: group.parcelWidth,
          lengthM: group.parcelLength,
          x: group.x,
          y: group.y,
          rotation: newRotation,
        }]
      })
    } catch {
      // silent
    }
  }

  const handleSimulate = async () => {
    if (groups.length === 0) return
    setSimulating(true)
    setError(null)
    try {
      const result = await simulateFarm(id, {
        priority,
        nWeeks: 16,
        startDate,
      })
      setResult(result)
      sessionStorage.setItem(`sim_${id}`, JSON.stringify(result))
    } catch (err: any) {
      setError(err.message || 'Error al calcular el plan')
    } finally {
      setSimulating(false)
    }
  }

  // Group parcels by crop for simulation summary
  const cropSummary = groups.reduce((acc, g) => {
    if (!g.cropId) return acc
    const totalArea = getGroupArea(g)
    if (!acc[g.cropId]) acc[g.cropId] = { name: g.cropName ?? '', area: 0, count: 0 }
    acc[g.cropId].area += totalArea
    acc[g.cropId].count += 1
    return acc
  }, {} as Record<number, { name: string; area: number; count: number }>)

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  )

  if (!farm) return (
    <Box p={3}><Alert severity="error">Chacra no encontrada</Alert></Box>
  )

  return (
    <PageShell>
      <AppHeader
        title={farm.name}
        subtitle={`💧 Tanque: ${farm.tankCapacity}L`}
        backTo="/"
      />

      <PageContent maxWidth={900}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Canvas toolbar */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            Mi chacra
          </Typography>
          <Box display="flex" gap={1}>
            {selectedId && (
              <>
                <Tooltip title="Rotar 90°">
                  <IconButton size="small" onClick={handleRotateSelected}>
                    <RotateRightIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar parcela">
                  <IconButton size="small" color="error" onClick={handleDeleteSelected}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
            <Button
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
            >
              Agregar parcela
            </Button>
          </Box>
        </Box>

        {/* Canvas */}
        <FarmCanvas
          groups={groups}
          selectedId={selectedId}
          farmWidthM={farm.farmWidthM}
          farmHeightM={farm.farmHeightM}
          onSelect={setSelectedId}
          onMove={handleMove}
          onEdit={handleEditOpen}
        />

        {/* Crop summary */}
        {Object.keys(cropSummary).length > 0 && (
          <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
            {Object.entries(cropSummary).map(([cropId, info]) => (
              <Box
                key={cropId}
                bgcolor="grey.100"
                borderRadius={2}
                px={1.5} py={0.75}
              >
                <Typography variant="caption" fontWeight={600}>
                  {info.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {info.count} parcela{info.count > 1 ? 's' : ''} · {info.area.toFixed(1)}m²
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Simulation controls */}
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="flex-end" mb={2}>
          <Box>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
              Prioridad
            </Typography>
            <Box display="flex" gap={1}>
              {PRIORITY_OPTIONS.map(opt => (
                <Button
                  key={opt.value}
                  size="small"
                  variant={priority === opt.value ? 'contained' : 'outlined'}
                  onClick={() => setPriority(opt.value as any)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {opt.label}
                </Button>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
              Fecha de inicio
            </Typography>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: 8,
                border: '1.5px solid #e5e7eb',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={simulating ? <CircularProgress size={18} color="inherit" /> : <PlayArrowIcon />}
            onClick={handleSimulate}
            disabled={simulating || groups.length === 0}
          >
            {simulating ? 'Calculando...' : 'Calcular plan de riego'}
          </Button>
        </Box>

        {/* Results */}
        {result && <SimulationResults result={result} />}
      </PageContent>

      <AddParcelDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        crops={crops}
        onAdd={handleAddGroup}
      />
      <EditParcelDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        crops={crops}
        group={editingGroup}
        onSave={handleEditSave}
      />
      {Object.keys(cropSummary).length > 0 && (
        <Box display="flex" gap={1} flexWrap="wrap" mt={2}>
          {Object.entries(cropSummary).map(([cropId, info]) => {
            const totalFarmArea = farm!.farmWidthM * farm!.farmHeightM
            const overFarm = info.area > totalFarmArea
            return (
              <Box
                key={cropId}
                bgcolor={overFarm ? '#fef2f2' : 'grey.100'}
                border={overFarm ? '1px solid #fca5a5' : 'none'}
                borderRadius={2}
                px={1.5} py={0.75}
              >
                <Typography variant="caption" fontWeight={600} color={overFarm ? 'error.main' : 'text.primary'}>
                  {info.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {info.count} grupo{info.count > 1 ? 's' : ''} · {info.area.toFixed(1)}m²
                  {overFarm && ' ⚠️ supera el área de la chacra'}
                </Typography>
              </Box>
            )
          })}
        </Box>
      )}
    </PageShell>
  )
}