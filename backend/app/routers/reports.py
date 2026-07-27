from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.database import fetch_sales_summary, fetch_top_products

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/sales-summary")
def get_sales_summary(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None)
):
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="La fecha inicial no puede ser mayor que la fecha final"
        )

    try:
        summary = fetch_sales_summary(
            date_from=date_from,
            date_to=date_to
        )

        return summary
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener resumen de ventas"
        )


@router.get("/top-products")
def get_top_products(
    limit: int = Query(default=5, ge=1, le=20),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None)
):
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="La fecha inicial no puede ser mayor que la fecha final"
        )

    try:
        products = fetch_top_products(
            limit=limit,
            date_from=date_from,
            date_to=date_to
        )

        return products
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener productos más vendidos"
        )
        
        