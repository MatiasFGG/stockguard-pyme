import {
  LogOut,
  Menu,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router";

import { useAuth } from "../contexts/AuthContext";

interface TopbarProps {
  onOpenSidebar: () => void;
}

function Topbar({
  onOpenSidebar,
}: TopbarProps) {
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
    <header className="app-topbar">
      <button
        type="button"
        className="topbar-menu-button"
        aria-label="Abrir menú"
        onClick={onOpenSidebar}
      >
        <Menu size={24} />
      </button>

      <div className="topbar-title">
        <strong>Panel de administración</strong>

        <span>
          Control de inventario y ventas
        </span>
      </div>

      <div className="topbar-user">
        <div className="topbar-user__icon">
          <UserRound size={20} />
        </div>

        <div className="topbar-user__information">
          <strong>{user?.full_name}</strong>
          <span>{user?.role}</span>
        </div>

        <button
          type="button"
          className="topbar-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />

          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}

export default Topbar;