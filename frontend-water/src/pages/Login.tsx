import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";

type Mode = "login" | "register";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      mode === "login"
        ? await login(name, password)
        : await register(name, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Algo salió mal. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        background: "linear-gradient(135deg, #e8f0fe 0%, #f0f7ff 100%)",
      }}
    >
      <Card
        sx={{ width: "100%", maxWidth: 400, borderRadius: 3 }}
        elevation={3}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography
            variant="h4"
            fontWeight={700}
            color="primary"
            textAlign="center"
            mb={0.5}
          >
            💧 AguaChacra
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            mb={3}
          >
            {mode === "login" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}
          </Typography>

          <Box
            component="form"
            onSubmit={handleSubmit}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <TextField
              label="Tu nombre"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              fullWidth
            />

            <TextField
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
            />

            {error && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {error}
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 1 }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : mode === "login" ? (
                "Ingresar"
              ) : (
                "Registrarse"
              )}
            </Button>
          </Box>

          <Button
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => {
              setMode((m) => (m === "login" ? "register" : "login"));
              setError(null);
            }}
          >
            {mode === "login"
              ? "¿No tenés cuenta? Registrate"
              : "¿Ya tenés cuenta? Ingresá"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
