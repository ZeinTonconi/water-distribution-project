import { Box } from '@mui/material'

interface Props {
  children: React.ReactNode
  maxWidth?: number
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 8 }}>
      {children}
    </Box>
  )
}

export function PageContent({ children, maxWidth = 480 }: Props) {
  return (
    <Box sx={{ px: 2, py: 3, maxWidth, mx: 'auto' }}>
      {children}
    </Box>
  )
}