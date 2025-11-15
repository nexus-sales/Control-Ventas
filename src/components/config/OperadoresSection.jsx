import React, { useState } from "react";
import { useCustomFields } from "../../hooks/useCustomFields";
import { saveAs } from "file-saver";

  // Hook de campos personalizados para operadores (dentro del componente)

  function exportarOperadoresCSV(operadores, customFields) {
    if (!operadores.length) return;
    const baseHeaders = [
      "ID", "Nombre", "Sector", "Código", "Contacto", "Teléfono", "Email"
    ];
    const customHeaders = customFields.map(f => f.nombre);
    const headers = [...baseHeaders, ...customHeaders];
    const rows = operadores.map(o => [
      o.id,
      o.nombre,
      o.sector,
      o.codigo,
      o.contacto,
      o.telefono,
      o.email,
      ...customFields.map(f => o.customFields?.[f.id] ?? "")
    ]);
    const csv = [headers.join(",")].concat(rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `operadores_${new Date().toISOString().slice(0,10)}.csv`);
  }
import Card from "../ui/Card";
import {
  Building,
  Plus,
  Edit3,
  X,
  Trash2,
  Phone,
  DollarSign,
  Tag,
  AlertCircle,
  Zap,
  Shield,
  Briefcase,
  Home,
  Users,
  Settings,
  Percent,
} from "lucide-react";
import OperadorEditModal from "../OperadorEditModal";
import OperadoresTable from "./OperadoresTable";

