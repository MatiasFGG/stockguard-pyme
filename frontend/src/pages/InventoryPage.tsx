import { PackageSearch } from "lucide-react";

import ModulePage from "../components/ModulePage";

function InventoryPage() {
  return (
    <ModulePage
      title="Inventario"
      description="Consulta movimientos y realiza ajustes manuales de existencias."
      icon={PackageSearch}
    />
  );
}

export default InventoryPage;