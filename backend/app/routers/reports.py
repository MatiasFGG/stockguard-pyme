from fastapi import APIRouter, HTTPException, Query

from app.database import fetch_sales_summary, fetch_top_products

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/sales-summary")
def get_sales_summary():
    try:
        summary = fetch_sales_summary()
        return summary
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener resumen de ventas"
        )


@router.get("/top-products")
def get_top_products(limit: int = Query(default=5, ge=1, le=20)):
    try:
        products = fetch_top_products(limit)
        return products
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener productos más vendidos"
        )
        
        