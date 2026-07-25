from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import create_sale, fetch_sale_by_id, fetch_sales

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
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

    observation: str | None = None
    items: list[SaleItemCreate] = Field(min_length=1)


@router.get("")
def list_sales():
    try:
        sales = fetch_sales()
        return sales
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener ventas"
        )


@router.get("/{sale_id}")
def get_sale(sale_id: int):
    sale = fetch_sale_by_id(sale_id)

    if sale is None:
        raise HTTPException(
            status_code=404,
            detail="Venta no encontrada"
        )

    return sale

@router.post("")
def add_sale(sale: SaleCreate):
    try:
        result = create_sale(sale.model_dump())
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al registrar la venta"
        )

    if result.get("error") == "PRODUCT_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail=f"Producto {result['product_id']} no encontrado"
        )

    if result.get("error") == "INACTIVE_PRODUCT":
        raise HTTPException(
            status_code=400,
            detail=f"El producto {result['product_id']} está inactivo"
        )

    if result.get("error") == "DUPLICATE_PRODUCT":
        raise HTTPException(
            status_code=400,
            detail=f"El producto {result['product_id']} está repetido"
        )

    if result.get("error") == "INSUFFICIENT_STOCK":
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Stock insuficiente",
                "product_id": result["product_id"],
                "product_name": result["product_name"],
                "available_stock": result["available_stock"],
                "requested_quantity": result["requested_quantity"]
            }
        )

    return result
