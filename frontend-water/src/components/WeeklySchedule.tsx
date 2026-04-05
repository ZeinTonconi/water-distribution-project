import { Box, Card, CardContent, Typography, LinearProgress, Chip } from '@mui/material'
import type { SimulationWeek } from '../types'

interface Props {
  weeks: SimulationWeek[]
}

export default function WeeklySchedule({ weeks }: Props) {
  if (weeks.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" py={3}>
        No hay datos disponibles
      </Typography>
    )
  }

  const weeksWithDemand = weeks.filter(w =>
    w.crops.some(c => c.demanded_l > 0)
  )

  if (weeksWithDemand.length === 0) {
    return (
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'success.light', bgcolor: 'success.50' }}>
        <CardContent>
          <Typography color="success.dark" fontWeight={500}>
            🌧️ La lluvia cubre todo el riego en este período. No necesitás usar el tanque.
          </Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {weeksWithDemand.map(week => {
        const date = new Date(week.date)
        const dateStr = date.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' })
        const activeCrops = week.crops.filter(c => c.demanded_l > 0)
        const allGood = activeCrops.every(c => c.satisfaction_pct >= 90)
        const someStressed = activeCrops.some(c => c.satisfaction_pct < 50)

        return (
          <Card
            key={week.week}
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: someStressed ? 'error.light' : allGood ? 'success.light' : 'grey.200',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ py: '10px !important' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight={700} fontSize="0.875rem">
                  Semana {week.week} · {dateStr}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  💧 {Math.round(week.tank_level_l).toLocaleString('es-BO')} L en tanque
                </Typography>
              </Box>

              <Box display="flex" flexDirection="column" gap={0.75}>
                {activeCrops.map(crop => {
                  const pct = crop.satisfaction_pct
                  const color = pct >= 90 ? '#059669' : pct >= 50 ? '#d97706' : '#dc2626'
                  const bgColor = pct >= 90 ? '#d1fae5' : pct >= 50 ? '#fef3c7' : '#fef2f2'

                  return (
                    <Box key={crop.farm_crop_id}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.25}>
                        <Typography variant="caption" fontWeight={500}>
                          {crop.crop_name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round(crop.allocated_l).toLocaleString('es-BO')} L
                          </Typography>
                          <Chip
                            label={`${pct}%`}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.65rem',
                              bgcolor: bgColor,
                              color: color,
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(pct, 100)}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: '#f3f4f6',
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 }
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </CardContent>
          </Card>
        )
      })}
    </Box>
  )
}