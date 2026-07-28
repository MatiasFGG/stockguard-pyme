import type { LucideIcon } from "lucide-react";

import "../styles/module-page.css";

interface ModulePageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

function ModulePage({
  title,
  description,
  icon: Icon,
}: ModulePageProps) {
  return (
    <section className="module-page">
      <header className="module-page__header">
        <div className="module-page__icon">
          <Icon size={26} />
        </div>

        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </header>

      <div className="module-page__content">
        <h2>Módulo en preparación</h2>

        <p>
          La estructura de navegación ya está disponible.
          En los siguientes pasos incorporaremos sus datos,
          formularios y operaciones reales.
        </p>
      </div>
    </section>
  );
}

export default ModulePage;