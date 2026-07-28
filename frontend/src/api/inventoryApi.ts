import httpClient from "./httpClient";

import type {
  InventoryMovement,
  StockAdjustmentRequest,
  StockAdjustmentResponse,
} from "../types/inventory";

interface StockAdjustmentApiResponse {
  product: StockAdjustmentResponse["product"];

  movement: Omit<
    InventoryMovement,
    "product_name"
  >;
}

export async function getInventoryMovements(
  signal?: AbortSignal,
): Promise<InventoryMovement[]> {
  const response = await httpClient.get<
    InventoryMovement[]
  >("/inventory-movements", {
    signal,
  });

  return response.data;
}

export async function adjustProductStock(
  adjustmentData: StockAdjustmentRequest,
): Promise<StockAdjustmentResponse> {
  const response =
    await httpClient.post<StockAdjustmentApiResponse>(
      "/inventory-movements/adjust",
      adjustmentData,
    );

  return {
    product: response.data.product,

    movement: {
      ...response.data.movement,
      product_name: response.data.product.name,
    },
  };
}