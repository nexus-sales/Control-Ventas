// src/components/ImportExcelMapperV2.jsx
// Componente UI simplificado que usa el hook useImportGestion

import { useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Toast from "./ui/Toast";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import { useImportGestion } from "../hooks/useImportGestion";
import { MAPEO_CAMPOS, parseDate } from "../utils/importValidation";
import { useAuthGestion } from "../hooks/useAuthGestion";
import { BorderBeam } from "./ui/BorderBeam";
import { glassStyles, cardHoverStyles, primaryButtonStyles } from "../utils/designUtils";
import { cn } from "../lib/utils";

// Modal simple para mostrar errores
// Modal premium con glassmorphism
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className={cn(glassStyles('strong'), "max-w-lg w-full p-8 relative overflow-hidden rounded-[2.5rem] shadow-2xl")}
        >
          <BorderBeam size={150} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <Zap className="w-5 h-5 rotate-45" />
          </button>
          <h3 className="text-xl font-black mb-6 text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
          <div className="relative z-10">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function ImportExcelMapperV2({
  setVentas,
  setProductos,
  setOperadores,
  setColaboradores,
  setZonas,
  onImportSuccess,
  productos = [],
  operadores = [],
  colaboradores = [],
  zonas = [],
}) {
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [erroresFila, setErroresFila] = useState(null);

  const {
    headers,
    rows,
    mapping,
    setMapping,
    isLoading,
    resumenImportacion,
    crearAutomaticamente,
    setCrearAutomaticamente,
    resolverNombres,
    setResolverNombres,
    guardarExtras,
    setGuardarExtras,
    validationStats,
    loadFile,
    validateSingleRow,
    importNormal,
    importInteligente,
    importSimplificado,
    clearData,
  } = useImportGestion({
    productos,
    operadores,
    colaboradores,
    zonas,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    // onImportSuccess YA NO se usa dentro del hook para evitar doble llamada
  });

  const { startImporting, finishImporting } = useAuthGestion();

  const autoCreacionDisponible = !!(
    setProductos &&
    setOperadores &&
    setColaboradores &&
    setZonas
  );

  // --------- Generar plantilla completa ---------
  const descargarPlantillaCompleta = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();

      const datosEjemplo = [
        {
          FECHA_ENVIO: "15/01/2024",
          CLIENTE: "Empresa ABC S.L.",
          COLABORADOR: "LEONARDO ADALBERTO MASARE",
          ZONA: "Canarias",
          PRODUCTO: "Fibra 300Mb",
          OPERADOR: "Orange",
          PVP: 49.9,
          CANTIDAD: 1,
          ESTADO: "Confirmada",
        },
        {
          FECHA_ENVIO: "16/01/2024",
          CLIENTE: "Servicios XYZ Ltd",
          COLABORADOR: "MARIA GONZALEZ LOPEZ",
          ZONA: "Península",
          PRODUCTO: "Móvil Unlimited",
          OPERADOR: "Vodafone",
          PVP: 35.0,
          CANTIDAD: 2,
          ESTADO: "Pendiente",
        },
      ];

      const headers = Object.keys(datosEjemplo[0]);
      const ws = workbook.addWorksheet("Plantilla Ejemplo");
      ws.columns = headers.map((h) => ({ header: h, key: h, width: 18 }));
      datosEjemplo.forEach((row) => ws.addRow(row));

      const mapeoData = Object.keys(MAPEO_CAMPOS).map((interno) => ({
        "Campo Interno": interno,
        "Posibles Nombres Excel": MAPEO_CAMPOS[interno].join(", "),
      }));
      const wsMapeo = workbook.addWorksheet("Mapeo de Campos");
      wsMapeo.columns = [
        { header: "Campo Interno", key: "Campo Interno", width: 20 },
        {
          header: "Posibles Nombres Excel",
          key: "Posibles Nombres Excel",
          width: 40,
        },
      ];
      mapeoData.forEach((row) => wsMapeo.addRow(row));

      const wsInstrucciones = workbook.addWorksheet("Instrucciones");
      wsInstrucciones.columns = [
        { header: "Aspecto", key: "aspecto", width: 20 },
        { header: "Instrucción", key: "instruccion", width: 60 },
      ];
      const instrucciones = [
        {
          aspecto: "Fechas",
          instruccion: "Usa formato DD/MM/YYYY o DD-MM-YYYY.",
        },
        {
          aspecto: "Campos requeridos",
          instruccion: "FECHA_ENVIO, CLIENTE, COLABORADOR son obligatorios",
        },
        {
          aspecto: "Automatización",
          instruccion:
            "Activa 'Crear automáticamente' para entidades faltantes.",
        },
        {
          aspecto: "Colaboradores",
          instruccion:
            "Usa nombres completos. Se crearán automáticamente si no existen.",
        },
        {
          aspecto: "Productos",
          instruccion:
            "Nombres de productos/servicios. Se vincularán automáticamente a operadores.",
        },
        {
          aspecto: "Zonas",
          instruccion:
            "Nombres de zonas geográficas (Península, Canarias, etc.)",
        },
      ];
      instrucciones.forEach((row) => wsInstrucciones.addRow(row));

      const fileName = `plantilla_completa_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({
        message: `Plantilla descargada: ${fileName}`,
        type: "success",
      });
    } catch (error) {
      setToast({
        message: "Error al generar plantilla: " + error.message,
        type: "error",
      });
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadFile(file);
      setToast({ message: `Archivo cargado: ${file.name}`, type: "success" });
    } catch (error) {
      setToast({ message: `Error: ${error.message}`, type: "error" });
    }
  };

  const handleImport = async () => {
    startImporting();
    try {
      setToast({
        message: "Iniciando importación... Por favor espera.",
        type: "info",
      });

      if (!mapping || Object.keys(mapping).length === 0) {
        setToast({
          message: "Por favor, mapea al menos un campo",
          type: "error",
        });
        return;
      }

      if (validationStats.valid === 0) {
        setToast({
          message: "No hay filas válidas para importar",
          type: "error",
        });
        return;
      }

      try {
        setToast({
          message: `Procesando ${validationStats.valid} filas válidas...`,
          type: "info",
        });

        const resultado =
          crearAutomaticamente && autoCreacionDisponible
            ? await importInteligente()
            : await importNormal();

        const detalles = [];
        if (resultado.operadoresCreados > 0)
          detalles.push(`${resultado.operadoresCreados} operadores`);
        if (resultado.productosCreados > 0)
          detalles.push(`${resultado.productosCreados} productos`);
        if (resultado.colaboradoresCreados > 0)
          detalles.push(`${resultado.colaboradoresCreados} colaboradores`);
        if (resultado.zonasCreadas > 0)
          detalles.push(`${resultado.zonasCreadas} zonas`);

        const mensaje =
          crearAutomaticamente && autoCreacionDisponible
            ? `🚀 Importación inteligente completada: ${resultado.ventasCreadas} ventas${detalles.length > 0
              ? " + " + detalles.join(", ") + " creados"
              : ""
            }`
            : `✅ Importación exitosa: ${resultado.ventasCreadas} ventas guardadas`;

        setToast({ message: mensaje, type: "success" });

        if (onImportSuccess) {
          try {
            await onImportSuccess(resultado);
          } catch {
            setToast({
              message:
                "Importación exitosa, pero error recargando interfaz. Recarga la página.",
              type: "warning",
            });
          }
        }
      } catch (error) {
        setToast({ message: `❌ Error: ${error.message}`, type: "error" });
      }
    } finally {
      finishImporting();
    }
  };

  const handleImportSimplificado = async () => {
    startImporting();
    try {
      if (!rows.length) {
        setToast({ message: "No hay datos para importar", type: "error" });
        return;
      }

      try {
        setToast({
          message: "🔧 Ejecutando importación simplificada...",
          type: "info",
        });

        const resultado = await importSimplificado();

        setToast({
          message: `✅ IMPORTACIÓN COMPLETADA: ${resultado.ventasCreadas} ventas creadas`,
          type: "success",
        });

        if (onImportSuccess) {
          try {
            await onImportSuccess(resultado);
          } catch {
            setToast({
              message:
                "Importación exitosa, pero error recargando interfaz. Recarga la página.",
              type: "warning",
            });
          }
        }
      } catch (error) {
        setToast({ message: `❌ Error: ${error.message}`, type: "error" });
      }
    } finally {
      finishImporting();
    }
  };

  const handleRowErrorClick = (rowIndex) => {
    const validation = validateSingleRow(rowIndex);
    if (validation && !validation.isValid) {
      setErroresFila({
        fila: rowIndex + 1,
        errores: validation.errors,
      });
    }
  };

  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 20;
  const totalPreviewPages = Math.ceil(rows.length / PREVIEW_PAGE_SIZE);
  const pagedRows = rows.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Header Premium */}
      <div className={cn(glassStyles(), "p-8 rounded-[2.5rem] relative overflow-hidden")}>
        <BorderBeam size={200} duration={20} colorFrom="var(--brand-primary)" colorTo="var(--brand-primary)" opacity={0.5} />
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-[var(--brand-primary)] flex items-center justify-center shadow-2xl shadow-[var(--brand-primary)]/20">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase mb-2">
              Importador <span className="text-[var(--brand-primary)]">Inteligente</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
              Procesamiento de datos de alta velocidad con mapeo neuronal. Sube tus archivos Excel o CSV y deja que el sistema organice tu estructura comercial automáticamente.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Tarjeta de Carga */}
          <motion.div
            whileHover={{ y: -5 }}
            className={cn(glassStyles('subtle'), "p-8 rounded-3xl border-2 border-dashed border-[var(--brand-primary)]/20 text-center relative group overflow-hidden")}
          >
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Upload className="w-16 h-16 mx-auto mb-6 text-[var(--brand-primary)] group-hover:scale-110 transition-transform duration-500" />
            <h4 className="text-xl font-black mb-3 text-slate-800 dark:text-white uppercase tracking-tight">Subir Archivo</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Formatos compatibles: .xlsx, .xls y .csv
            </p>

            <input
              type="file"
              id="file-upload"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              disabled={isLoading}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className={cn(
                "inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all cursor-pointer shadow-xl",
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-[var(--brand-primary)] hover:opacity-90 active:scale-95"
              )}
            >
              {isLoading ? "Procesando ADN..." : "Seleccionar Excel / CSV"}
              <Zap className="w-4 h-4" />
            </label>

            {/* Opciones Avanzadas */}
            <div className="mt-10 grid grid-cols-1 gap-4 text-left border-t border-slate-200/50 dark:border-slate-700/50 pt-8">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${resolverNombres ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {resolverNombres && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5"></div>}
                </div>
                <input type="checkbox" className="hidden" checked={resolverNombres} onChange={(e) => setResolverNombres(e.target.checked)} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Resolver por nombre</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${guardarExtras ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {guardarExtras && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5"></div>}
                </div>
                <input type="checkbox" className="hidden" checked={guardarExtras} onChange={(e) => setGuardarExtras(e.target.checked)} />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">Guardar campos extra</span>
              </label>

              {autoCreacionDisponible && (
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${crearAutomaticamente ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 group-hover:border-emerald-400'}`}>
                    {crearAutomaticamente && <div className="w-2.5 h-1.5 border-l-2 border-b-2 border-white -rotate-45 mb-0.5"></div>}
                  </div>
                  <input type="checkbox" className="hidden" checked={crearAutomaticamente} onChange={(e) => setCrearAutomaticamente(e.target.checked)} />
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Auto-Creación Smart
                  </span>
                </label>
              )}
            </div>
          </motion.div>

          {/* Tarjeta de Plantilla */}
          <motion.div
            whileHover={{ y: -5 }}
            className={cn(glassStyles('subtle'), "p-8 rounded-3xl border border-emerald-500/20 text-center relative group overflow-hidden flex flex-col items-center justify-center")}
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <Download className="w-16 h-16 mx-auto mb-6 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
            <h4 className="text-xl font-black mb-3 text-slate-800 dark:text-white uppercase tracking-tight">Estructura Base</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium">
              Descarga la plantilla maestra con guía de mapeo integrada
            </p>

            <button
              onClick={descargarPlantillaCompleta}
              className="w-full py-4 rounded-2xl bg-[var(--brand-primary)] text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-[var(--brand-primary)]/20 hover:opacity-90 transition-all active:scale-95"
            >
              Descargar Plantilla
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-6 font-bold uppercase tracking-widest">
              Recomendado para datos legacy (+300 filas)
            </p>
          </motion.div>
        </div>

        {/* Alertas Críticas Estilizadas */}
        <div className="mt-12 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight">
              Aviso de Sistema: El campo PVP es el único vinculante para precios. Las columnas adicionales se archivan como metadata financiera.
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-blue-500 shrink-0" />
            <div className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tight">
              Seguridad: Los datos se limpian y validan contra el esquema de Supabase antes de cualquier escritura en la nube.
            </div>
          </div>
        </div>
      </div>

      {/* Mapeo de Columnas Premium */}
      {
        headers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(glassStyles(), "p-8 rounded-[2.5rem] relative overflow-hidden")}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-400/10">
                <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Configuración de Mapeo</h2>
            </div>

            <div className="mb-8 p-4 bg-sky-500/5 border border-sky-500/10 rounded-2xl">
              <p className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-widest leading-relaxed">
                Alinea tus columnas del Excel con la base de datos de Next Sales. Los campos con * son obligatorios para el cálculo de comisiones.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(MAPEO_CAMPOS).map((campo) => (
                <div key={campo} className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[2px] ml-1 block">
                    {campo.replace(/_/g, " ")}
                    {["fecha", "cliente", "colaborador_id"].includes(campo) && (
                      <span className="text-rose-500"> *</span>
                    )}
                  </label>
                  <select
                    className={cn(
                      "w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all shadow-inner cursor-pointer"
                    )}
                    value={mapping[campo] || ""}
                    onChange={(e) =>
                      setMapping((prev) => ({
                        ...prev,
                        [campo]: e.target.value,
                      }))
                    }
                  >
                    <option value="">Desvincular campo</option>
                    {headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </motion.div>
        )
      }

      {/* Previsualización de Datos Premium */}
      {
        rows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(glassStyles(), "p-8 rounded-[2.5rem] relative overflow-hidden")}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Validación de Datos en Caliente</h2>
              </div>

              {rows.length > PREVIEW_PAGE_SIZE && (
                <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-30"
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    disabled={previewPage === 1}
                  >
                    <Zap className="w-4 h-4 rotate-180" />
                  </button>
                  <span className="text-[10px] font-black text-slate-500 uppercase px-2">
                    PAGE {previewPage} / {totalPreviewPages}
                  </span>
                  <button
                    className="p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all disabled:opacity-30"
                    onClick={() => setPreviewPage((p) => Math.min(totalPreviewPages, p + 1))}
                    disabled={previewPage === totalPreviewPages}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6 mb-8 px-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Válidas: <span className="text-emerald-600 font-black">{validationStats.valid}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Errores: <span className="text-rose-600 font-black">{validationStats.invalid}</span>
                </span>
              </div>
              <div className="ml-auto text-[10px] font-black text-slate-400 uppercase tracking-[2px]">
                Escanéo de {validationStats.total} registros completado
              </div>
            </div>

            <div className="overflow-auto border border-slate-200/50 dark:border-slate-700/50 rounded-3xl max-h-[500px] shadow-inner bg-white/30 dark:bg-slate-900/10">
              <table className="text-xs w-full">
                <thead className="bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                  <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-200/50 dark:border-slate-700/50">
                    <th className="py-4 px-6 font-black uppercase tracking-widest text-left">ESTADO</th>
                    {headers.map((header) => (
                      <th key={header} className="py-4 px-6 font-black uppercase tracking-widest text-left whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                  {(rows.length > PREVIEW_PAGE_SIZE ? pagedRows : rows).map((row, index) => {
                    const realIndex = rows.length > PREVIEW_PAGE_SIZE ? (previewPage - 1) * PREVIEW_PAGE_SIZE + index : index;
                    const validation = validateSingleRow(realIndex);
                    const isValid = validation?.isValid ?? true;

                    return (
                      <tr key={realIndex} className={cn(
                        "transition-colors group",
                        isValid ? "hover:bg-emerald-500/5" : "hover:bg-rose-500/5"
                      )}>
                        <td className="py-4 px-6">
                          {isValid ? (
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRowErrorClick(realIndex)}
                              className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center hover:bg-rose-500/20 transition-all border border-rose-500/20"
                            >
                              <AlertCircle className="w-5 h-5 text-rose-500" />
                            </button>
                          )}
                        </td>
                        {headers.map((header) => (
                          <td key={`${realIndex}-${header}`} className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {(() => {
                              const valor = row[header];
                              if (header.toLowerCase().includes("fecha") && valor) {
                                const fechaParsed = parseDate(valor);
                                if (fechaParsed) {
                                  const [y, m, d] = fechaParsed.split("-");
                                  return `${d}/${m}/${y}`;
                                }
                              }
                              return String(valor || "—");
                            })()}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImport}
                disabled={validationStats.valid === 0 || isLoading}
                className={cn(
                  "px-8 py-4 rounded-2xl text-white font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl flex items-center gap-3",
                  "bg-[var(--brand-primary)] shadow-[var(--brand-primary)]/20"
                )}
              >
                <Zap className="w-4 h-4" />
                {isLoading ? "PROCESANDO ADN..." : crearAutomaticamente && autoCreacionDisponible
                  ? `🚀 IMPORTACIÓN INTELIGENTE (${validationStats.valid} FILAS)`
                  : `IMPORTAR ${validationStats.valid} FILAS VÁLIDAS`}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleImportSimplificado}
                disabled={rows.length === 0 || isLoading}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/20 disabled:opacity-50 flex items-center gap-3"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {isLoading ? "ESPERE..." : `IMPORTACIÓN SIMPLE (${rows.length})`}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={clearData}
                disabled={isLoading}
                className="px-8 py-4 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-extrabold uppercase tracking-widest text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-all flex items-center gap-3"
              >
                LIMPIAR BUFFER
              </motion.button>
            </div>
          </motion.div>
        )
      }

      {/* Modal de errores Premium */}
      <Modal
        open={!!erroresFila}
        onClose={() => setErroresFila(null)}
        title={erroresFila ? `Anomalías en Fila # ${erroresFila.fila}` : ""}
      >
        {erroresFila && (
          <div className="space-y-6">
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <ul className="space-y-2">
                {erroresFila.errores.map((error, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-rose-600 dark:text-rose-400 text-sm font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <strong className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Smart Resolution:</strong>
              </div>
              <ul className="text-xs font-medium text-slate-500 dark:text-slate-400 space-y-2">
                <li>• Verifica el formato de fecha (DD/MM/YYYY o DD-MM-YYYY).</li>
                <li>• Asegúrate de que los campos numéricos no contengan letras.</li>
                {!crearAutomaticamente && (
                  <li className="text-blue-500 font-bold">• Tip: Activa "Auto-Creación Smart" para ignorar errores de entidades faltantes.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Resumen de importación inteligente Premium */}
      {
        resumenImportacion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(glassStyles(), "p-8 rounded-[2.5rem] border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden")}
          >
            <BorderBeam size={100} duration={5} colorFrom="#10b981" colorTo="#059669" />
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Explosión de Datos Completada</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {resumenImportacion.operadoresNuevos?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">OPERADORES CRECIENDO:</p>
                  <div className="flex flex-wrap gap-2">
                    {resumenImportacion.operadoresNuevos.map((nombre, i) => (
                      <span key={i} className="px-2 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold border border-emerald-500/20">{nombre}</span>
                    ))}
                  </div>
                </div>
              )}

              {resumenImportacion.productosNuevos?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">NUEVO CATÁLOGO ({resumenImportacion.productosNuevos.length}):</p>
                  <div className="max-h-32 overflow-y-auto pr-2 space-y-1">
                    {resumenImportacion.productosNuevos.map((nombre, i) => (
                      <p key={i} className="text-[10px] font-bold text-slate-600 dark:text-slate-400 truncate tracking-tight">{nombre}</p>
                    ))}
                  </div>
                </div>
              )}

              {resumenImportacion.colaboradoresNuevos?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">TALENTO INTEGRADO:</p>
                  <div className="flex flex-wrap gap-2">
                    {resumenImportacion.colaboradoresNuevos.map((nombre, i) => (
                      <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-500/20">{nombre}</span>
                    ))}
                  </div>
                </div>
              )}

              {resumenImportacion.zonasNuevas?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">EXPANSIÓN TERRITORIAL:</p>
                  <div className="flex flex-wrap gap-2">
                    {resumenImportacion.zonasNuevas.map((nombre, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold border border-amber-500/20">{nombre}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-8 border-t border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-black text-emerald-600 uppercase tracking-tighter">
                    {resumenImportacion.ventasCreadas} Ventas Sincronizadas
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Operación exitosa en el clúster regional
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearData}
                className="px-8 py-4 rounded-2xl bg-emerald-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20"
              >
                Finalizar Proceso
              </motion.button>
            </div>
          </motion.div>
        )
      }
    </motion.div >
  );
}