import {
  Boxes,
  ChartNoAxesCombined,
  LayoutDashboard,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  X,
} from "lucide-react";

import { NavLink } from "react-router";

import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Productos",
    path: "/productos",
    icon: Boxes,
  },
  {
    label: "Ventas",
    path: "/ventas",
    icon: ShoppingCart,
  },
  {
    label: "Inventario",
    path: "/inventario",
    icon: PackageSearch,
  },
  {
    label: "Categorías",
    path: "/categorias",
    icon: Tags,
  },
  {
    label: "Proveedores",
    path: "/proveedores",
    icon: Truck,
  },
  {
    label: "Reportes",
    path: "/reportes",
    icon: ChartNoAxesCombined,
    adminOnly: true,
  },
  {
    label: "Usuarios",
    path: "/usuarios",
    icon: Users,
    adminOnly: true,
  },
];

function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { user } = useAuth();

  const availableItems = navigationItems.filter(
    (item) =>
      !item.adminOnly ||
      user?.role === "ADMINISTRADOR",
  );

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={onClose}
        />
      )}

      <aside
        className={
          isOpen
            ? "app-sidebar app-sidebar--open"
            : "app-sidebar"
        }
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand__mark">
            SG
          </div>

          <div>
            <strong>StockGuard</strong>
            <span>PyME</span>
          </div>

          <button
            type="button"
            className="sidebar-close-button"
            aria-label="Cerrar menú"
            onClick={onClose}
          >
            <X size={22} />
          </button>
        </div>

        <nav
          className="sidebar-navigation"
          aria-label="Navegación principal"
        >
          {availableItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar-link sidebar-link--active"
                    : "sidebar-link"
                }
              >
                <Icon size={20} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <ReceiptText size={18} />

          <span>Gestión comercial segura</span>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;