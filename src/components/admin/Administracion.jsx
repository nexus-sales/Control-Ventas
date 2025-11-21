import React, { useState } from "react";

const OPERADORES = ["Telefonía", "Energía", "Seguridad"];
const CLAVE_GERENTE = "@LMB1828re"; // Puedes cambiarla luego

export default function Administracion() {
  const [acuerdos, setAcuerdos] = useState([]);
    const [form, setForm] = useState({
      sector: "Telefonía",
      operador: "",
      nombre: "",
      comision: "",
      rapel: "",
      observaciones: "",
      archivo: null,
      archivoNombre: ""
    });
  const [clave, setClave] = useState("");
  const [acceso, setAcceso] = useState(false);
  const [errorClave, setErrorClave] = useState("");

  // Validar clave
  function handleClaveSubmit(e) {
    e.preventDefault();
    if (clave === CLAVE_GERENTE) {
      setAcceso(true);
      setErrorClave("");
    } else {
      setErrorClave("Clave incorrecta");
    }
  }

  // Guardar acuerdo
  function handleFormSubmit(e) {
    e.preventDefault();
      // Validación básica
      if (!form.operador.trim() || !form.nombre.trim() || !form.comision.trim()) {
        alert("Por favor, rellena los campos obligatorios.");
        return;
      }
    setAcuerdos([...acuerdos, { ...form, id: Date.now() }]);
      setForm({ sector: "Telefonía", operador: "", nombre: "", comision: "", rapel: "", observaciones: "", archivo: null, archivoNombre: "" });
  }

  function handleDelete(id) {
    setAcuerdos(acuerdos.filter(a => a.id !== id));
  }

  if (!acceso) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">Acceso Gerente</h2>
        <form onSubmit={handleClaveSubmit} className="space-y-4">
          <input
            type="password"
            className="border rounded px-3 py-2 w-full"
            placeholder="Clave de acceso"
            value={clave}
            onChange={e => setClave(e.target.value)}
            required
          />
          {errorClave && <div className="text-red-500 text-sm">{errorClave}</div>}
          <button className="bg-blue-600 text-white px-4 py-2 rounded w-full" type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow">
      <h2 className="text-2xl font-bold mb-6">Administración de Acuerdos</h2>
      <form onSubmit={handleFormSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block mb-1 font-medium">Sector</label>
          <select
            className="border rounded px-3 py-2 w-full"
            name="sector"
            value={form.sector}
            onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
          >
            <option value="Telefonía">Telefonía</option>
            <option value="Energía">Energía</option>
            <option value="Seguridad">Seguridad</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Operador</label>
          <input
            className="border rounded px-3 py-2 w-full"
            name="operador"
            value={form.operador}
            onChange={e => setForm(f => ({ ...f, operador: e.target.value }))}
            placeholder="Nombre real del operador"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Nombre del acuerdo</label>
          <input
            className="border rounded px-3 py-2 w-full"
            name="nombre"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Comisión</label>
          <input
            className="border rounded px-3 py-2 w-full"
            name="comision"
            value={form.comision}
            onChange={e => setForm(f => ({ ...f, comision: e.target.value }))}
            placeholder="Ej: 10% o 50€"
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Rapel por objetivo</label>
          <input
            className="border rounded px-3 py-2 w-full"
            name="rapel"
            value={form.rapel}
            onChange={e => setForm(f => ({ ...f, rapel: e.target.value }))}
            placeholder="Ej: 100 ventas, 5000€ facturación"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Observaciones</label>
          <textarea
            className="border rounded px-3 py-2 w-full"
            name="observaciones"
            value={form.observaciones}
            onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
          />
        </div>
          <div>
            <label className="block mb-1 font-semibold text-slate-700">Archivo de comisiones/contrato firmado (PDF/Excel)</label>
            <input
              type="file"
              accept=".pdf,.xls,.xlsx"
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400"
              onChange={e => {
                const file = e.target.files[0];
                setForm(f => ({ ...f, archivo: file || null, archivoNombre: file ? file.name : "" }));
              }}
            />
            {form.archivoNombre && (
              <div className="text-xs text-slate-600 mt-1">Archivo seleccionado: {form.archivoNombre}</div>
            )}
          </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded w-full" type="submit">Guardar acuerdo</button>
      </form>
      <h3 className="text-lg font-bold mb-2">Acuerdos registrados</h3>
      <table className="w-full border text-sm mb-6">
        <thead>
          <tr className="bg-slate-100">
            <th className="border px-2 py-1">Sector</th>
            <th className="border px-2 py-1">Operador</th>
            <th className="border px-2 py-1">Nombre</th>
            <th className="border px-2 py-1">Comisión</th>
            <th className="border px-2 py-1">Rapel</th>
            <th className="border px-2 py-1">Observaciones</th>
            <th className="border px-2 py-1">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {acuerdos.length === 0 && (
            <tr><td colSpan={7} className="text-center text-slate-400 py-4">No hay acuerdos registrados</td></tr>
          )}
          {acuerdos.map(a => (
            <tr key={a.id}>
              <td className="border px-2 py-1">{a.sector}</td>
              <td className="border px-2 py-1">{a.operador}</td>
              <td className="border px-2 py-1">{a.nombre}</td>
              <td className="border px-2 py-1">{a.comision}</td>
              <td className="border px-2 py-1">{a.rapel}</td>
              <td className="border px-2 py-1">{a.observaciones}</td>
              <td className="border px-2 py-1">
                <button className="text-red-600 hover:underline" onClick={() => handleDelete(a.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
