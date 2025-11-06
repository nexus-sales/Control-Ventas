import React, { useState, useEffect } from "react";
import EmpresaForm from "./EmpresaForm";
import LogoUploader from "./LogoUploader";
import ColorPicker from "./ColorPicker";
// import UsuariosConectados from "./UsuariosConectados";
// import ActividadReciente from "./ActividadReciente";

const LOCAL_KEY = "empresaData";

export default function AdminSection() {
  const [empresa, setEmpresa] = useState({
    nombre: "",
    cif: "",
    direccion: "",
    telefono: "",
    email: "",
    web: "",
    logoUrl: "",
    colorCorporativo: "#6D28D9"
  });

  useEffect(() => {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) setEmpresa(JSON.parse(raw));
  }, []);

  const handleChange = (data) => {
    setEmpresa((prev) => ({ ...prev, ...data }));
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...empresa, ...data }));
  };

  return (
    <section className="max-w-2xl mx-auto bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:from-darkBg dark:via-darkCard dark:to-darkCard rounded-2xl shadow-xl border border-slate-200 dark:border-darkAccent/30 p-8 space-y-8 transition-colors">
      <h2 className="text-3xl font-bold text-slate-800 dark:text-darkText mb-2">Administración</h2>
      <p className="text-lg text-purple-700 dark:text-darkAccent font-semibold mb-6">Configura los datos de tu empresa y personaliza la imagen corporativa.</p>
      <div className="divide-y divide-slate-200 dark:divide-darkAccent/20 space-y-8">
        <div className="pt-0">
          <EmpresaForm empresa={empresa} onChange={handleChange} />
        </div>
        <div className="flex flex-col md:flex-row gap-8 pt-8">
          <LogoUploader logoUrl={empresa.logoUrl} onChange={logoUrl => handleChange({ logoUrl })} />
          <ColorPicker color={empresa.colorCorporativo} onChange={colorCorporativo => handleChange({ colorCorporativo })} />
        </div>
      </div>
      {/* <UsuariosConectados />
      <ActividadReciente /> */}
    </section>
  );
}
