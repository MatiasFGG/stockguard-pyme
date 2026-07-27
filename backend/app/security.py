from pwdlib import PasswordHash


password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """
    Convierte una contraseña normal en un hash seguro.
    La contraseña original no debe guardarse en la base de datos.
    """
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Comprueba si una contraseña ingresada corresponde al hash guardado.
    """
    return password_hash.verify(
        plain_password,
        hashed_password
    )