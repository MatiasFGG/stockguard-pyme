from getpass import getpass

from sqlalchemy.exc import IntegrityError

from app.database import create_user, fetch_user_by_username
from app.security import hash_password


def request_required_value(message: str) -> str:
    while True:
        value = input(message).strip()

        if value:
            return value

        print("Este campo es obligatorio.")


def request_password() -> str:
    while True:
        password = getpass("Contraseña: ")
        password_confirmation = getpass("Confirmar contraseña: ")

        if len(password) < 10:
            print("La contraseña debe tener al menos 10 caracteres.")
            continue

        if password != password_confirmation:
            print("Las contraseñas no coinciden.")
            continue

        return password


def main():
    print("\n=== Crear administrador de StockGuard ===\n")

    full_name = request_required_value("Nombre completo: ")
    username = request_required_value("Nombre de usuario: ")

    existing_user = fetch_user_by_username(username)

    if existing_user is not None:
        print("\nYa existe un usuario con ese nombre.")
        return

    email_input = input("Correo electrónico, opcional: ").strip()
    email = email_input if email_input else None

    password = request_password()

    user_data = {
        "full_name": full_name,
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "role": "ADMINISTRADOR",
        "active": True,
        "must_change_password": False
    }

    try:
        created_user = create_user(user_data)
    except IntegrityError:
        print(
            "\nNo se pudo crear el administrador. "
            "El nombre de usuario o correo ya está registrado."
        )
        return

    print("\nAdministrador creado correctamente.")
    print(f"ID: {created_user['id']}")
    print(f"Nombre: {created_user['full_name']}")
    print(f"Usuario: {created_user['username']}")
    print(f"Rol: {created_user['role']}")


if __name__ == "__main__":
    main()
    