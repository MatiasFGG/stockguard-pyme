import {
  Navigate,
  Outlet,
} from "react-router";

import { useAuth } from "../contexts/AuthContext";

function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== "ADMINISTRADOR") {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <Outlet />;
}

export default AdminRoute;