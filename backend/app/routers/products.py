from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from app.database import (
    activate_product,
    create_product,
    deactivate_product,
    fetch_product_by_id,
    fetch_products
)

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    barcode: str | None = None
    purchase_price: float = Field(ge=0)
    sale_price: float = Field(ge=0)
    current_stock: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)
    category_id: int
    supplier_id: int | None = None

@router.get("")
def list_products():
    try:
        products = fetch_products()
        return products
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener productos"
        )
      
@router.post("")
def add_product(product: ProductCreate):
    try:
        created_product = create_product(product.model_dump())
        return created_product
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al crear producto"
        )
              
        
@router.get("/{product_id}")
def get_product(product_id: int):
    product = fetch_product_by_id(product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return product        

@router.patch("/{product_id}/deactivate")
def disable_product(product_id: int):
    product = deactivate_product(product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return product


@router.patch("/{product_id}/activate")
def enable_product(product_id: int):
    product = activate_product(product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return product