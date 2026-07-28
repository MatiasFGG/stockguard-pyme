import {
  Navigate,
  Outlet,
} from "react-router";

import { useAuth } from "../contexts/AuthContext";

function PasswordChangedRoute() {
  const { user } = useAuth();

  if (user?.must_change_password) {
    return (
      <Navigate
        to="/cambiar-contrasena"
        replace
      />
    );
  }

  return <Outlet />;
}

export default PasswordChangedRoute;