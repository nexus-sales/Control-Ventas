import React from "react";

export default function ZonasSection({ zonas, setZonas }) {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold mb-2">Zonas fiscales</h2>
      {zonas.length === 0 && <div className="text-slate-400">No hay zonas registradas.</div>}
      {zonas.map(z => (
        <div key={z.id} className="p-2 rounded bg-slate-50 border mb-1">
          <div className="font-semibold">{z.nombre}</div>
          <div className="text-xs text-slate-500">{z.descripcion || z.codigo}</div>
        </div>
      ))}
      {/* Aquí puedes añadir botones para agregar/editar zonas si lo necesitas */}
    </div>
  );
}