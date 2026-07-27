from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field

from app.database import (
    fetch_user_by_username,
    update_user_last_login,
    update_user_password
)
from app.dependencies import get_authenticated_user
from app.security import (
    create_access_token,
    hash_password,
    verify_password
)


router = APIRouter(
    prefix="/auth",
    tags=["Autenticación"]
)


class AuthenticatedUserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: str | None
    role: str
    must_change_password: bool


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: AuthenticatedUserResponse


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
        max_length=128
    )

    new_password: str = Field(
        min_length=10,
        max_length=128
    )

    confirm_new_password: str = Field(
        min_length=10,
        max_length=128
    )


@router.post(
    "/login",
    response_model=LoginResponse
)
def login(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends()
    ]
):
    user = fetch_user_by_username(form_data.username)

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuario o contraseña incorrectos.",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    if user is None:
        raise credentials_exception

    if not verify_password(
        form_data.password,
        user["password_hash"]
    ):
        raise credentials_exception

    if not user["active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra desactivado."
        )

    access_token = create_access_token(user["id"])

    update_user_last_login(user["id"])

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "must_change_password": user[
                "must_change_password"
            ]
        }
    }
    
@router.get(
    "/me",
    response_model=AuthenticatedUserResponse
)
def read_current_user(
    current_user: Annotated[
        dict,
        Depends(get_authenticated_user)
    ]
):
    return current_user

@router.patch(
    "/change-password",
    response_model=AuthenticatedUserResponse
)
def change_own_password(
    password_data: ChangePasswordRequest,
    current_user: Annotated[
        dict,
        Depends(get_authenticated_user)
    ]
):
    user_with_credentials = fetch_user_by_username(
        current_user["username"]
    )

    if user_with_credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No fue posible validar el usuario."
        )

    if not verify_password(
        password_data.current_password,
        user_with_credentials["password_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta."
        )

    if (
        password_data.new_password
        != password_data.confirm_new_password
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Las contraseñas nuevas no coinciden."
        )

    if verify_password(
        password_data.new_password,
        user_with_credentials["password_hash"]
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La contraseña nueva debe ser diferente "
                "de la contraseña actual."
            )
        )

    new_password_hash = hash_password(
        password_data.new_password
    )

    updated_user = update_user_password(
        user_id=current_user["id"],
        password_hash=new_password_hash,
        must_change_password=False
    )

    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado."
        )

    return updated_user