import React from "react";
import AdministracionSection from "../gestion/components/AdministracionSection";

/**
 * COMPONENTE: Administracion (Legacy Wrapper)
 * 
 * Este componente es un contenedor para el módulo de Administración.
 * Ahora utiliza AdministracionSection que ha sido refactorizado y mejorado visualmente.
 */
export default function Administracion() {
  return (
    <div className="p-6">
      <AdministracionSection />
    </div>
  );
}
