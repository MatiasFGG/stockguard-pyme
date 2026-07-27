from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from app.dependencies import get_current_user

from app.database import (
    fetch_user_by_username,
    update_user_last_login
)
from app.security import (
    create_access_token,
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
        Depends(get_current_user)
    ]
):
    return current_user