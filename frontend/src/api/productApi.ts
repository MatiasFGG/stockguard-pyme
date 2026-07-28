import httpClient from "./httpClient";

import type {
  Product,
  ProductCreateRequest,
  ProductListParams,
  ProductUpdateRequest,
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

export async function getProductById(
  productId: number,
  signal?: AbortSignal,
): Promise<Product> {
  const response = await httpClient.get<Product>(
    `/products/${productId}`,
    {
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

export async function updateProduct(
  productId: number,
  productData: ProductUpdateRequest,
): Promise<void> {
  await httpClient.patch(
    `/products/${productId}`,
    productData,
  );
}

export async function deactivateProduct(
  productId: number,
): Promise<void> {
  await httpClient.patch(
    `/products/${productId}/deactivate`,
  );
}

export async function activateProduct(
  productId: number,
): Promise<void> {
  await httpClient.patch(
    `/products/${productId}/activate`,
  );
}