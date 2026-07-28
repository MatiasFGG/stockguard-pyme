import httpClient from "./httpClient";

import type { Product } from "../types/product";

import type {
  SalesReportParams,
  SalesSummary,
  TopProduct,
  TopProductsParams,
} from "../types/report";

export async function getSalesSummary(
  params: SalesReportParams = {},
  signal?: AbortSignal,
): Promise<SalesSummary> {
  const response =
    await httpClient.get<SalesSummary>(
      "/reports/sales-summary",
      {
        params,
        signal,
      },
    );

  return response.data;
}

export async function getTopProducts(
  params: TopProductsParams = {},
  signal?: AbortSignal,
): Promise<TopProduct[]> {
  const response =
    await httpClient.get<TopProduct[]>(
      "/reports/top-products",
      {
        params,
        signal,
      },
    );

  return response.data;
}

export async function getLowStockProducts(
  signal?: AbortSignal,
): Promise<Product[]> {
  const response =
    await httpClient.get<Product[]>(
      "/products/low-stock",
      {
        signal,
      },
    );

  return response.data;
}