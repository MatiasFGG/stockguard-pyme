from fastapi import APIRouter, HTTPException

from app.database import fetch_product_by_id, fetch_products

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


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
        
@router.get("/{product_id}")
def get_product(product_id: int):
    product = fetch_product_by_id(product_id)

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return product        

