import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box, Typography, CircularProgress
} from '@mui/material'
import type { FarmSummary } from '../types'
import { updateFarm } from '../services/farmService'

interface Props {
  open: boolean
  onClose: () => void
  farm: FarmSummary | null
  onSaved: (updated: FarmSummary) => void
}

interface FormValues {
  name: string
  tankCapacity: number
}

const validationSchema = Yup.object({
  name: Yup.string().min(2, 'El nombre es muy corto').required('El nombre es obligatorio'),
  tankCapacity: Yup.number()
    .min(5, 'Mínimo 5 litros')
    .max(100000, 'Muy grande')
    .required('La capacidad es obligatoria'),
})

export default function EditFarmDialog({ open, onClose, farm, onSaved }: Props) {
  const formik = useFormik<FormValues>({
    initialValues: {
      name: farm?.name ?? '',
      tankCapacity: farm?.tankCapacity ?? 0,
    },
    validationSchema,
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values, { setSubmitting }) => {
      if (!farm) return
      try {
        await updateFarm(farm.id, {
          name: values.name,
          tankCapacity: values.tankCapacity,
        })
        onSaved({ ...farm, name: values.name, tankCapacity: values.tankCapacity })
        onClose()
      } catch {
        // handle silently for now
      } finally {
        setSubmitting(false)
      }
    }
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle fontWeight={700}>Editar chacra</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="edit-farm-form"
          onSubmit={formik.handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
          pt={1}
        >
          <TextField
            label="Nombre"
            {...formik.getFieldProps('name')}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            fullWidth
          />
          <TextField
            label="Capacidad del tanque (litros)"
            type="number"
            {...formik.getFieldProps('tankCapacity')}
            error={formik.touched.tankCapacity && Boolean(formik.errors.tankCapacity)}
            helperText={formik.touched.tankCapacity && formik.errors.tankCapacity}
            fullWidth
          />
          <Typography variant="caption" color="text.secondary">
            Las dimensiones de la chacra no se pueden cambiar después de la creación.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={formik.isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form="edit-farm-form"
          variant="contained"
          disabled={formik.isSubmitting || !formik.isValid}
        >
          {formik.isSubmitting
            ? <CircularProgress size={20} color="inherit" />
            : 'Guardar'
          }
        </Button>
      </DialogActions>
    </Dialog>
  )
}