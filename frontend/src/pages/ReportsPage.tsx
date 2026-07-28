import { ChartNoAxesCombined } from "lucide-react";

import ModulePage from "../components/ModulePage";

function ReportsPage() {
  return (
    <ModulePage
      title="Reportes"
      description="Consulta indicadores y reportes de inventario, ventas y productos."
      icon={ChartNoAxesCombined}
    />
  );
}

export default ReportsPage;