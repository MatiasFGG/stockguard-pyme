export interface Product {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;

  purchase_price: number | string;
  sale_price: number | string;

  current_stock: number | string;
  minimum_stock: number | string;

  active: boolean;

  category_id: number;
  category_name: string;

  supplier_id: number | null;
  supplier_name: string | null;
}

export interface ProductListParams {
  search?: string;
  category_id?: number;
  supplier_id?: number;
  active?: boolean;
}

export interface ProductCreateRequest {
  name: string;
  description: string | null;
  barcode: string | null;

  purchase_price: number;
  sale_price: number;

  current_stock: number;
  minimum_stock: number;

  category_id: number;
  supplier_id: number | null;
}