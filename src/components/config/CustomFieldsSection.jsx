// src/components/config/CustomFieldsSection.jsx
import React, { useState } from 'react';
import { crearCampoPersonalizado, ejemploCampoPersonalizado } from '../../data/customFieldsModel';

export default function CustomFieldsSection() {
  const [campos, setCampos] = useState([ejemploCampoPersonalizado]);
  const [nuevoCampo, setNuevoCampo] = useState({
    nombre: '',
    tipo: 'texto',
    modulo: 'ventas',
    opciones: '',
    requerido: false,
    orden: campos.length + 1,
    activo: true,
  });

  const tipos = ['texto', 'número', 'fecha', 'select'];
  const modulos = ['ventas', 'productos', 'operadores'];

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setNuevoCampo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  function handleAddCampo(e) {
    e.preventDefault();
    const opcionesArr = nuevoCampo.tipo === 'select' ? nuevoCampo.opciones.split(',').map(o => o.trim()) : [];
    const campo = crearCampoPersonalizado({
      ...nuevoCampo,
      opciones: opcionesArr,
      orden: campos.length + 1
    });
    setCampos([...campos, campo]);
    setNuevoCampo({ nombre: '', tipo: 'texto', modulo: 'ventas', opciones: '', requerido: false, orden: campos.length + 2, activo: true });
  }

  function handleDeleteCampo(id) {
    setCampos(campos.filter(c => c.id !== id));
  }

  return (
    <section className="max-w-3xl mx-auto bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-8 space-y-8 transition-colors">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-darkText mb-2">Campos personalizados</h2>
      <p className="text-base text-purple-700 dark:text-darkAccent font-semibold mb-6">Gestiona los campos personalizados para ventas, productos y operadores.</p>
      <div className="divide-y divide-slate-200 dark:divide-darkAccent/20 space-y-8">
        <div className="pt-0">
          <form className="mb-6 flex flex-wrap gap-3 items-end" onSubmit={handleAddCampo}>
            <input className="border rounded px-2 py-1" name="nombre" placeholder="Nombre" value={nuevoCampo.nombre} onChange={handleChange} required />
            <select className="border rounded px-2 py-1" name="tipo" value={nuevoCampo.tipo} onChange={handleChange}>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="border rounded px-2 py-1" name="modulo" value={nuevoCampo.modulo} onChange={handleChange}>
              {modulos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {nuevoCampo.tipo === 'select' && (
              <input className="border rounded px-2 py-1" name="opciones" placeholder="Opciones (separadas por coma)" value={nuevoCampo.opciones} onChange={handleChange} />
            )}
            <label className="flex items-center gap-1">
              <input type="checkbox" name="requerido" checked={nuevoCampo.requerido} onChange={handleChange} /> Requerido
            </label>
            <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Añadir</button>
          </form>
        </div>
        <div className="pt-8">
          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border px-2 py-1">Nombre</th>
                <th className="border px-2 py-1">Tipo</th>
                <th className="border px-2 py-1">Módulo</th>
                <th className="border px-2 py-1">Opciones</th>
                <th className="border px-2 py-1">Requerido</th>
                <th className="border px-2 py-1">Activo</th>
                <th className="border px-2 py-1">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {campos.map(campo => (
                <tr key={campo.id}>
                  <td className="border px-2 py-1">{campo.nombre}</td>
                  <td className="border px-2 py-1">{campo.tipo}</td>
                  <td className="border px-2 py-1">{campo.modulo}</td>
                  <td className="border px-2 py-1">{campo.opciones?.join(', ')}</td>
                  <td className="border px-2 py-1 text-center">{campo.requerido ? '✔️' : ''}</td>
                  <td className="border px-2 py-1 text-center">{campo.activo ? '✔️' : ''}</td>
                  <td className="border px-2 py-1 text-center">
                    <button className="text-red-600 hover:underline" onClick={() => handleDeleteCampo(campo.id)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
