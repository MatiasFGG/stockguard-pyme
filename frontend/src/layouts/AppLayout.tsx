import { useState } from "react";
import { Outlet } from "react-router";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import "../styles/layout.css";

function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  function openSidebar() {
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      <div className="app-content">
        <Topbar
          onOpenSidebar={openSidebar}
        />

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;