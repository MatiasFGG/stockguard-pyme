import httpClient from "./httpClient";

import type {
  Sale,
  SaleCreateRequest,
  SaleCreateResponse,
  SaleDetailResponse,
  SaleListParams,
} from "../types/sale";

export async function getSales(
  params: SaleListParams = {},
  signal?: AbortSignal,
): Promise<Sale[]> {
  const response = await httpClient.get<
    Sale[]
  >("/sales", {
    params,
    signal,
  });

  return response.data;
}

export async function getSaleById(
  saleId: number,
  signal?: AbortSignal,
): Promise<SaleDetailResponse> {
  const response =
    await httpClient.get<SaleDetailResponse>(
      `/sales/${saleId}`,
      {
        signal,
      },
    );

  return response.data;
}

export async function createSale(
  saleData: SaleCreateRequest,
): Promise<SaleCreateResponse> {
  const response =
    await httpClient.post<SaleCreateResponse>(
      "/sales",
      saleData,
    );

  return response.data;
}