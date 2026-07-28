export type PaymentMethod =
  | "EFECTIVO"
  | "DEBITO"
  | "CREDITO"
  | "TRANSFERENCIA"
  | "OTRO";

export type DocumentType =
  | "BOLETA"
  | "FACTURA";

export interface Sale {
  id: number;
  sale_date: string;

  total: number | string;
  payment_method: PaymentMethod;

  document_type: DocumentType | null;
  document_number: string | null;
  observation: string | null;

  created_by_user_id: number | null;
  created_by_full_name: string | null;
  created_by_username: string | null;

  total_products: number | string;
  total_items: number | string;
}

export interface SaleHeader {
  id: number;
  sale_date: string;

  total: number | string;
  payment_method: PaymentMethod;

  document_type: DocumentType | null;
  document_number: string | null;
  observation: string | null;

  created_by_user_id: number | null;
  created_by_full_name: string | null;
  created_by_username: string | null;
}

export interface SaleDetail {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;

  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
}

export interface SaleDetailResponse {
  sale: SaleHeader;
  details: SaleDetail[];
}

export interface SaleListParams {
  payment_method?: PaymentMethod;
  document_type?: DocumentType;
  document_number?: string;
  date_from?: string;
  date_to?: string;
}

export interface SaleItemCreateRequest {
  product_id: number;
  quantity: number;
}

export interface SaleCreateRequest {
  payment_method: PaymentMethod;

  document_type: DocumentType | null;
  document_number: string | null;
  observation: string | null;

  items: SaleItemCreateRequest[];
}

export type SaleCreateResponse =
  SaleDetailResponse;