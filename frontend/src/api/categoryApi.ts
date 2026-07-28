import httpClient from "./httpClient";

import type {
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
} from "../types/category";

export async function getCategories(
  signal?: AbortSignal,
): Promise<Category[]> {
  const response = await httpClient.get<
    Category[]
  >("/categories", {
    signal,
  });

  return response.data;
}

export async function createCategory(
  categoryData: CategoryCreateRequest,
): Promise<void> {
  await httpClient.post(
    "/categories",
    categoryData,
  );
}

export async function updateCategory(
  categoryId: number,
  categoryData: CategoryUpdateRequest,
): Promise<void> {
  await httpClient.patch(
    `/categories/${categoryId}`,
    categoryData,
  );
}