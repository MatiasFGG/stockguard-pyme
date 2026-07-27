from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)
from pydantic import BaseModel, Field

from app.database import (
    create_category,
    fetch_categories,
    update_category
)
from app.dependencies import (
    get_current_user,
    require_admin
)


router = APIRouter(
    prefix="/categories",
    tags=["Categorías"]
)


class CategoryCreate(BaseModel):
    name: str = Field(
        min_length=1,
        max_length=100
    )

    description: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100
    )

    description: str | None = None


@router.get("")
def list_categories(
    _current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    try:
        return fetch_categories()

    except Exception as error:
        print(
            "\nERROR AL OBTENER CATEGORÍAS:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener categorías."
        )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED
)
def add_category(
    category: CategoryCreate,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    try:
        category_data = category.model_dump()

        category_data["name"] = (
            category_data["name"].strip()
        )

        if category_data["description"] is not None:
            category_data["description"] = (
                category_data["description"].strip()
            )

        return create_category(category_data)

    except Exception as error:
        print(
            "\nERROR AL CREAR CATEGORÍA:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear categoría."
        )


@router.patch(
    "/{category_id}"
)
def edit_category(
    category_id: int,
    category: CategoryUpdate,
    _current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    updates = category.model_dump(
        exclude_unset=True
    )

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar al menos un dato para actualizar."
        )

    if "name" in updates:
        updates["name"] = updates["name"].strip()

    if (
        "description" in updates
        and updates["description"] is not None
    ):
        updates["description"] = (
            updates["description"].strip()
        )

    try:
        result = update_category(
            category_id,
            updates
        )

    except Exception as error:
        print(
            "\nERROR AL ACTUALIZAR CATEGORÍA:",
            repr(error)
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar categoría."
        )

    if result.get("error") == "CATEGORY_NOT_FOUND":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada."
        )

    return result      