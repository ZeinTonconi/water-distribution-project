import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import FarmList from './pages/FarmList'
import FarmDetail from './pages/FarmDetail'
import Results from './pages/Results'

const theme = createTheme({
  palette: {
    primary: { main: '#1a56db' },
    success: { main: '#059669' },
    error: { main: '#dc2626' },
    warning: { main: '#d97706' },
    background: { default: '#f0f7ff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><FarmList /></ProtectedRoute>} />
      <Route path="/farms/:farmId" element={<ProtectedRoute><FarmDetail /></ProtectedRoute>} />
      <Route path="/farms/:farmId/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
)