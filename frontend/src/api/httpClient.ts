import axios from "axios";

import { getAccessToken } from "../utils/tokenStorage";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    "Falta configurar la variable VITE_API_URL en el archivo .env.local",
  );
}

const httpClient = axios.create({
  baseURL: apiUrl,
  timeout: 10_000,
});

httpClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default httpClient;