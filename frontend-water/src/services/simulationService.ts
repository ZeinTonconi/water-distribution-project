import apiClient from "./apiInstance"
import type { SimulationResponse } from "../types"

export const simulateFarm = async (
  farmId: number,
  data: {
    priority: 'sensitive' | 'equal' | 'economic'
    nWeeks: number
    startDate: string
  }
): Promise<SimulationResponse> => {
  const response = await apiClient.post<SimulationResponse>(
    `/farms/${farmId}/simulate`,
    data
  )
  return response.data
}