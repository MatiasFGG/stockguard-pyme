export interface Category {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
}

export interface CategoryCreateRequest {
  name: string;
  description: string | null;
}

export interface CategoryUpdateRequest {
  name: string;
  description: string | null;
}