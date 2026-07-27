from datetime import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.exc import IntegrityError

from app.database import (
    create_user,
    fetch_user_by_id,
    fetch_user_by_username,
    fetch_users,
    update_user,
    update_user_password,
    update_user_status
)
from app.dependencies import require_admin
from app.security import hash_password


router = APIRouter(
    prefix="/users",
    tags=["Usuarios"],
    dependencies=[
        Depends(require_admin)
    ]
)


class UserCreateRequest(BaseModel):
    full_name: str = Field(
        min_length=3,
        max_length=150
    )

    username: str = Field(
        min_length=3,
        max_length=50,
        pattern=r"^[A-Za-z0-9._-]+$"
    )

    email: EmailStr | None = None

    password: str = Field(
        min_length=10,
        max_length=128
    )

    role: Literal[
        "ADMINISTRADOR",
        "VENDEDOR"
    ] = "VENDEDOR"

    must_change_password: bool = True


class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: str | None
    role: str
    active: bool
    must_change_password: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None
    
class UserUpdateRequest(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=3,
        max_length=150
    )

    email: EmailStr | None = None

    role: Literal[
        "ADMINISTRADOR",
        "VENDEDOR"
    ] | None = None


class UserStatusRequest(BaseModel):
    active: bool


class UserPasswordResetRequest(BaseModel):
    password: str = Field(
        min_length=10,
        max_length=128
    )

    must_change_password: bool = True


@router.get(
    "",
    response_model=list[UserResponse]
)
def list_users():
    return fetch_users()


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED
)
def register_user(user_data: UserCreateRequest):
    existing_user = fetch_user_by_username(
        user_data.username
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario ya se encuentra registrado."
        )

    database_data = {
        "full_name": user_data.full_name,
        "username": user_data.username,
        "email": (
            str(user_data.email)
            if user_data.email is not None
            else None
        ),
        "password_hash": hash_password(
            user_data.password
        ),
        "role": user_data.role,
        "active": True,
        "must_change_password": (
            user_data.must_change_password
        )
    }

    try:
        return create_user(database_data)

    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No fue posible crear el usuario. "
                "El nombre de usuario o correo ya está registrado."
            )
        )
        
@router.get(
    "/{user_id}",
    response_model=UserResponse
)
def get_user(user_id: int):
    user = fetch_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return user


@router.patch(
    "/{user_id}",
    response_model=UserResponse
)
def edit_user(
    user_id: int,
    user_data: UserUpdateRequest,
    current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    existing_user = fetch_user_by_id(user_id)

    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    updates = user_data.model_dump(
        exclude_unset=True
    )

    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debes enviar al menos un dato para actualizar."
        )

    if (
        user_id == current_user["id"]
        and updates.get("role") == "VENDEDOR"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No puedes quitarte tu propio rol "
                "de administrador."
            )
        )

    if "full_name" in updates:
        updates["full_name"] = (
            updates["full_name"].strip()
        )

    if (
        "email" in updates
        and updates["email"] is not None
    ):
        updates["email"] = str(
            updates["email"]
        ).strip().lower()

    try:
        updated_user = update_user(
            user_id,
            updates
        )

    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo electrónico ya está registrado."
        )

    return updated_user


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse
)
def change_user_status(
    user_id: int,
    status_data: UserStatusRequest,
    current_user: Annotated[
        dict,
        Depends(require_admin)
    ]
):
    existing_user = fetch_user_by_id(user_id)

    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    if (
        user_id == current_user["id"]
        and not status_data.active
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes desactivar tu propio usuario."
        )

    return update_user_status(
        user_id,
        status_data.active
    )


@router.patch(
    "/{user_id}/password",
    response_model=UserResponse
)
def reset_user_password(
    user_id: int,
    password_data: UserPasswordResetRequest
):
    existing_user = fetch_user_by_id(user_id)

    if existing_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    new_password_hash = hash_password(
        password_data.password
    )

    return update_user_password(
        user_id=user_id,
        password_hash=new_password_hash,
        must_change_password=(
            password_data.must_change_password
        )
    )        