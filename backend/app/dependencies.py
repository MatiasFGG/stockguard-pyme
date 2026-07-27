from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError

from app.database import fetch_user_by_id
from app.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/login"
)


def get_authenticated_user(
    token: Annotated[
        str,
        Depends(oauth2_scheme)
    ]
) -> dict:
    """
    Valida el token e identifica al usuario autenticado.

    Permite continuar aunque el usuario todavía tenga
    una contraseña temporal.
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


def get_current_user(
    authenticated_user: Annotated[
        dict,
        Depends(get_authenticated_user)
    ]
) -> dict:
    """
    Permite utilizar el sistema solamente después de
    reemplazar la contraseña temporal.
    """

    if authenticated_user["must_change_password"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "PASSWORD_CHANGE_REQUIRED",
                "message": (
                    "Debes cambiar tu contraseña temporal "
                    "antes de continuar."
                )
            }
        )

    return authenticated_user


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

