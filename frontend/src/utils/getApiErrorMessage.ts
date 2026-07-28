import axios from "axios";

import type {
  ApiErrorResponse,
  ValidationErrorItem,
} from "../types/auth";

function getValidationMessage(
  detail: ValidationErrorItem[],
): string | null {
  const firstError = detail[0];

  if (
    firstError &&
    typeof firstError.msg === "string"
  ) {
    return firstError.msg;
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallbackMessage;
  }

  if (!error.response) {
    return "No se pudo conectar con el servidor.";
  }

  const detail = error.response.data?.detail;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return (
      getValidationMessage(detail) ??
      fallbackMessage
    );
  }

  return fallbackMessage;
}