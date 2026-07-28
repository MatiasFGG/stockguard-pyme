import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error(
    "Falta configurar la variable VITE_API_URL en el archivo .env.local",
  );
}

const httpClient = axios.create({
  baseURL: apiUrl,
  timeout: 10_000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default httpClient;