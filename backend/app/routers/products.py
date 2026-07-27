from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status
)
from pydantic import BaseModel, Field

from app.database import (
    activate_product,
    create_product,
    deactivate_product,
    fetch_low_stock_products,
    fetch_product_by_id,
    fetch_products,
    update_product
)
from app.dependencies import (
    get_current_user,
    require_admin
)


router = APIRouter(
    prefix="/products",
    tags=["Productos"]
)


class ProductCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=150
    )

    description: str | None = None

    barcode: str | None = Field(
        default=None,
        max_length=50
    )

    purchase_price: float = Field(ge=0)
    sale_price: float = Field(ge=0)
    current_stock: int = Field(default=0, ge=0)
    minimum_stock: int = Field(default=0, ge=0)

    category_id: int = Field(gt=0)
    supplier_id: int | None = Field(default=None, gt=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=150
    )

    description: str | None = None

    barcode: str | None = Field(
        default=None,
        max_length=50
    )

    purchase_price: float | None = Field(
        default=None,
        ge=0
    )

    sale_price: float | None = Field(
        default=None,
        ge=0
    )

    minimum_stock: int | None = Field(
        default=None,
        ge=0
    )

    category_id: int | None = Field(
        default=None,
        gt=0
    )

    supplier_id: int | None = Field(
        default=None,
        gt=0
    )


@router.get("")
def list_products(
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ],
    search: str | None = Query(
        default=None,
        max_length=150
    ),
    category_id: int | None = Query(
        default=None,
        gt=0
    ),
    supplier_id: int | None = Query(
        default=None,
        gt=0
    ),
    active: bool | None = Query(default=None)
):
    try:
        return fetch_products(
            search=search,
            category_id=category_id,
            supplier_id=supplier_id,
            active=active
        )

    except Exception as error:
        print(
            "\nERROR AL OBTENER PRODUCTOS:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener productos."
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
def add_product(
    product: ProductCreate,
    current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    try:
        return create_product(
            product.model_dump(),
            current_user["id"]
        )

    except Exception as error:
        print(
            "\nERROR AL CREAR PRODUCTO:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear producto."
        )


@router.get("/low-stock")
def list_low_stock_products(
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    try:
        return fetch_low_stock_products()

    except Exception as error:
        print(
            "\nERROR AL OBTENER STOCK BAJO:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener productos con stock bajo."
        )


@router.get("/{product_id}")
def get_product(
    product_id: int,
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    product = fetch_product_by_id(product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return product


@router.patch("/{product_id}")
def edit_product(
    product_id: int,
    product: ProductUpdate,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    try:
        result = update_product(
            product_id,
            product.model_dump()
        )

    except Exception as error:
        print(
            "\nERROR AL ACTUALIZAR PRODUCTO:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar producto."
        )

    if result.get("error") == "PRODUCT_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    if result.get("error") == "CATEGORY_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada."
        )

    if result.get("error") == "SUPPLIER_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proveedor no encontrado."
        )

    return result


@router.patch("/{product_id}/deactivate")
def disable_product(
    product_id: int,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    product = deactivate_product(product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return product


@router.patch("/{product_id}/activate")
def enable_product(
    product_id: int,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    product = activate_product(product_id)

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado."
        )

    return product

