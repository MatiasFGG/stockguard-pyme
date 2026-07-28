import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import ChangePasswordPage from "../pages/ChangePasswordPage";
import ConnectionTestPage from "../pages/ConnectionTestPage";
import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/conexion"
          element={<ConnectionTestPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/cambiar-contrasena"
            element={<ChangePasswordPage />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;