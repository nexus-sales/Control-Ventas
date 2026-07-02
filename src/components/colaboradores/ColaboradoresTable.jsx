import React from 'react';
import { User, Phone, Zap, Shield, Edit3, Trash2 } from 'lucide-react';
import Card from '../ui/Card';

export default function ColaboradoresTable({ colaboradores, niveles, zonas, onEdit, onDelete, isAdmin = false }) {
  const getZonaNombre = (zona_id) => zonas.find((z) => z.id === zona_id)?.nombre || "Sin asignar";
  const getNivelInfo = (nivelId) => niveles.find((n) => n.id === nivelId) || null;
  return (
    <Card>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-50">
              <th className="py-3 px-3 font-medium">Colaborador</th>
              <th className="py-3 px-3 font-medium">Tipo Fiscal</th>
              <th className="py-3 px-3 font-medium">Nivel / Comisión</th>
              <th className="py-3 px-3 font-medium">Sectores</th>
              <th className="py-3 px-3 font-medium">Zona</th>
              <th className="py-3 px-3 font-medium">Contacto</th>
              <th className="py-3 px-3 font-medium">Estado</th>
              <th className="py-3 px-3 font-medium">Fechas</th>
              <th className="py-3 px-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {colaboradores.map((c) => {
              const nivelInfo = getNivelInfo(c.nivel);
              const antiguedad = new Date() - new Date(c.fecha_alta);
              const diasAntiguedad = Math.floor(antiguedad / (1000 * 60 * 60 * 24));
              return (
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <td className="py-3 px-3">
                    <div>
                      <div className="font-medium text-slate-800">{c.nombre}</div>
                      {isAdmin && c.cif_dni && (
                        <div className="text-xs text-slate-500">{c.cif_dni}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        c.tipo_fiscal === "EMPRESA"
                          ? "bg-blue-100 text-blue-700"
                          : c.tipo_fiscal === "AUTONOMO_ESPECIAL"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                      }`}>
                        {c.tipo_fiscal === "EMPRESA"
                          ? "Empresa"
                          : c.tipo_fiscal === "AUTONOMO_ESPECIAL"
                            ? "Aut. Especial"
                            : "Autónomo"}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {c.exento_impuestos ? (
                          <span className="text-green-600 font-medium">IRPF: Exento</span>
                        ) : c.irpf_calculado !== null && c.irpf_calculado !== undefined ? (
                          `IRPF: ${c.irpf_calculado}%`
                        ) : (
                          "IRPF: -"
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div>
                      <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        nivelInfo?.tipo === "MANAGER"
                          ? "bg-purple-100 text-purple-700"
                          : nivelInfo?.tipo === "SUPERVISOR"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                      }`}>
                        {nivelInfo?.nombre || c.nivel}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {c.comision_personalizada_activa ? (
                          <span className="font-medium text-amber-600">Personalizado</span>
                        ) : nivelInfo ? (
                          `${((nivelInfo.pct_colaborador_default || 0) * 100).toFixed(0)}%`
                        ) : (
                          "Por nivel"
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      {c.comision_personalizada_activa ? (
                        isAdmin ? (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-blue-500" />
                              <span>{c.telefonia_tipo === 'fijo' ? `€${c.telefonia_valor}` : `${(c.telefonia_valor * 100).toFixed(1)}%`}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Zap className="w-3 h-3 text-yellow-500" />
                              <span>{c.energia_tipo === 'fijo' ? `€${c.energia_valor}` : `${(c.energia_valor * 100).toFixed(1)}%`}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-green-500" />
                              <span>{c.seguridad_tipo === 'fijo' ? `€${c.seguridad_valor}` : `${(c.seguridad_valor * 100).toFixed(1)}%`}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Personalizado (solo admin)</span>
                        )
                      ) : nivelInfo ? (
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-500" />
                            <span>{((nivelInfo.pct_telefonia || 0) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            <span>{((nivelInfo.pct_energia || 0) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-green-500" />
                            <span>€{(nivelInfo.fijo_seguridad || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div>{getZonaNombre(c.zona_id)}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div>
                      {isAdmin ? (
                        <>
                          <div className="text-xs text-slate-700">{c.telefono}</div>
                          <div className="text-xs text-slate-500">{c.email}</div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Restringido</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        c.esta_activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.esta_activo ? (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Inactivo
                          </>
                        )}
                      </span>
                      {c.fecha_baja && (
                        <div className="text-xs text-red-600 mt-1">
                          Baja: {c.fecha_baja}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-600">{c.fecha_alta}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500">
                        <span>{diasAntiguedad} días</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit && onEdit(c)}
                        className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(c.id)}
                        className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
