from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)

from app.database import (
    fetch_sales_summary,
    fetch_top_products
)
from app.dependencies import require_admin


router = APIRouter(
    prefix="/reports",
    tags=["Reportes"],
    dependencies=[
        Depends(require_admin)
    ]
)


def validate_date_range(
    date_from: date | None,
    date_to: date | None
):
    if (
        date_from is not None
        and date_to is not None
        and date_from > date_to
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha inicial no puede ser mayor "
                "que la fecha final."
            )
        )


@router.get("/sales-summary")
def get_sales_summary(
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None)
):
    validate_date_range(
        date_from,
        date_to
    )

    try:
        return fetch_sales_summary(
            date_from=date_from,
            date_to=date_to
        )

    except Exception as error:
        print(
            "\nERROR AL OBTENER RESUMEN DE VENTAS:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener resumen de ventas."
        )


@router.get("/top-products")
def get_top_products(
    limit: int = Query(
        default=5,
        ge=1,
        le=20
    ),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None)
):
    validate_date_range(
        date_from,
        date_to
    )

    try:
        return fetch_top_products(
            limit=limit,
            date_from=date_from,
            date_to=date_to
        )

    except Exception as error:
        print(
            "\nERROR AL OBTENER PRODUCTOS MÁS VENDIDOS:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener productos más vendidos."
        )