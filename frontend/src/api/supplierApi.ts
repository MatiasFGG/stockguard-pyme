import httpClient from "./httpClient";

import type {
  Supplier,
  SupplierCreateRequest,
  SupplierUpdateRequest,
} from "../types/supplier";

export async function getSuppliers(
  signal?: AbortSignal,
): Promise<Supplier[]> {
  const response = await httpClient.get<
    Supplier[]
  >("/suppliers", {
    signal,
  });

  return response.data;
}

export async function createSupplier(
  supplierData: SupplierCreateRequest,
): Promise<void> {
  await httpClient.post(
    "/suppliers",
    supplierData,
  );
}

export async function updateSupplier(
  supplierId: number,
  supplierData: SupplierUpdateRequest,
): Promise<void> {
  await httpClient.patch(
    `/suppliers/${supplierId}`,
    supplierData,
  );
}