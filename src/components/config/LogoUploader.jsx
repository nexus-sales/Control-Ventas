import React, { useRef } from "react";

export default function LogoUploader({ logoUrl, onChange }) {
  const fileInput = useRef();

  const handleFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md border border-slate-200 dark:border-darkAccent/30 rounded-2xl shadow w-full max-w-xs transition-colors">
      <div className="font-medium text-slate-700 dark:text-darkText mb-2">Logo de la empresa</div>
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="h-24 object-contain mb-2 border border-slate-300 dark:border-darkAccent/30 rounded-xl shadow" />
      ) : (
        <div className="h-24 w-24 flex items-center justify-center bg-slate-200 dark:bg-darkCard rounded-xl mb-2 text-slate-400 dark:text-darkText/40">Sin logo</div>
      )}
      <input type="file" accept="image/*" ref={fileInput} onChange={handleFile} className="hidden" />
      <button type="button" className="px-3 py-1 bg-purple-600 dark:bg-darkAccent hover:bg-purple-700 dark:hover:bg-purple-900 text-white rounded-xl shadow transition" onClick={() => fileInput.current.click()}>
        Subir logo
      </button>
      {logoUrl && (
        <button type="button" className="text-xs text-red-500 mt-1 hover:underline" onClick={() => onChange("")}>Quitar logo</button>
      )}
    </div>
  );
}
