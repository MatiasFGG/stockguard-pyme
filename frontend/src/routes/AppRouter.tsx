import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";

import AppLayout from "../layouts/AppLayout";

import CategoriesPage from "../pages/CategoriesPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import ConnectionTestPage from "../pages/ConnectionTestPage";
import DashboardPage from "../pages/DashboardPage";
import InventoryPage from "../pages/InventoryPage";
import LoginPage from "../pages/LoginPage";
import ProductsPage from "../pages/ProductsPage";
import ReportsPage from "../pages/ReportsPage";
import SalesPage from "../pages/SalesPage";
import SuppliersPage from "../pages/SuppliersPage";
import UsersPage from "../pages/UsersPage";

import AdminRoute from "./AdminRoute";
import PasswordChangedRoute from "./PasswordChangedRoute";
import ProtectedRoute from "./ProtectedRoute";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/conexion"
          element={<ConnectionTestPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route
            path="/cambiar-contrasena"
            element={<ChangePasswordPage />}
          />

          <Route element={<PasswordChangedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              <Route
                path="/productos"
                element={<ProductsPage />}
              />

              <Route
                path="/ventas"
                element={<SalesPage />}
              />

              <Route
                path="/inventario"
                element={<InventoryPage />}
              />

              <Route
                path="/categorias"
                element={<CategoriesPage />}
              />

              <Route
                path="/proveedores"
                element={<SuppliersPage />}
              />

              <Route element={<AdminRoute />}>
                <Route
                  path="/reportes"
                  element={<ReportsPage />}
                />

                <Route
                  path="/usuarios"
                  element={<UsersPage />}
                />
              </Route>
            </Route>
          </Route>
        </Route>

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;