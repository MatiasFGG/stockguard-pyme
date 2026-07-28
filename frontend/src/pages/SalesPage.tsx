import { ShoppingCart } from "lucide-react";

import ModulePage from "../components/ModulePage";

function SalesPage() {
  return (
    <ModulePage
      title="Ventas"
      description="Registra nuevas ventas y consulta las operaciones realizadas."
      icon={ShoppingCart}
    />
  );
}

export default SalesPage;