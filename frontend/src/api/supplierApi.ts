import httpClient from "./httpClient";

import type { Supplier } from "../types/supplier";

export async function getSuppliers(
  signal?: AbortSignal,
): Promise<Supplier[]> {
  const response = await httpClient.get<Supplier[]>(
    "/suppliers",
    {
      signal,
    },
  );

  return response.data;
}