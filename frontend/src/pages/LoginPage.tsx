


import {
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";

import { login } from "../api/authApi";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
import { setAccessToken } from "../utils/tokenStorage";

function LoginPage() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setErrorMessage(
        "Debes ingresar tu nombre de usuario y contraseña.",
      );
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const loginData = await login({
        username: normalizedUsername,
        password,
      });

      setAccessToken(loginData.access_token);

      if (loginData.user.must_change_password) {
        navigate("/cambiar-contrasena", {
          replace: true,
        });
        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error: unknown) {
        setErrorMessage(
        getApiErrorMessage(
        error,
        "No fue posible iniciar sesión.",
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
          <h1>StockGuard PyME</h1>
          <p>Ingresa tus credenciales para continuar.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">
              Nombre de usuario
            </label>

            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              autoComplete="username"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete="current-password"
              disabled={isSubmitting}
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
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;