import { Users } from "lucide-react";

import ModulePage from "../components/ModulePage";

function UsersPage() {
  return (
    <ModulePage
      title="Usuarios"
      description="Administra usuarios, roles, estados y restablecimiento de contraseñas."
      icon={Users}
    />
  );
}

export default UsersPage;