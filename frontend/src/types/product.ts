export interface Product {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;

  purchase_price: number;
  sale_price: number;

  current_stock: number;
  minimum_stock: number;

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