import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, IconButton,
  Alert, Chip, Tab, Tabs, Divider
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import TankChart from '../components/TankChart'
import WeeklySchedule from '../components/WeeklySchedule'
import type { SimulationResponse } from '../types'

export default function Results() {
  const { farmId } = useParams<{ farmId: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    const stored = sessionStorage.getItem('simulationResult')
    if (!stored) {
      navigate(`/farms/${farmId}`)
      return
    }
    setResult(JSON.parse(stored))
  }, [farmId, navigate])

  if (!result) return null

  const opt = result.optimized
  const naive = result.naive

  const summaryText = () => {
    if (opt.status === 'infeasible') {
      return 'No hay suficiente agua para ningún cultivo en este período.'
    }
    const weeks = opt.weeks
    const lastGoodWeek = [...weeks].reverse().find(w =>
      w.crops.some(c => c.demanded_l > 0 && c.satisfaction_pct >= 80)
    )
    if (!lastGoodWeek) return 'El agua disponible es muy limitada para este período.'

    const diff = opt.overall_satisfaction_pct - naive.overall_satisfaction_pct
    if (diff > 5) {
      return `Con el plan optimizado tus cultivos reciben ${diff}% más agua que repartiendo por igual.`
    }
    return `Tu tanque cubre el riego hasta la semana ${lastGoodWeek.week} con buena eficiencia.`
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 2 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton color="inherit" size="small" onClick={() => navigate(`/farms/${farmId}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700}>Plan de riego</Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, py: 3, maxWidth: 480, mx: 'auto' }}>

        {/* Summary card */}
        <Card elevation={1} sx={{ mb: 3, borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Typography variant="body1" fontWeight={500}>
              {summaryText()}
            </Typography>
            <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
              <Chip
                label={`Optimizado: ${opt.overall_satisfaction_pct}%`}
                color="primary" size="small"
              />
              <Chip
                label={`Sin plan: ${naive.overall_satisfaction_pct}%`}
                variant="outlined" size="small"
              />
            </Box>
          </CardContent>
        </Card>

        {/* Tank chart */}
        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Nivel del tanque semana a semana
        </Typography>
        <Card elevation={1} sx={{ mb: 3, p: 1 }}>
          <TankChart
            optimized={opt.weeks}
            naive={naive.weeks}
            tankCapacity={
              opt.weeks.length > 0
                ? Math.max(...opt.weeks.map(w => w.tank_level_l)) * 1.1
                : 5000
            }
          />
        </Card>

        {/* Weekly schedule */}
        <Typography variant="subtitle2" fontWeight={700} mb={1}>
          Calendario de riego
        </Typography>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Plan optimizado" />
          <Tab label="Sin plan" />
        </Tabs>

        <WeeklySchedule weeks={tab === 0 ? opt.weeks : naive.weeks} />

      </Box>
    </Box>
  )
}