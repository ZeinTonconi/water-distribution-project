import { Card, CardContent, Typography, Box, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import { useNavigate } from 'react-router-dom'
import type { FarmSummary } from '../types'

interface Props {
  farm: FarmSummary
  onEdit: (farm: FarmSummary) => void
}

export function CardFarmSummary({ farm, onEdit }: Props) {
  const navigate = useNavigate()

  const tankLabel = (pct: number) => {
    if (pct >= 0.8) return '🟢 Lleno'
    if (pct >= 0.5) return '🟡 Medio'
    if (pct >= 0.2) return '🟠 Poco'
    return '🔴 Casi vacío'
  }

  const municipalityName = typeof farm.municipality === 'object'
    ? farm.municipality.name
    : farm.municipality

  return (
    <Card
      elevation={1}
      sx={{ cursor: 'pointer' }}
      onClick={() => navigate(`/farms/${farm.id}`)}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography fontWeight={700} fontSize="1rem">{farm.name}</Typography>
            <Typography variant="body2" color="text.secondary" mb={1}>
              📍 {municipalityName}
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Typography variant="caption" bgcolor="primary.light"
                color="primary.dark" px={1} py={0.25} borderRadius={1}>
                🌱 {farm.activeCrops ?? 0} cultivos
              </Typography>
              <Typography variant="caption" bgcolor="grey.100"
                color="text.secondary" px={1} py={0.25} borderRadius={1}>
                💧 {farm.tankCapacity}L — {tankLabel(farm.tankCurrentPct ?? 0.7)}
              </Typography>
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation()  // prevent navigation to FarmDetail
              onEdit(farm)
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  )
}