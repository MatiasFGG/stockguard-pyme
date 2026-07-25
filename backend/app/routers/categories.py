from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.database import create_category, fetch_categories

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


@router.get("")
def list_categories():
    try:
        categories = fetch_categories()
        return categories
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al obtener categorías"
        )


@router.post("")
def add_category(category: CategoryCreate):
    try:
        created_category = create_category(category.model_dump())
        return created_category
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Error al crear categoría"
        )
        
        