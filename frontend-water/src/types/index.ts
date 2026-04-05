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
  area: number
  plantingDate: string | null
  currentStage: 'initial' | 'mid' | 'late' | null
  isHarvested: boolean
  isPerennial: boolean
}

export interface Farm {
  id: number
  name: string
  municipalityId: number
  tankCapacity: number
  crops: FarmCrop[]
}
export interface FarmSummary {
  id: number
  name: string
  municipality: Municipality
  tankCapacity: number
  activeCrops: number
}

export type Priority = 'sensitive' | 'equal' | 'economic'

export interface SimulationCropWeek {
  farmCropId: number
  cropName: string
  allocated: number
  demanded: number
  satisfaction: number
}

export interface SimulationWeek {
  week: number
  date: string
  tankLevel: number
  crops: SimulationCropWeek[]
}

export interface SimulationResult {
  simulationId: number
  type: string
  status: string
  overallSatisfaction: number
  weeks: SimulationWeek[]
}

export interface SimulationResponse {
  optimized: SimulationResult
  naive: SimulationResult
}