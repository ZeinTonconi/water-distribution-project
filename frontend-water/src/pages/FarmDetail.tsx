import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box, Typography, Button, Card, CardContent, CircularProgress,
  Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton, Chip, Divider, Fab
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { getFarm, getCrops, addCrop, harvestCrop } from '../services/farmService'
import type { Farm, Crop } from '../types'

const PRIORITY_OPTIONS = [
  { value: 'sensitive', label: '🌱 Proteger cultivos delicados', description: 'El agua va primero a los cultivos más sensibles a la sequía' },
  { value: 'equal', label: '⚖️ Repartir igual entre todo', description: 'Todos los cultivos reciben agua por igual' },
  { value: 'economic', label: '💰 Lo que más vale económicamente', description: 'Se prioriza la mayor producción posible' },
]

export default function FarmDetail() {
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()
  const id = Number(farmId)

  const [farm, setFarm] = useState<Farm | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add crop dialog
  const [addOpen, setAddOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({
    cropId: '',
    area: '',
    plantingDate: '',
    currentStage: 'mid',
    simulationDate: ''
  })

  // Priority + simulate dialog
  const [simOpen, setSimOpen] = useState(false)
  const [priority, setPriority] = useState('sensitive')
  const [simulating, setSimulating] = useState(false)

  const loadFarm = useCallback(async () => {
    try {
      const [farmData, cropsData] = await Promise.all([getFarm(id), getCrops()])
      setFarm(farmData)
      setCrops(cropsData)
    } catch {
      setError('No se pudo cargar la chacra')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadFarm() }, [loadFarm])

  const selectedCrop = crops.find(c => c.id === Number(addForm.cropId))

  const handleAddCrop = async () => {
    if (!addForm.cropId || !addForm.area) return
    setAdding(true)
    try {
      await addCrop(id, {
        crop_id: Number(addForm.cropId),
        area_m2: Number(addForm.area),
        planting_date: selectedCrop?.isPerennial ? null : addForm.plantingDate || null,
        current_stage: selectedCrop?.isPerennial ? addForm.currentStage : null,
      })
      await loadFarm()
      setAddOpen(false)
      setAddForm({ cropId: '', area: '', plantingDate: '', currentStage: 'mid', simulationDate: '' })
    } catch (err: any) {
      setError(err.message || 'Error al agregar cultivo')
    } finally {
      setAdding(false)
    }
  }

  const handleHarvest = async (farmCropId: number) => {
    try {
      await harvestCrop(id, farmCropId)
      await loadFarm()
    } catch {
      setError('Error al marcar como cosechado')
    }
  }

  const [startDate, setStartDate] = useState("")
  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const { simulateFarm } = await import('../services/simulationService')
      const result = await simulateFarm(id, {
        priority: priority as 'sensitive' | 'equal' | 'economic',
        n_weeks: 16,
        start_date: new Date(startDate).toISOString().split('T')[0],
      })
      // Store result in sessionStorage to pass to Results page
      sessionStorage.setItem('simulationResult', JSON.stringify(result))
      navigate(`/farms/${id}/results`)
    } catch (err: any) {
      setError(err.message || 'Error al calcular el plan')
      setSimulating(false)
    }
  }

  const toleranceLabel = (t: number) => {
    if (t <= 1) return { label: 'Muy delicado', color: 'error' as const }
    if (t <= 2) return { label: 'Delicado', color: 'warning' as const }
    if (t <= 3) return { label: 'Moderado', color: 'info' as const }
    return { label: 'Resistente', color: 'success' as const }
  }

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  )

  if (!farm) return (
    <Box p={3}>
      <Alert severity="error">Chacra no encontrada</Alert>
    </Box>
  )

  const activeCrops = farm.crops.filter(fc => !fc.isHarvested)

  const toSpanish = (stage: string) => {
    if(stage === "initial") return "de brote"
    if(stage === "mid") return "de crecimiento"
    if(stage === "end") return "de maduracion" 
  }


  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 12 }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
          <IconButton color="inherit" size="small" onClick={() => navigate('/')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>{farm.name}</Typography>
        </Box>
        <Typography variant="caption" sx={{ pl: 5 }}>
          💧 Tanque: {farm.tankCapacity}L
        </Typography>
      </Box>

      <Box sx={{ px: 2, py: 3, maxWidth: 480, mx: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Active crops */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="subtitle1" fontWeight={700}>
            Mis cultivos ({activeCrops.length})
          </Typography>
          <Button
            size="small" variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
          >
            Agregar
          </Button>
        </Box>

        {activeCrops.length === 0 ? (
          <Card elevation={0} sx={{ border: '1.5px dashed', borderColor: 'grey.300', mb: 3 }}>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" mb={2}>
                No tenés cultivos activos todavía
              </Typography>
              <Button variant="contained" onClick={() => setAddOpen(true)}>
                Agregar primer cultivo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Box display="flex" flexDirection="column" gap={1.5} mb={3}>
            {activeCrops.map(fc => {
              const cropInfo = crops.find(c => c.id === fc.cropId)
              const tol = toleranceLabel(cropInfo?.droughtTolerance ?? 3)
              return (
                <Card key={fc.id} elevation={1}>
                  <CardContent sx={{ py: '12px !important' }}>
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                      <Box flex={1}>
                        <Typography fontWeight={600}>{fc.cropName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {fc.area} m²
                          {fc.plantingDate && ` · Plantado ${new Date(fc.plantingDate).toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })}`}
                          {fc.currentStage && ` · Etapa ${toSpanish(fc.currentStage)}`}
                        </Typography>
                        <Box mt={0.75}>
                          <Chip
                            label={tol.label}
                            color={tol.color}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          {fc.isPerennial && (
                            <Chip
                              label="Perenne"
                              size="small"
                              sx={{ height: 20, fontSize: '0.7rem', ml: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleHarvest(fc.id)}
                        title="Marcar como cosechado"
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Simulate button */}
        {activeCrops.length > 0 && (
          <Button
            variant="contained"
            size="large"
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={() => setSimOpen(true)}
          >
            Calcular plan de riego
          </Button>
        )}
      </Box>

      {/* FAB for mobile */}
      <Fab
        color="primary"
        size="medium"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => setAddOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* Add crop dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={700}>Agregar cultivo</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField
              select
              label="Cultivo"
              value={addForm.cropId}
              onChange={e => setAddForm(f => ({ ...f, cropId: e.target.value }))}
              fullWidth
            >
              {crops.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name} {c.isPerennial ? '(perenne)' : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Área (m²)"
              type="number"
              placeholder="30"
              value={addForm.area}
              onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))}
              fullWidth
              helperText="Aproximado está bien — podés usar surcos × largo"
            />

            {selectedCrop?.isPerennial ? (
              <TextField
                select
                label="¿En qué etapa está?"
                value={addForm.currentStage}
                onChange={e => setAddForm(f => ({ ...f, currentStage: e.target.value }))}
                fullWidth
              >
                <MenuItem value="initial">Brotación / inicio</MenuItem>
                <MenuItem value="mid">Crecimiento / producción</MenuItem>
                <MenuItem value="late">Maduración / fin</MenuItem>
              </TextField>
            ) : (
              <TextField
                label="Fecha de siembra"
                type="date"
                value={addForm.plantingDate}
                onChange={e => setAddForm(f => ({ ...f, plantingDate: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="¿Cuándo lo plantaste?"
              />
            )}


          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleAddCrop}
            disabled={adding || !addForm.cropId || !addForm.area}
          >
            {adding ? <CircularProgress size={20} color="inherit" /> : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Priority + simulate dialog */}
      <Dialog open={simOpen} onClose={() => !simulating && setSimOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle fontWeight={700}>¿Qué querés proteger?</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={1.5} pt={1}>
            {PRIORITY_OPTIONS.map(opt => (
              <Card
                key={opt.value}
                elevation={0}
                onClick={() => setPriority(opt.value)}
                sx={{
                  border: '2px solid',
                  borderColor: priority === opt.value ? 'primary.main' : 'grey.200',
                  borderRadius: 2,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                  bgcolor: priority === opt.value ? 'primary.50' : 'white',
                }}
              >
                <CardContent sx={{ py: '12px !important' }}>
                  <Typography fontWeight={600} fontSize="0.95rem">{opt.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{opt.description}</Typography>
                </CardContent>
              </Card>
            ))}
            <TextField
              label="Fecha para iniciar el riego"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              fullWidth
              helperText="Cuando quieres iniciar la simulacion?"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSimOpen(false)} disabled={simulating}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSimulate}
            disabled={simulating}
          >
            {simulating
              ? <><CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />Calculando...</>
              : 'Calcular'
            }
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}