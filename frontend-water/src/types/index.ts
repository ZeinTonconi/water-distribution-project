export interface User {
  id: number
  name: string
}

export interface Municipality {
  id: number
  name: string
  latitude: number
  longitude: number
  altitude: number
}

export interface Crop {
  id: number
  name: string
  isPerennial: boolean
  kcInitial: number
  kcMid: number
  kcLate: number
  droughtTolerance: number
  minWater: number
}

export interface FarmCrop {
  id: number
  cropId: number
  cropName: string
  plantingDate: string | null
  currentStage: 'initial' | 'mid' | 'late' | null
  isHarvested: boolean
  isPerennial: boolean
  areaMd: number
  parcels: Parcel[]
}

export interface Farm {
  id: number
  name: string
  municipalityId: number
  tankCapacity: number
  farmWidthM: number
  farmHeightM: number
  crops: FarmCrop[]
}

export interface FarmSummary {
  id: number
  name: string
  municipality: Municipality
  tankCapacity: number
  farmWidthM: number
  farmHeightM: number
  activeCrops: number
}

export type Priority = 'sensitive' | 'equal' | 'economic'

export interface SimulationResponse {
  optimized: SimulationResult
  naive: SimulationResult
}

export interface Parcel {
  id: number
  parcelCount: number
  widthM: number
  lengthM: number
  x: number
  y: number
  rotation: number
}

export interface ParcelGroup {
  id: string
  x: number
  y: number
  parcelCount: number
  parcelWidth: number
  parcelLength: number
  rotation: number        // 0 or 90 only
  cropId: number | null
  cropName: string | null
  plantingDate: string | null
  currentStage: 'initial' | 'mid' | 'late' | null
}

export const CANVAS_W = 860
export const CANVAS_H = 620
export const PADDING = 40

// Single uniform scale — preserves real proportions
export const getScale = (farmWidthM: number, farmHeightM: number) => {
  const scaleX = (CANVAS_W - PADDING * 2) / farmWidthM
  const scaleY = (CANVAS_H - PADDING * 2) / farmHeightM
  const scale = Math.min(scaleX, scaleY)  // uniform — 1:1 ratio
  return { scaleX: scale, scaleY: scale }
}

export const getGroupCanvasDimensions = (
  group: ParcelGroup,
  scale: number
) => {
  const rectW = group.parcelCount * group.parcelWidth * scale
  const rectH = group.parcelLength * scale
  // After rotation, visual dimensions swap
  const visualW = group.rotation === 90 ? rectH : rectW
  const visualH = group.rotation === 90 ? rectW : rectH
  return { rectW, rectH, visualW, visualH }
}

export const getGroupArea = (group: ParcelGroup) =>
  group.parcelCount * group.parcelWidth * group.parcelLength

export interface SimulationCropWeek {
  farmCropId: number
  cropName: string
  allocatedL: number
  demandedL: number
  satisfactionPct: number
}

export interface SimulationWeek {
  week: number
  date: string
  tankLevelL: number
  crops: SimulationCropWeek[]
}

export interface CropSummary {
  farmCropId: number
  cropName: string
  isPerennial: boolean
  satisfactionPct: number
  harvestWeek: number | null
}


export interface SimulationResult {
  simulationId: number
  type: string
  status: string
  overallSatisfactionPct: number
  cropSummary: CropSummary[]
  weeks: SimulationWeek[]
}