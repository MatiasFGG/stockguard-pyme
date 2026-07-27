from datetime import date
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import (
    create_sale,
    fetch_sale_by_id,
    fetch_sales
)
from app.dependencies import get_current_user


router = APIRouter(
    prefix="/sales",
    tags=["Ventas"]
)


class SaleItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class SaleCreate(BaseModel):
    payment_method: Literal[
        "EFECTIVO",
        "DEBITO",
        "CREDITO",
        "TRANSFERENCIA",
        "OTRO"
    ]

    document_type: Literal[
        "BOLETA",
        "FACTURA",
        "TICKET_INTERNO",
        "SIN_DOCUMENTO"
    ] | None = None

    document_number: str | None = Field(
        default=None,
        max_length=50
    )

    observation: str | None = None

    items: list[SaleItemCreate] = Field(
        min_length=1
    )


@router.get("")
def list_sales(
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ],
    payment_method: Literal[
        "EFECTIVO",
        "DEBITO",
        "CREDITO",
        "TRANSFERENCIA",
        "OTRO"
    ] | None = Query(default=None),
    document_type: Literal[
        "BOLETA",
        "FACTURA",
        "TICKET_INTERNO",
        "SIN_DOCUMENTO"
    ] | None = Query(default=None),
    document_number: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None)
):
    if (
        date_from is not None
        and date_to is not None
        and date_from > date_to
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "La fecha inicial no puede ser mayor "
                "que la fecha final."
            )
        )

    try:
        return fetch_sales(
            payment_method=payment_method,
            document_type=document_type,
            document_number=document_number,
            date_from=date_from,
            date_to=date_to
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener ventas."
        )


@router.get("/{sale_id}")
def get_sale(
    sale_id: int,
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    sale = fetch_sale_by_id(sale_id)

    if sale is None:
        raise HTTPException(
            status_code=404,
            detail="Venta no encontrada."
        )

    return sale


@router.post("")
def add_sale(
    sale: SaleCreate,
    current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    try:
        result = create_sale(
            sale.model_dump(),
            current_user["id"]
        )

    except Exception:
         raise HTTPException(
        status_code=500,
        detail="Error al registrar la venta."
        )

    if result.get("error") == "PRODUCT_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail=(
                f"Producto {result['product_id']} "
                "no encontrado."
            )
        )

    if result.get("error") == "INACTIVE_PRODUCT":
        raise HTTPException(
            status_code=400,
            detail=(
                f"El producto {result['product_id']} "
                "está inactivo."
            )
        )

    if result.get("error") == "DUPLICATE_PRODUCT":
        raise HTTPException(
            status_code=400,
            detail=(
                f"El producto {result['product_id']} "
                "está repetido."
            )
        )

    if result.get("error") == "INSUFFICIENT_STOCK":
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Stock insuficiente.",
                "product_id": result["product_id"],
                "product_name": result["product_name"],
                "available_stock": result[
                    "available_stock"
                ],
                "requested_quantity": result[
                    "requested_quantity"
                ]
            }
        )

    return result

