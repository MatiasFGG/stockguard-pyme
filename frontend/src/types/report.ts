export interface SalesSummary {
  total_sales_amount: number | string;
  total_sales: number | string;
  total_items_sold: number | string;
  average_sale_amount: number | string;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  total_quantity_sold: number | string;
  total_amount_sold: number | string;
}

export interface SalesReportParams {
  date_from?: string;
  date_to?: string;
}

export interface TopProductsParams
  extends SalesReportParams {
  limit?: number;
}