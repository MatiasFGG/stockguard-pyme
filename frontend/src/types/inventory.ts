export type InventoryMovementType =
  | "ENTRADA"
  | "VENTA"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
  | "MERMA";

export type ManualAdjustmentType =
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
  | "MERMA";

export interface InventoryMovement {
  id: number;

  product_id: number;
  product_name: string;

  movement_type: InventoryMovementType;

  quantity: number | string;
  movement_date: string;

  reason: string;
  reference: string | null;
}

export interface StockAdjustmentRequest {
  product_id: number;

  movement_type: ManualAdjustmentType;

  quantity: number;
  reason: string;
  reference: string | null;
}

export interface AdjustedProduct {
  id: number;
  name: string;
  current_stock: number | string;
}

export interface StockAdjustmentResponse {
  product: AdjustedProduct;
  movement: InventoryMovement;
}