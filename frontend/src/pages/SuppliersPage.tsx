import { Truck } from "lucide-react";

import ModulePage from "../components/ModulePage";

function SuppliersPage() {
  return (
    <ModulePage
      title="Proveedores"
      description="Administra los proveedores asociados al abastecimiento del negocio."
      icon={Truck}
    />
  );
}

export default SuppliersPage;