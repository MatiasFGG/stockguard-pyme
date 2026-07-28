import { useNavigate } from "react-router";

import { useAuth } from "../contexts/AuthContext";

function DashboardPage() {
  const navigate = useNavigate();

  const {
    user,
    signOut,
  } = useAuth();

  function handleLogout() {
    signOut();
    navigate("/", {
      replace: true,
    });
  }

  return (
    <main>
      <header>
        <div>
          <h1>Panel principal</h1>

          <p>
            Bienvenido, {user?.full_name}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </header>

      <section>
        <h2>Información de la cuenta</h2>

        <p>
          <strong>Usuario:</strong>{" "}
          {user?.username}
        </p>

        <p>
          <strong>Rol:</strong>{" "}
          {user?.role}
        </p>
      </section>
    </main>
  );
}

export default DashboardPage;