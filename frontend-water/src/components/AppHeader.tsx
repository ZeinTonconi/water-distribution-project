import { Box, IconButton, Typography } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useNavigate } from 'react-router-dom'

interface Props {
  title: string
  subtitle?: string
  backTo?: string
  rightAction?: React.ReactNode
}

export default function AppHeader({ title, subtitle, backTo, rightAction }: Props) {
  const navigate = useNavigate()

  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={1}>
          {backTo && (
            <IconButton color="inherit" size="small" onClick={() => navigate(backTo)}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Box>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {rightAction && <Box>{rightAction}</Box>}
      </Box>
    </Box>
  )
}