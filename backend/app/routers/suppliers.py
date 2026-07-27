from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from pydantic import BaseModel, EmailStr, Field

from app.database import (
    create_supplier,
    fetch_suppliers,
    update_supplier
)
from app.dependencies import (
    get_current_user,
    require_admin
)


router = APIRouter(
    prefix="/suppliers",
    tags=["Proveedores"]
)


class SupplierCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=150
    )

    phone: str | None = Field(
        default=None,
        max_length=30
    )

    email: EmailStr | None = None

    address: str | None = Field(
        default=None,
        max_length=500
    )


class SupplierUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    phone: str | None = Field(
        default=None,
        max_length=30
    )

    email: EmailStr | None = None

    address: str | None = Field(
        default=None,
        max_length=500
    )


@router.get("")
def list_suppliers(
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    try:
        return fetch_suppliers()

    except Exception as error:
        print(
            "\nERROR AL OBTENER PROVEEDORES:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener proveedores."
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
def add_supplier(
    supplier: SupplierCreate,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    supplier_data = supplier.model_dump()

    supplier_data["name"] = (
        supplier_data["name"].strip()
    )

    if supplier_data["phone"] is not None:
        supplier_data["phone"] = (
            supplier_data["phone"].strip()
        )

    if supplier_data["email"] is not None:
        supplier_data["email"] = (
            str(supplier_data["email"])
            .strip()
            .lower()
        )

    if supplier_data["address"] is not None:
        supplier_data["address"] = (
            supplier_data["address"].strip()
        )

    try:
        return create_supplier(supplier_data)

    except Exception as error:
        print(
            "\nERROR AL CREAR PROVEEDOR:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear proveedor."
        )


@router.patch("/{supplier_id}")
def edit_supplier(
    supplier_id: int,
    supplier: SupplierUpdate,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    provided_updates = supplier.model_dump(
        exclude_unset=True
    )

    if not provided_updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar al menos un dato para actualizar."
        )

    supplier_data = supplier.model_dump()

    if supplier_data["name"] is not None:
        supplier_data["name"] = (
            supplier_data["name"].strip()
        )

    if supplier_data["phone"] is not None:
        supplier_data["phone"] = (
            supplier_data["phone"].strip()
        )

    if supplier_data["email"] is not None:
        supplier_data["email"] = (
            str(supplier_data["email"])
            .strip()
            .lower()
        )

    if supplier_data["address"] is not None:
        supplier_data["address"] = (
            supplier_data["address"].strip()
        )

    try:
        result = update_supplier(
            supplier_id,
            supplier_data
        )

    except Exception as error:
        print(
            "\nERROR AL ACTUALIZAR PROVEEDOR:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar proveedor."
        )

    if result.get("error") == "SUPPLIER_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado."
        )

    return result       