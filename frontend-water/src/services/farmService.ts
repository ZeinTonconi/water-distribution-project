import apiClient from "./apiInstance"
import type { Farm, FarmSummary, FarmCrop, Crop, Municipality } from "../types"

export const getFarms = async (): Promise<FarmSummary[]> => {
  const response = await apiClient.get<FarmSummary[]>('/farms/me')
  return response.data
}

export const getFarm = async (farmId: number): Promise<Farm> => {
  const response = await apiClient.get<Farm>(`/farms/${farmId}`)
  return response.data
}

export const createFarm = async (data: {
  name: string
  municipalityId: number
  tankCapacity: number
}): Promise<Farm> => {
  const response = await apiClient.post<Farm>('/farms', data)
  return response.data
}

export const updateFarm = async (farmId: number, data: {
  tank_capacity_l?: number
  tank_current_pct?: number
  name?: string
}): Promise<Farm> => {
  const response = await apiClient.patch<Farm>(`/farms/${farmId}`, data)
  return response.data
}

export const addCrop = async (farmId: number, data: {
  crop_id: number
  area_m2: number
  planting_date?: string | null
  current_stage?: string | null
}): Promise<FarmCrop> => {
  const response = await apiClient.post<FarmCrop>(`/farms/${farmId}/crops`, data)
  return response.data
}

export const harvestCrop = async (farmId: number, farmCropId: number): Promise<FarmCrop> => {
  const response = await apiClient.patch<FarmCrop>(`/farms/${farmId}/crops/${farmCropId}`, {
    is_harvested: true
  })
  return response.data
}

export const getCrops = async (): Promise<Crop[]> => {
  const response = await apiClient.get<Crop[]>('/crops')
  return response.data
}

export const getMunicipalities = async (): Promise<Municipality[]> => {
  const response = await apiClient.get<Municipality[]>('/municipalities')
  console.log(response.data)
  return response.data
}