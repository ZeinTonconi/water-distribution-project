import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material";
import type { FarmSummary, Municipality } from "../types";
import { createFarm } from "../services/farmService";
import { useNavigate } from "react-router-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  municipalities: Municipality[];
  setFarms: (callback: (prev: FarmSummary[]) => FarmSummary[]) => void;
}

export interface FormValues {
  name: string;
  municipalityId: number;
  tankCapacity: number;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "El nombre es muy corto")
    .required("El nombre es obligatorio"),
  municipalityId: Yup.number()
    .min(1, "Seleccioná un municipio")
    .required("El municipio es obligatorio"),
  tankCapacity: Yup.number()
    .min(5, "El tanque debe tener al menos 5 litros")
    .max(100000, "Capacidad muy grande")
    .required("La capacidad es obligatoria")
});

export default function CreateFarmDialog({
  open,
  onClose,
  municipalities,
  setFarms,
}: Props) {
  const navigate = useNavigate();

  const formik = useFormik<FormValues>({
    initialValues: {
      name: "",
      municipalityId: 0,
      tankCapacity: 0,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        console.log(values)
        await handleCreate(values);
        resetForm();
        onClose();
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleCreate = async (values: FormValues) => {
    const farm = await createFarm(values);
    const muni = municipalities.find((m) => m.id === values.municipalityId);
    setFarms((prev) => [
      ...prev,
      {
        id: farm.id,
        name: farm.name,
        municipality: muni!,
        tankCapacity: farm.tankCapacity,
        activeCrops: 0,
      },
    ]);
    navigate(`/farms/${farm.id}`);
  };

  const handleClose = () => {
    if (formik.isSubmitting) return;
    formik.resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle fontWeight={700}>Nueva chacra</DialogTitle>

      <DialogContent>
        <Box
          component="form"
          id="create-farm-form"
          onSubmit={formik.handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
          pt={1}
        >
          <TextField
            label="Nombre"
            placeholder="Mi chacra del norte"
            {...formik.getFieldProps("name")}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            fullWidth
          />

          <TextField
            select
            label="Municipio"
            {...formik.getFieldProps("municipalityId")}
            error={
              formik.touched.municipalityId &&
              Boolean(formik.errors.municipalityId)
            }
            helperText={
              formik.touched.municipalityId && formik.errors.municipalityId
            }
            fullWidth
          >
            <MenuItem value={0} disabled>
              Seleccioná un municipio
            </MenuItem>
            {municipalities.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Capacidad del tanque (litros)"
            type="number"
            placeholder="1200"
            {...formik.getFieldProps("tankCapacity")}
            error={
              formik.touched.tankCapacity &&
              Boolean(formik.errors.tankCapacity)
            }
            helperText={
              formik.touched.tankCapacity && formik.errors.tankCapacity
            }
            fullWidth
          />

          {/* <TextField
            select
            label="¿Qué tan lleno está el tanque?"
            {...formik.getFieldProps("tank_current_pct")}
            fullWidth
          >
            <MenuItem value={1.0}>🟢 Lleno (100%)</MenuItem>
            <MenuItem value={0.75}>🟡 Casi lleno (75%)</MenuItem>
            <MenuItem value={0.5}>🟡 Medio (50%)</MenuItem>
            <MenuItem value={0.25}>🟠 Poco (25%)</MenuItem>
            <MenuItem value={0.1}>🔴 Casi vacío (10%)</MenuItem>
          </TextField> */}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={formik.isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="create-farm-form"
          variant="contained"
          disabled={formik.isSubmitting || !formik.dirty}
          onClick ={ () => {
            console.log(formik.errors)
          }}
        >
          {formik.isSubmitting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Crear"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
