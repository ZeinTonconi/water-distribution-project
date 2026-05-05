import { useEffect } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Box, Typography
} from '@mui/material'
import type { Crop, ParcelGroup } from '../types'

interface Props {
  open: boolean
  onClose: () => void
  crops: Crop[]
  group: ParcelGroup | null
  onSave: (id: string, values: EditParcelValues) => void
}

export interface EditParcelValues {
  cropId: number
  parcelCount: number
  parcelWidth: number
  parcelLength: number
  plantingDate: string
  currentStage: string
}

const validationSchema = Yup.object({
  cropId: Yup.number().min(1, 'Seleccioná un cultivo').required(),
  parcelCount: Yup.number().min(1).max(50).required('La cantidad es obligatoria'),
  parcelWidth: Yup.number().min(0.5).max(200).required('El ancho es obligatorio'),
  parcelLength: Yup.number().min(0.5).max(200).required('El largo es obligatorio'),
})

export default function EditParcelDialog({ open, onClose, crops, group, onSave }: Props) {
  const formik = useFormik<EditParcelValues>({
    initialValues: {
      cropId: group?.cropId ?? 0,
      parcelCount: group?.parcelCount ?? 1,
      parcelWidth: group?.parcelWidth ?? 0,
      parcelLength: group?.parcelLength ?? 0,
      plantingDate: group?.plantingDate ?? '',
      currentStage: group?.currentStage ?? 'mid',
    },
    validationSchema,
    enableReinitialize: true,  // re-fills when group changes
    validateOnMount: true,
    onSubmit: (values, { setSubmitting }) => {
      if (!group) return
      onSave(group.id, values)
      setSubmitting(false)
      onClose()
    }
  })

  const selectedCrop = crops.find(c => c.id === Number(formik.values.cropId))
  const totalArea = formik.values.parcelCount && formik.values.parcelWidth && formik.values.parcelLength
    ? (formik.values.parcelCount * formik.values.parcelWidth * formik.values.parcelLength).toFixed(1)
    : null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle fontWeight={700}>Editar cultivo</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="edit-parcel-form"
          onSubmit={formik.handleSubmit}
          display="flex"
          flexDirection="column"
          gap={2}
          pt={1}
        >
          <TextField
            select
            label="Cultivo"
            {...formik.getFieldProps('cropId')}
            error={formik.touched.cropId && Boolean(formik.errors.cropId)}
            helperText={formik.touched.cropId && formik.errors.cropId}
            fullWidth
          >
            <MenuItem value={0} disabled>Seleccioná un cultivo</MenuItem>
            {crops.map(c => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.isPerennial ? '(perenne)' : ''}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Número de parcelas"
            type="number"
            {...formik.getFieldProps('parcelCount')}
            error={formik.touched.parcelCount && Boolean(formik.errors.parcelCount)}
            helperText={formik.touched.parcelCount && formik.errors.parcelCount}
            fullWidth
          />

          <Box display="flex" gap={1.5}>
            <TextField
              label="Ancho (m)"
              type="number"
              {...formik.getFieldProps('parcelWidth')}
              error={formik.touched.parcelWidth && Boolean(formik.errors.parcelWidth)}
              helperText={formik.touched.parcelWidth && formik.errors.parcelWidth}
              fullWidth
            />
            <TextField
              label="Largo (m)"
              type="number"
              {...formik.getFieldProps('parcelLength')}
              error={formik.touched.parcelLength && Boolean(formik.errors.parcelLength)}
              helperText={formik.touched.parcelLength && formik.errors.parcelLength}
              fullWidth
            />
          </Box>

          {totalArea && (
            <Box bgcolor="#e8f0fe" borderRadius={2} px={2} py={1.5}
              border="1px solid #c7d7f9">
              <Typography variant="body2" fontWeight={600} color="primary.main">
                Área total: {totalArea} m²
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formik.values.parcelCount} parcela{Number(formik.values.parcelCount) > 1 ? 's' : ''} de {formik.values.parcelWidth}m × {formik.values.parcelLength}m
              </Typography>
            </Box>
          )}

          {selectedCrop?.isPerennial ? (
            <TextField
              select
              label="¿En qué etapa está?"
              {...formik.getFieldProps('currentStage')}
              fullWidth
            >
              <MenuItem value="initial">Brotación / inicio</MenuItem>
              <MenuItem value="mid">Crecimiento / producción</MenuItem>
              <MenuItem value="late">Maduración / fin</MenuItem>
            </TextField>
          ) : selectedCrop ? (
            <TextField
              label="Fecha de siembra"
              type="date"
              {...formik.getFieldProps('plantingDate')}
              fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="¿Cuándo lo plantaste?"
            />
          ) : null}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          type="submit"
          form="edit-parcel-form"
          variant="contained"
          disabled={formik.isSubmitting || !formik.isValid}
        >
          Guardar cambios
        </Button>
      </DialogActions>
    </Dialog>
  )
}