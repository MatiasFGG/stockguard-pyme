import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router";


import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ConnectionTestPage from "../pages/ConnectionTestPage";


function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/conexion" element={<ConnectionTestPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;