import { Tags } from "lucide-react";

import ModulePage from "../components/ModulePage";

function CategoriesPage() {
  return (
    <ModulePage
      title="Categorías"
      description="Organiza los productos mediante categorías comerciales."
      icon={Tags}
    />
  );
}

export default CategoriesPage;