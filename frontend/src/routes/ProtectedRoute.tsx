import {
  Navigate,
  Outlet,
} from "react-router";

import { hasAccessToken } from "../utils/tokenStorage";

function ProtectedRoute() {
  if (!hasAccessToken()) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;