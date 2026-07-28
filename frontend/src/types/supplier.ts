export interface Supplier {
  id: number;
  name: string;

  phone: string | null;
  email: string | null;
  address: string | null;

  active: boolean;
}

export interface SupplierCreateRequest {
  name: string;

  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface SupplierUpdateRequest {
  name: string;

  phone: string | null;
  email: string | null;
  address: string | null;
}