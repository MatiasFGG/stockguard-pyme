import httpClient from "./httpClient";

import type {
  Product,
  ProductCreateRequest,
  ProductListParams,
} from "../types/product";

export async function getProducts(
  params: ProductListParams = {},
  signal?: AbortSignal,
): Promise<Product[]> {
  const response = await httpClient.get<Product[]>(
    "/products",
    {
      params,
      signal,
    },
  );

  return response.data;
}

export async function createProduct(
  productData: ProductCreateRequest,
): Promise<void> {
  await httpClient.post(
    "/products",
    productData,
  );
}