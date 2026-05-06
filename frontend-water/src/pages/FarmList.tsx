import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Fab,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../context/AuthContext";
import { getFarms, getMunicipalities } from "../services/farmService";
import type { FarmSummary, Municipality } from "../types";
import AppHeader from "../components/AppHeader";
import { PageShell, PageContent } from "../components/PageWrapper";
import CreateFarmDialog from "../components/CreateFarmDialog";
import { CardFarmSummary } from "../components/CardFarmSummary";
import EditFarmDialog from "../components/EditFarmDialog";

export default function FarmList() {

  const { user, logout } = useAuth();

  const [farms, setFarms] = useState<FarmSummary[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editFarm, setEditFarm] = useState<FarmSummary | null>(null)

  const handleFarmSaved = (updated: FarmSummary) => {
    setFarms(prev => prev.map(f => f.id === updated.id ? updated : f))
  }

  useEffect(() => {
    Promise.all([getFarms(), getMunicipalities()])
      .then(([f, m]) => {
        setFarms(f);
        setMunicipalities(m);
      })
      .catch(() => setError("No se pudieron cargar las chacras"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <AppHeader
        title="💧 AguaChacra"
        subtitle={`Hola, ${user?.name}`}
        rightAction={
          <Button
            color="inherit"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={logout}
          >
            Salir
          </Button>
        }
      />

      <PageContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Mis chacras
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : farms.length === 0 ? (
          <Box textAlign="center" py={6}>
            <AgricultureIcon
              sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
            />
            <Typography color="text.secondary" mb={2}>
              Todavía no tenés chacras
            </Typography>
            <Button variant="contained" onClick={() => setDialogOpen(true)}>
              Crear mi primera chacra
            </Button>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {farms.map((farm) => (
              <CardFarmSummary farm={farm} key={farm.id} onEdit={setEditFarm} />
            ))}
          </Box>
        )}
      </PageContent>

      {farms.length > 0 && (
        <Fab
          color="primary"
          sx={{ position: "fixed", bottom: 24, right: 24 }}
          onClick={() => setDialogOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      <CreateFarmDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        municipalities={municipalities}
        setFarms={setFarms}
      />
      <EditFarmDialog
        open={Boolean(editFarm)}
        onClose={() => setEditFarm(null)}
        farm={editFarm}
        onSaved={handleFarmSaved}
      />
    </PageShell>
  );
}
