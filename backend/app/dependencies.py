from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError

from app.database import fetch_user_by_id
from app.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)]
) -> dict:
    """
    Identifica al usuario conectado mediante su token JWT.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No fue posible validar la sesión.",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:
        payload = decode_access_token(token)

        if payload.get("type") != "access":
            raise credentials_exception

        user_id = int(payload["sub"])

    except (
        InvalidTokenError,
        KeyError,
        TypeError,
        ValueError
    ):
        raise credentials_exception

    user = fetch_user_by_id(user_id)

    if user is None:
        raise credentials_exception

    if not user["active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra desactivado."
        )

    return user

def require_admin(
    current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
) -> dict:
    """
    Permite continuar solamente a usuarios administradores.
    """

    if current_user["role"] != "ADMINISTRADOR":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para realizar esta acción."
        )

    return current_user