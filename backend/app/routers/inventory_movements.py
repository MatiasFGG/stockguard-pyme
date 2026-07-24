from fastapi import APIRouter, HTTPException

from app.database import fetch_inventory_movements

router = APIRouter(
    prefix="/inventory-movements",
    tags=["Inventory Movements"]
)


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