from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

from app.database import create_supplier, fetch_suppliers

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None


@router.get("")
def list_suppliers():
    try:
        suppliers = fetch_suppliers()
        return suppliers
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener proveedores"
        )


@router.post("")
def add_supplier(supplier: SupplierCreate):
    try:
        created_supplier = create_supplier(supplier.model_dump())
        return created_supplier
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al crear proveedor"
        )