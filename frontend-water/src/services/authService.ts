import axios from "axios";
import apiClient from "./apiInstance";
import type { LoginResponse, RegisterResponse } from "./models/AuthResponse";

export const loginUser = async (
  name: string,
  password: string,
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      name,
      password,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || "Error al ingresar");
    }
    throw new Error("Error inesperado");
  }
};

export const registerUser = async (
  name: string,
  password: string,
): Promise<RegisterResponse> => {
  try {
    const response = await apiClient.post<RegisterResponse>("/auth/register", {
      name,
      password,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || "Error al registrarse");
    }
    throw new Error("Error inesperado");
  }
};
