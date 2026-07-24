from fastapi import APIRouter, HTTPException

from app.database import fetch_products

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