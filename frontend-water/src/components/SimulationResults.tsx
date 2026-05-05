import { useState } from 'react'
import { Box, Typography, Card, CardContent, Chip, Tabs, Tab } from '@mui/material'
import TankChart from './TankChart'
import WeeklySchedule from './WeeklySchedule'
import type { SimulationResponse } from '../types'

interface Props {
  result: SimulationResponse
}

export default function SimulationResults({ result }: Props) {
  const [tab, setTab] = useState(0)
  const opt = result.optimized
  const naive = result.naive

  const diff = opt.overallSatisfactionPct - naive.overallSatisfactionPct
  const summaryText = opt.status === 'infeasible'
    ? 'No hay suficiente agua para ningún cultivo en este período.'
    : diff > 5
      ? `Con el plan optimizado tus cultivos reciben ${diff}% más agua que repartiendo por igual.`
      : 'El plan de riego está calculado para el período seleccionado.'


  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        Plan de riego
      </Typography>

      <Card elevation={1} sx={{ mb: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
        <CardContent>
          <Typography variant="body2" fontWeight={500}>{summaryText}</Typography>
          <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
            <Chip label={`Optimizado: ${opt.overallSatisfactionPct}%`} color="primary" size="small" />
            <Chip label={`Sin plan: ${naive.overallSatisfactionPct}%`} variant="outlined" size="small" />
          </Box>
        </CardContent>
      </Card>

      <Typography variant="caption" fontWeight={700} display="block" mb={1}>
        Nivel del tanque semana a semana
      </Typography>
      <Card elevation={1} sx={{ mb: 2, p: 1 }}>
        <TankChart
          optimized={opt.weeks}
          naive={naive.weeks}
          tankCapacity={
            opt.weeks.length > 0
              ? Math.max(...opt.weeks.map(w => w.tankLevelL)) * 1.1
              : 5000
          }
        />
      </Card>
      {opt.cropSummary && opt.cropSummary.length > 0 && (
        <Box mb={2}>
          <Typography variant="caption" fontWeight={700} display="block" mb={1}>
            Resumen por cultivo
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {opt.cropSummary.map((c: any) => (
              <Card key={c.farmCropId} elevation={0}
                sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, px: 1.5, py: 1 }}>
                <Typography variant="caption" fontWeight={700} display="block">
                  {c.cropName}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Satisfacción: {c.satisfactionPct}%
                </Typography>
                {c.harvestWeek && (
                  <Typography variant="caption" color="success.main" display="block">
                    🌾 Cosecha estimada: semana {c.harvestWeek}
                  </Typography>
                )}
                {c.isPerennial && (
                  <Typography variant="caption" color="info.main" display="block">
                    🌿 Cultivo perenne
                  </Typography>
                )}
              </Card>
            ))}
          </Box>
        </Box>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Plan optimizado" />
        <Tab label="Sin plan" />
      </Tabs>

      <WeeklySchedule weeks={tab === 0 ? opt.weeks : naive.weeks} />
    </Box>
  )
}