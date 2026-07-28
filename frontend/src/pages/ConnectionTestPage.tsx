import axios from "axios";
import { useEffect, useState } from "react";

import httpClient from "../api/httpClient";
import type { OpenApiDocument } from "../types/openApi";

function ConnectionTestPage() {
  const [message, setMessage] = useState(
    "Comprobando conexión con el backend...",
  );

  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let componentMounted = true;

    async function checkConnection() {
      try {
        const response =
          await httpClient.get<OpenApiDocument>("/openapi.json");

        if (!componentMounted) {
          return;
        }

        const routeCount = Object.keys(response.data.paths).length;

        setConnected(true);
        setMessage(
          `Conectado a "${response.data.info.title}". ` +
            `Rutas detectadas: ${routeCount}.`,
        );
      } catch (error: unknown) {
        if (!componentMounted) {
          return;
        }

        setConnected(false);

        if (axios.isAxiosError(error)) {
          if (error.response) {
            setMessage(
              `El backend respondió con el código ${error.response.status}.`,
            );
          } else {
            setMessage(
              "No se pudo contactar al backend. Revisa que FastAPI esté ejecutándose.",
            );
          }

          return;
        }

        setMessage("Ocurrió un error inesperado al comprobar la conexión.");
      }
    }

    void checkConnection();

    return () => {
      componentMounted = false;
    };
  }, []);

  return (
    <main>
      <h1>Conexión con la API</h1>

      <p role="status">
        {connected === true && "✅ "}
        {connected === false && "❌ "}
        {message}
      </p>
    </main>
  );
}

export default ConnectionTestPage;