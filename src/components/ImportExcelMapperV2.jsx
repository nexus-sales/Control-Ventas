// src/components/ImportExcelMapperV2.jsx
// Componente UI simplificado que usa el hook useImportExcel

import { useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import Toast from "./ui/Toast";
import Card from "./ui/Card";
import SectionTitle from "./ui/SectionTitle";
import { useImportExcel } from "../hooks/useImportExcel";
import { MAPEO_CAMPOS, parseDate } from "../utils/importValidation";
import { useAuth } from "../hooks/useAuth";

// Modal simple para mostrar errores
function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2 text-slate-500 hover:bg-slate-100 rounded-full"
        >
          ×
        </button>
        <h3 className="text-lg font-bold mb-4">{title}</h3>
        <div>{children}</div>
      </div>
    </div>
  );
}

export default function ImportExcelMapperV2({
  setVentas,
  setProductos,
  setOperadores,
  setColaboradores,
  setZonas,
  onImportSuccess, // ← PROP AGREGADA para recargar datos
  productos = [],
  operadores = [],
  colaboradores = [],
  zonas = [],
}) {
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [erroresFila, setErroresFila] = useState(null);

  // Usar el hook personalizado
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
  } = useImportExcel({
    productos,
    operadores,
    colaboradores,
    zonas,
    setVentas,
    setProductos,
    setOperadores,
    setColaboradores,
    setZonas,
    onImportSuccess, // ← PASAR onImportSuccess al hook
  });

  const { startImporting, finishImporting } = useAuth();

  // Verificar si la funcionalidad de auto-creación está disponible
  const autoCreacionDisponible = !!(setProductos && setOperadores && setColaboradores && setZonas);

  // --------- Generar plantilla completa ---------
  const descargarPlantillaCompleta = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      
      // Hoja de datos de ejemplo
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
          ESTADO: "Confirmada"
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
          ESTADO: "Pendiente"
        }
      ];
      
      const headers = Object.keys(datosEjemplo[0]);
      const ws = workbook.addWorksheet("Plantilla Ejemplo");
      ws.columns = headers.map((h) => ({ header: h, key: h, width: 18 }));
      datosEjemplo.forEach((row) => ws.addRow(row));

      // Hoja de mapeo de campos
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

      // Hoja de instrucciones
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
          instruccion: "Usa nombres completos. Se crearán automáticamente si no existen.",
        },
        {
          aspecto: "Productos",
          instruccion: "Nombres de productos/servicios. Se vincularán automáticamente a operadores.",
        },
        {
          aspecto: "Zonas",
          instruccion: "Nombres de zonas geográficas (Península, Canarias, etc.)",
        }
      ];
      instrucciones.forEach((row) => wsInstrucciones.addRow(row));

      const fileName = `plantilla_completa_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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

  // Manejar carga de archivo
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await loadFile(file);
      setToast({ message: `Archivo cargado: ${file.name}`, type: "success" });
    } catch (error) {
      console.error('Error cargando archivo:', error);
      setToast({ message: `Error: ${error.message}`, type: "error" });
    }
  };

  // Manejar importación - FUNCIÓN OPTIMIZADA
  const handleImport = async () => {
    startImporting();
    try {
      console.log('🔍 INICIANDO IMPORTACIÓN OPTIMIZADA');
      
      // Mostrar progreso visual
      setToast({ 
        message: "Iniciando importación... Por favor espera.", 
        type: "info" 
      });
      
      console.log('Estado actual:', {
        crearAutomaticamente,
        validationStats,
        autoCreacionDisponible,
        settersDisponibles: {
          setProductos: !!setProductos,
          setOperadores: !!setOperadores,
          setColaboradores: !!setColaboradores,
          setZonas: !!setZonas,
        }
      });

      // Validaciones previas
      if (!mapping || Object.keys(mapping).length === 0) {
        setToast({ message: "Por favor, mapea al menos un campo", type: "error" });
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
        // Actualizar progreso
        setToast({ 
          message: `Procesando ${validationStats.valid} filas válidas...`, 
          type: "info" 
        });

        // Ejecutar importación
        const resultado = crearAutomaticamente && autoCreacionDisponible
          ? await importInteligente()
          : await importNormal();

        console.log('✅ RESULTADO IMPORTACIÓN:', resultado);

        // Mensaje de éxito mejorado con detalles
        const detalles = [];
        if (resultado.operadoresCreados > 0) detalles.push(`${resultado.operadoresCreados} operadores`);
        if (resultado.productosCreados > 0) detalles.push(`${resultado.productosCreados} productos`);
        if (resultado.colaboradoresCreados > 0) detalles.push(`${resultado.colaboradoresCreados} colaboradores`);
        if (resultado.zonasCreadas > 0) detalles.push(`${resultado.zonasCreadas} zonas`);

        const mensaje = crearAutomaticamente && autoCreacionDisponible
          ? `🚀 Importación inteligente completada: ${resultado.ventasCreadas} ventas ${detalles.length > 0 ? '+ ' + detalles.join(', ') + ' creados' : ''}`
          : `✅ Importación exitosa: ${resultado.ventasCreadas} ventas guardadas`;

        setToast({ message: mensaje, type: "success" });

        // ← LÍNEAS CRÍTICAS AGREGADAS: Recargar datos después del éxito
        if (onImportSuccess) {
          console.log("🔄 Recargando datos después de importación exitosa...");
          try {
            await onImportSuccess();
            console.log("✅ Datos recargados correctamente en la interfaz");
          } catch (reloadError) {
            console.error("❌ Error recargando datos:", reloadError);
            setToast({ 
              message: "Importación exitosa, pero error recargando interfaz. Recarga la página.", 
              type: "warning" 
            });
          }
        } else {
          console.warn("⚠️ onImportSuccess no está definido - los datos no se recargarán automáticamente");
        }
        
        // No limpiar datos inmediatamente para permitir ver el resumen
        // clearData();
      } catch (error) {
        console.error('❌ ERROR IMPORTACIÓN:', error);
        setToast({ message: `❌ Error: ${error.message}`, type: "error" });
      }
    } finally {
      finishImporting();
    }
  };

  // Importación simplificada para casos difíciles
  const handleImportSimplificado = async () => {
    startImporting();
    try {
      if (!rows.length) {
        setToast({ message: "No hay datos para importar", type: "error" });
        return;
      }

      try {
        console.log('🔧 EJECUTANDO IMPORTACIÓN SIMPLIFICADA...');
        setToast({ message: "🔧 Ejecutando importación simplificada...", type: "info" });

        const resultado = await importSimplificado();
        
        console.log('🔧 RESULTADO SIMPLIFICADO:', resultado);

        setToast({ 
          message: `✅ IMPORTACIÓN COMPLETADA: ${resultado.ventasCreadas} ventas creadas`, 
          type: "success" 
        });

        // Recargar datos
        if (onImportSuccess) {
          console.log("🔧 Recargando datos después de importación simplificada...");
          try {
            await onImportSuccess();
            console.log("🔧 Datos recargados correctamente");
          } catch (reloadError) {
            console.error("🔧 Error recargando datos:", reloadError);
          }
        }

      } catch (error) {
        console.error('🔧 ERROR IMPORTACIÓN SIMPLIFICADA:', error);
        setToast({ message: `❌ Error: ${error.message}`, type: "error" });
      }
    } finally {
      finishImporting();
    }
  };

  // Mostrar errores de fila
  const handleRowErrorClick = (rowIndex) => {
    const validation = validateSingleRow(rowIndex);
    if (validation && !validation.isValid) {
      setErroresFila({
        fila: rowIndex + 1,
        errores: validation.errors,
      });
    }
  };

  // Previsualización: paginación para grandes volúmenes
  // Añadir paginación si hay más de 100 filas
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_PAGE_SIZE = 20;
  const totalPreviewPages = Math.ceil(rows.length / PREVIEW_PAGE_SIZE);
  const pagedRows = rows.slice(
    (previewPage - 1) * PREVIEW_PAGE_SIZE,
    previewPage * PREVIEW_PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />

      {/* Header */}
      <Card>
        <div className="flex items-center mb-4">
          <FileSpreadsheet className="w-6 h-6 mr-3 text-sky-600" />
          <div>
            <SectionTitle>
              Importación/Exportación Masiva Excel/CSV
            </SectionTitle>
            <p className="text-sm text-slate-600">
              Importa y exporta datos fácilmente. Optimizado para datos legacy y
              nuevos.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Sección de importación */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-300 transition-colors bg-gradient-to-br from-sky-50 to-sky-100">
            <Upload className="w-12 h-12 mx-auto mb-4 text-sky-600" />
            <h4 className="font-semibold mb-2 text-slate-800">
              Importar Excel/CSV
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              Soporta archivos .xlsx, .xls y .csv con mapeo automático
              inteligente
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
              className={`inline-block px-4 py-2 rounded-lg text-white transition-all cursor-pointer ${        
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
              }`}
            >
              {isLoading ? "Cargando..." : "Seleccionar archivo"}
            </label>
            
            {/* Opciones */}
            <div className="mt-4 space-y-2">
              <label className="flex items-center justify-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={resolverNombres}
                  onChange={(e) => setResolverNombres(e.target.checked)}
                  className="rounded"
                />
                Resolver por nombre si no es ID
              </label>
              <label className="flex items-center justify-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={guardarExtras}
                  onChange={(e) => setGuardarExtras(e.target.checked)}
                  className="rounded"
                />
                Guardar campos adicionales
              </label>
              {autoCreacionDisponible && (
                <label className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-700">
                  <input
                    type="checkbox"
                    checked={crearAutomaticamente}
                    onChange={(e) => setCrearAutomaticamente(e.target.checked)}
                    className="rounded"
                  />
                  🚀 Crear automáticamente entidades faltantes
                </label>
              )}
              {!autoCreacionDisponible && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Auto-creación no disponible: faltan setters de entidades
                </div>
              )}
            </div>
          </div>

          {/* Sección de exportar/descargar plantilla */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-emerald-300 transition-colors bg-gradient-to-br from-emerald-50 to-emerald-100 flex flex-col items-center justify-center">
            <Download className="w-12 h-12 mx-auto mb-4 text-emerald-600" />
            <h4 className="font-semibold mb-2 text-slate-800">
              Plantilla Completa
            </h4>
            <p className="text-sm text-slate-600 mb-4">
              Descarga una plantilla Excel lista para importar, con ejemplo,
              mapeo y guía de uso.
            </p>
            <button
              onClick={descargarPlantillaCompleta}
              className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              Descargar Plantilla
            </button>
            <p className="text-xs text-slate-500 mt-2">
              Incluye ejemplo, mapeo y guía para datos antiguos y nuevos.
            </p>
          </div>
        </div>

        {/* Advertencias importantes */}
        <div className="mt-4 space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <strong>Importante:</strong> El sistema solo usa la columna PVP
                para el precio del producto. Las columnas IMPORTE, TOTAL y
                COMISION se guardan como datos financieros separados.
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <strong>Datos Legacy:</strong> Para +300 registros antiguos,
                activa "Crear automáticamente" y el sistema creará
                colaboradores, productos y zonas que falten con valores por
                defecto.
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Mapeo de columnas */}
      {headers.length > 0 && (
        <Card>
          <SectionTitle>Mapeo de Columnas</SectionTitle>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Ajusta el mapeo de columnas según necesites. Los campos marcados
              con * son requeridos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {Object.keys(MAPEO_CAMPOS).map((campo) => (
              <div key={campo} className="flex items-center gap-2">
                <label className="w-24 text-sm font-medium text-slate-700 truncate">
                  {campo.replace(/_/g, " ")}
                  {["fecha", "cliente", "colaborador_id"].includes(campo) && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <select
                  className="border rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  value={mapping[campo] || ""}
                  onChange={(e) =>
                    setMapping((prev) => ({ ...prev, [campo]: e.target.value }))
                  }
                >
                  <option value="">—</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Previsualización */}
      {rows.length > 0 && (
        <Card>
          <SectionTitle>Previsualización de Datos</SectionTitle>

          <div className="mb-4 flex justify-between items-center">
            <div className="text-sm text-slate-600">
              {rows.length > PREVIEW_PAGE_SIZE
                ? `Mostrando filas ${((previewPage - 1) * PREVIEW_PAGE_SIZE) + 1} a ${Math.min(previewPage * PREVIEW_PAGE_SIZE, rows.length)} de ${rows.length}`
                : `Mostrando ${rows.length} filas`}
            </div>
            {rows.length > PREVIEW_PAGE_SIZE && (
              <div className="flex gap-2 items-center">
                <button
                  className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-sm hover:bg-slate-300"
                  onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                  disabled={previewPage === 1}
                >
                  Anterior
                </button>
                <span className="text-xs text-slate-500">
                  Página {previewPage} de {totalPreviewPages}
                </span>
                <button
                  className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-sm hover:bg-slate-300"
                  onClick={() => setPreviewPage(p => Math.min(totalPreviewPages, p + 1))}
                  disabled={previewPage === totalPreviewPages}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>

          {/* Estadísticas de validación */}
          <div className="mb-4 flex gap-4 text-sm">
            <span className="text-green-600 font-medium">
              ✅ Válidas: {validationStats.valid}
            </span>
            <span className="text-red-600 font-medium">
              ❌ Inválidas: {validationStats.invalid}
            </span>
            <span className="text-slate-600">
              Total: {validationStats.total}
            </span>
          </div>

          <div className="overflow-auto border border-slate-200 rounded-lg max-h-96">
            <table className="text-sm w-full">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left py-2 px-3 font-medium">Estado</th>
                  {headers.map((header) => (
                    <th
                      key={header}
                      className="text-left py-2 px-3 font-medium whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(rows.length > PREVIEW_PAGE_SIZE ? pagedRows : rows).map((row, index) => {
                  // Ajustar el índice real para validación y errores
                  const realIndex = rows.length > PREVIEW_PAGE_SIZE
                    ? (previewPage - 1) * PREVIEW_PAGE_SIZE + index
                    : index;
                  const validation = validateSingleRow(realIndex);
                  const isValid = validation?.isValid ?? true;

                  return (
                    <tr
                      key={realIndex}
                      className={`border-b ${isValid ? "bg-green-50" : "bg-red-50"}`}
                    >
                      <td className="py-2 px-3">
                        {isValid ? (
                          <span
                            className="w-3 h-3 bg-green-500 rounded-full inline-block"
                            title="Válido"
                          ></span>
                        ) : (
                          <button
                            type="button"
                            className="w-3 h-3 bg-red-500 rounded-full hover:ring-2 hover:ring-red-300"        
                            title="Ver errores"
                            onClick={() => handleRowErrorClick(realIndex)}
                          />
                        )}
                      </td>
                      {headers.map((header) => (
                        <td
                          key={`${realIndex}-${header}`}
                          className="py-2 px-3 whitespace-nowrap"
                        >
                          {(() => {
                            const valor = row[header];
                            if (
                              header.toLowerCase().includes("fecha") &&
                              valor
                            ) {
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

          {/* Botones de acción */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleImport}
              disabled={validationStats.valid === 0 || isLoading}
              className="px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: crearAutomaticamente && autoCreacionDisponible
                  ? "linear-gradient(to right, #10b981, #059669)"
                  : "linear-gradient(to right, #0ea5e9, #0284c7)",
              }}
            >
              {isLoading
                ? "Procesando..."
                : crearAutomaticamente && autoCreacionDisponible
                  ? `🚀 Importación Inteligente (${validationStats.valid} filas)`
                  : `Importar ${validationStats.valid} filas válidas`}
            </button>

            {/* Botón de importación simplificada */}
            <button
              onClick={handleImportSimplificado}
              disabled={rows.length === 0 || isLoading}
              className="px-4 py-2 rounded-xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(to right, #f59e0b, #d97706)",
              }}
            >
              {isLoading
                ? "Procesando..."
                : `🔧 Importar Simplificado (${rows.length} filas)`}
            </button>

            <button
              onClick={clearData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600 transition-all"
            >
              Limpiar
            </button>
          </div>
        </Card>
      )}

      {/* Modal de errores */}
      <Modal
        open={!!erroresFila}
        onClose={() => setErroresFila(null)}
        title={erroresFila ? `Errores en la fila ${erroresFila.fila}` : ""}
      >
        {erroresFila && (
          <div>
            <ul className="list-disc pl-5 space-y-1 text-red-700 mb-4">
              {erroresFila.errores.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
            <div className="bg-slate-50 p-3 rounded-lg">
              <strong className="text-slate-700">Sugerencias:</strong>
              <ul className="text-sm text-slate-600 mt-2 space-y-1">
                <li>• Verifica que los datos sean correctos</li>
                <li>
                  • Asegúrate de que las fechas estén en formato DD/MM/YYYY
                </li>
                {!crearAutomaticamente && (
                  <li>
                    • Activa "Crear automáticamente" para generar entidades
                    faltantes
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      {/* Resumen de importación inteligente */}
      {resumenImportacion && (
        <Card className="border-green-200 bg-green-50">
          <SectionTitle>Resumen de Importación Inteligente</SectionTitle>
          <div className="space-y-3">
            {resumenImportacion.operadoresNuevos?.length > 0 && (
              <div>
                <strong className="text-green-700">
                  ✅ Operadores creados:
                </strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {resumenImportacion.operadoresNuevos.map((nombre, i) => (
                    <span
                      key={i}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                    >
                      {nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resumenImportacion.productosNuevos?.length > 0 && (
              <div>
                <strong className="text-green-700">
                  ✅ Productos creados:
                </strong>
                <div className="mt-1 text-sm text-green-800 max-h-32 overflow-y-auto">
                  {resumenImportacion.productosNuevos.join(", ")}
                </div>
              </div>
            )}

            {resumenImportacion.colaboradoresNuevos?.length > 0 && (
              <div>
                <strong className="text-green-700">
                  ✅ Colaboradores creados:
                </strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {resumenImportacion.colaboradoresNuevos.map((nombre, i) => (
                    <span
                      key={i}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                    >
                      {nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {resumenImportacion.zonasNuevas?.length > 0 && (
              <div>
                <strong className="text-green-700">✅ Zonas creadas:</strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {resumenImportacion.zonasNuevas.map((nombre, i) => (
                    <span
                      key={i}
                      className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs"
                    >
                      {nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="text-lg font-bold text-green-800 bg-white p-3 rounded-lg">
              ✅ {resumenImportacion.ventasCreadas} ventas creadas exitosamente
            </div>

            {resumenImportacion.ventasRechazadas > 0 && (
              <div className="text-amber-600">
                ⚠️ {resumenImportacion.ventasRechazadas} ventas rechazadas por
                datos incompletos
              </div>
            )}

            {resumenImportacion.errores?.length > 0 && (
              <div className="text-red-600">
                <strong>❌ Errores:</strong>
                <ul className="list-disc pl-5 text-sm mt-2">
                  {resumenImportacion.errores.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={clearData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
              >
                Finalizar y Limpiar
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