export default function OperadoresSection({ operadores, setOperadores }) {
  const customFields = useCustomFields('operadores');
  const [showOperadorForm, setShowOperadorForm] = useState(false);
  const [oDraft, setODraft] = useState({
    nombre: "",
    sector: "telefonia",
    codigo: "",
    contacto: "",
    telefono: "",
    email: "",
    fecha_alta: "",
    fecha_baja: "",
    observaciones: "",
    // NUEVO: Reglas de decomisión
    reglas_decomision: {
      antes_6_meses: 100,
      despues_6_meses: 50,
      limite_meses: 6
    },
    historial: [],
  });
  const [modalOperador, setModalOperador] = useState(null);
  const [error, setError] = useState("");

  // Normalizar texto para comparaciones (sin acentos, mayúsculas, espacios extra)
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ");
  };

  // Verificar si ya existe un operador con el mismo nombre
  const operadorExists = (nombre, excludeId = null) => {
    const normalizedNombre = normalizeText(nombre);
    return operadores.some(o => 
      o.id !== excludeId &&
      normalizeText(o.nombre) === normalizedNombre
    );
  };

  // Obtener icono según el sector
  const getSectorIcon = (sector) => {
    switch(sector.toLowerCase()) {
      case 'telefonia': return <Phone className="w-4 h-4" />;
      case 'energia': return <Zap className="w-4 h-4" />;
      case 'seguridad': return <Shield className="w-4 h-4" />;
      case 'internet': return <Briefcase className="w-4 h-4" />;
      case 'seguros': return <Home className="w-4 h-4" />;
      default: return <Building className="w-4 h-4" />;
    }
  };

  // Obtener color según el sector
  const getSectorColor = (sector) => {
    switch(sector.toLowerCase()) {
      case 'telefonia': return 'bg-blue-100 text-blue-700';
      case 'energia': return 'bg-yellow-100 text-yellow-700';
      case 'seguridad': return 'bg-red-100 text-red-700';
      case 'internet': return 'bg-purple-100 text-purple-700';
      case 'seguros': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtener nombre legible del sector
  const getSectorName = (sector) => {
    switch(sector.toLowerCase()) {
      case 'telefonia': return 'Telefonía';
      case 'energia': return 'Energía';
      case 'seguridad': return 'Seguridad';
      case 'internet': return 'Internet';
      case 'seguros': return 'Seguros';
      default: return sector.charAt(0).toUpperCase() + sector.slice(1);
    }
  };

  // Estadísticas por sector
  const sectorStats = {
    telefonia: operadores.filter(o => o.sector === 'telefonia').length,
    energia: operadores.filter(o => o.sector === 'energia').length,
    seguridad: operadores.filter(o => o.sector === 'seguridad').length,
    internet: operadores.filter(o => o.sector === 'internet').length,
    seguros: operadores.filter(o => o.sector === 'seguros').length,
    otros: operadores.filter(o => !['telefonia', 'energia', 'seguridad', 'internet', 'seguros'].includes(o.sector)).length,
  };

  const addOperador = () => {
    // Validaciones
    if (!oDraft.nombre.trim()) {
      setError("El nombre del operador es obligatorio");
      return;
    }

    // Verificar duplicados
    if (operadorExists(oDraft.nombre)) {
      setError(`Ya existe un operador con el nombre "${oDraft.nombre}"`);
      return;
    }

    // NUEVO: Validar reglas de decomisión
    const { antes_6_meses, despues_6_meses, limite_meses } = oDraft.reglas_decomision;
    if (antes_6_meses < 0 || antes_6_meses > 100) {
      setError("El porcentaje antes del límite debe estar entre 0 y 100");
      return;
    }
    if (despues_6_meses < 0 || despues_6_meses > 100) {
      setError("El porcentaje después del límite debe estar entre 0 y 100");
      return;
    }
    if (limite_meses < 1 || limite_meses > 24) {
      setError("El límite de meses debe estar entre 1 y 24");
      return;
    }

    // Crear nuevo operador
    const newOperador = { 
      ...oDraft, 
      id: `op_${Date.now()}_${Math.floor(Math.random()*10000)}`,
      nombre: oDraft.nombre.trim(),
      codigo: oDraft.codigo.trim().toUpperCase(),
      contacto: oDraft.contacto.trim(),
      email: oDraft.email.trim(),
      telefono: oDraft.telefono.trim(),
      fecha_alta: oDraft.fecha_alta || new Date().toISOString().slice(0, 10),
      // NUEVO: Incluir reglas de decomisión
      reglas_decomision: {
        antes_6_meses: Number(oDraft.reglas_decomision.antes_6_meses) || 100,
        despues_6_meses: Number(oDraft.reglas_decomision.despues_6_meses) || 50,
        limite_meses: Number(oDraft.reglas_decomision.limite_meses) || 6
      },
      historial: [] 
    };

    setOperadores(prev => [...prev, newOperador]);

    // Resetear formulario y cerrar automáticamente
    setODraft({
      nombre: "",
      sector: "telefonia",
      codigo: "",
      contacto: "",
      telefono: "",
      email: "",
      fecha_alta: "",
      fecha_baja: "",
      observaciones: "",
      reglas_decomision: {
        antes_6_meses: 100,
        despues_6_meses: 50,
        limite_meses: 6
      },
      historial: [],
    });
    setError("");
    setShowOperadorForm(false); // Cerrar el formulario al guardar
  };

  const handleModalOperadorSave = (operador, shouldClose) => {
    // Verificar duplicados al editar
    if (operadorExists(operador.nombre, operador.id)) {
      alert(`Ya existe un operador con el nombre "${operador.nombre}"`);
      return;
    }

    setOperadores(prev => prev.map((o) => (o.id === operador.id ? {
      ...operador,
      nombre: operador.nombre.trim(),
      codigo: operador.codigo?.trim().toUpperCase(),
      contacto: operador.contacto?.trim(),
      email: operador.email?.trim(),
      telefono: operador.telefono?.trim()
    } : o)));
    
    if (shouldClose) setModalOperador(null);
  };

  const rmOper = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este operador? Esta acción no se puede deshacer.")) {
      setOperadores(prev => prev.filter((o) => o.id !== id));
    }
  };

  // Definir handleExportCSV
  const handleExportCSV = () => exportarOperadoresCSV(operadores, customFields);

  return (
  <section className="max-w-4xl mx-auto bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-green-950 dark:via-green-900 dark:to-green-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-green-800 p-8 space-y-8 transition-colors">
  <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Operadores</h2>
  <p className="text-base text-purple-700 dark:text-green-200 font-semibold mb-6">Gestiona operadores y campos personalizados.</p>

      {/* Mostrar error global */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Botón para mostrar formulario de nuevo operador */}
      <div className="mb-4 flex justify-end">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white rounded-xl shadow transition"
          onClick={() => setShowOperadorForm(true)}
        >
          <Plus className="w-4 h-4" /> Nuevo operador
        </button>
      </div>

      {/* Formulario de nuevo operador */}
      {showOperadorForm && (
        <OperadorEditModal
          operador={null}
          onSave={addOperador}
          onClose={() => setShowOperadorForm(false)}
        />
      )}

      {/* Modal de edición de operador */}
      {modalOperador && (
        <OperadorEditModal
          operador={modalOperador}
          onSave={handleModalOperadorSave}
          onClose={() => setModalOperador(null)}
        />
      )}

      <div className="divide-y divide-slate-200 dark:divide-darkAccent/20 space-y-8">
        <div className="pt-0">
          {/* Tabla de operadores */}
          <OperadoresTable
            operadores={operadores}
            customFields={customFields}
            getSectorIcon={getSectorIcon}
            getSectorColor={getSectorColor}
            getSectorName={getSectorName}
            onEdit={o => setModalOperador(o)}
            onDelete={rmOper}
            sectorStats={sectorStats}
          />
        </div>
      </div>
      <button className="mt-8 px-4 py-2 bg-purple-600 dark:bg-green-700 hover:bg-purple-700 dark:hover:bg-green-800 text-white rounded-xl shadow transition" onClick={handleExportCSV}>
        Exportar CSV
      </button>
    </section>
  );
}
