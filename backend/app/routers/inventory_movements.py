from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import adjust_product_stock, fetch_inventory_movements

router = APIRouter(
    prefix="/inventory-movements",
    tags=["Inventory Movements"]
)


class StockAdjustmentCreate(BaseModel):
    product_id: int
    movement_type: Literal["AJUSTE_POSITIVO", "AJUSTE_NEGATIVO", "MERMA"]
    quantity: int = Field(gt=0)
    reason: str = Field(min_length=1)
    reference: str | None = None


@router.get("")
def list_inventory_movements():
    try:
        movements = fetch_inventory_movements()
        return movements
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener movimientos de inventario"
        )


@router.post("/adjust")
def adjust_stock(adjustment: StockAdjustmentCreate):
    result = adjust_product_stock(adjustment.model_dump())

    if result.get("error") == "PRODUCT_NOT_FOUND":
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    if result.get("error") == "NEGATIVE_STOCK":
        raise HTTPException(
            status_code=400,
            detail="El stock no puede quedar en negativo"
        )

    if result.get("error") == "INVALID_MOVEMENT_TYPE":
        raise HTTPException(
            status_code=400,
            detail="Tipo de movimiento inválido"
        )

    return result