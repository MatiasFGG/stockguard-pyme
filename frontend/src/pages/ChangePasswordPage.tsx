import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";

import { changePassword } from "../api/authApi";
import { useAuth } from "../contexts/AuthContext";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";

function ChangePasswordPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !currentPassword ||
      !newPassword ||
      !confirmNewPassword
    ) {
      setErrorMessage(
        "Debes completar todos los campos.",
      );
      return;
    }

    if (newPassword.length < 10) {
      setErrorMessage(
        "La nueva contraseña debe tener al menos 10 caracteres.",
      );
      return;
    }

    if (newPassword.length > 128) {
      setErrorMessage(
        "La nueva contraseña no puede superar los 128 caracteres.",
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage(
        "La nueva contraseña y su confirmación no coinciden.",
      );
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage(
        "La nueva contraseña debe ser diferente de la contraseña actual.",
      );
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword,
      });

      await refreshUser();

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error: unknown) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "No fue posible cambiar la contraseña.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <section>
        <header>
          <h1>
            Cambio obligatorio de contraseña
          </h1>

          <p>
            Tu cuenta utiliza una contraseña
            temporal. Debes establecer una nueva
            contraseña para continuar.
          </p>
        </header>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="current-password">
              Contraseña actual
            </label>

            <input
              id="current-password"
              name="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value,
                )
              }
              autoComplete="current-password"
              disabled={isSubmitting}
              maxLength={128}
              required
            />
          </div>

          <div>
            <label htmlFor="new-password">
              Nueva contraseña
            </label>

            <input
              id="new-password"
              name="new-password"
              type="password"
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={10}
              maxLength={128}
              required
            />

            <small>
              Debe contener entre 10 y 128
              caracteres.
            </small>
          </div>

          <div>
            <label htmlFor="confirm-new-password">
              Confirmar nueva contraseña
            </label>

            <input
              id="confirm-new-password"
              name="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(event) =>
                setConfirmNewPassword(
                  event.target.value,
                )
              }
              autoComplete="new-password"
              disabled={isSubmitting}
              minLength={10}
              maxLength={128}
              required
            />
          </div>

          {errorMessage && (
            <p role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Actualizando contraseña..."
              : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ChangePasswordPage;