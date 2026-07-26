from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

from app.database import (
    activate_product,
    create_product,
    deactivate_product,
    fetch_low_stock_products,
    fetch_product_by_id,
    fetch_products,
    update_product
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

class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None
    barcode: str | None = None
    purchase_price: float | None = Field(default=None, ge=0)
    sale_price: float | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    category_id: int | None = Field(default=None, gt=0)
    supplier_id: int | None = Field(default=None, gt=0)

@router.get("")
def list_products(
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None, gt=0),
    supplier_id: int | None = Query(default=None, gt=0),
    active: bool | None = Query(default=None)
):
    try:
        products = fetch_products(
            search=search,
            category_id=category_id,
            supplier_id=supplier_id,
            active=active
        )

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
              
@router.get("/low-stock")
def list_low_stock_products():
    try:
        products = fetch_low_stock_products()
        return products
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener productos con stock bajo"
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

@router.patch("/{product_id}")
def edit_product(product_id: int, product: ProductUpdate):
    try:
        result = update_product(
            product_id,
            product.model_dump()
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al actualizar producto"
        )

    if result.get("error") == "PRODUCT_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    if result.get("error") == "CATEGORY_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Categoría no encontrada"
        )

    if result.get("error") == "SUPPLIER_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Proveedor no encontrado"
        )

    return result

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

