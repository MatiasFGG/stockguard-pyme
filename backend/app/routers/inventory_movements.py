from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.database import (
    adjust_product_stock,
    fetch_inventory_movements
)
from app.dependencies import (
    get_current_user,
    require_admin
)


router = APIRouter(
    prefix="/inventory-movements",
    tags=["Movimientos de inventario"]
)


class StockAdjustmentCreate(BaseModel):
    product_id: int = Field(gt=0)

    movement_type: Literal[
        "AJUSTE_POSITIVO",
        "AJUSTE_NEGATIVO",
        "MERMA"
    ]

    quantity: int = Field(gt=0)

    reason: str = Field(
        min_length=1,
        max_length=500
    )

    reference: str | None = Field(
        default=None,
        max_length=100
    )


@router.get("")
def list_inventory_movements(
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    try:
        return fetch_inventory_movements()

    except Exception as error:
        print(
            "\nERROR AL OBTENER MOVIMIENTOS:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener movimientos de inventario."
        )


@router.post("/adjust")
def adjust_stock(
    adjustment: StockAdjustmentCreate,
    current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    try:
        result = adjust_product_stock(
            adjustment.model_dump(),
            current_user["id"]
        )

    except Exception as error:
        print(
            "\nERROR AL AJUSTAR STOCK:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al realizar el ajuste de stock."
        )

    if result.get("error") == "PRODUCT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    if result.get("error") == "NEGATIVE_STOCK":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El stock no puede quedar en negativo."
        )

    if result.get("error") == "INVALID_MOVEMENT_TYPE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de movimiento inválido."
        )

    return result