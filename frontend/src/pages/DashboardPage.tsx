import { useAuth } from "../contexts/AuthContext";

function DashboardPage() {
  const { user } = useAuth();

  return (
    <section>
      <header>
        <h1>Dashboard</h1>

        <p>
          Bienvenido, {user?.full_name}. Aquí
          encontrarás el resumen general del negocio.
        </p>
      </header>
    </section>
  );
}

export default DashboardPage;