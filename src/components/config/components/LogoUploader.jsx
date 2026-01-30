import React, { useRef, useCallback } from "react";
import { Upload, Trash2, Image as ImageIcon } from "lucide-react";

const LogoUploader = React.memo(({ logoUrl, onChange }) => {
    const fileInput = useRef();

    const handleFile = useCallback((e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo es demasiado grande. Máximo 2MB permitido.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido.');
            return;
        }

        const reader = new FileReader();
        reader.onload = ev => onChange(ev.target.result);
        reader.onerror = () => alert('Error al leer el archivo');
        reader.readAsDataURL(file);
    }, [onChange]);

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-sm w-full transition-all">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-gray-200 uppercase text-xs tracking-wider">
                <ImageIcon className="w-4 h-4 text-purple-500" />
                Logo de la empresa
            </div>

            <div className="relative group">
                {logoUrl ? (
                    <div className="relative h-32 w-48 bg-slate-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700 shadow-inner flex items-center justify-center p-4">
                        <img
                            src={logoUrl}
                            alt="Logo de la empresa"
                            className="max-h-full max-w-full object-contain"
                        />
                    </div>
                ) : (
                    <div className="h-32 w-48 flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-900 border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl text-slate-400">
                        <Upload className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-xs">Sin logo</span>
                    </div>
                )}
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileInput}
                onChange={handleFile}
                className="hidden"
            />

            <div className="flex flex-col w-full gap-2">
                <button
                    type="button"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow transition active:scale-95 text-sm font-semibold"
                    onClick={() => fileInput.current?.click()}
                >
                    <Upload className="w-4 h-4" />
                    {logoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                </button>

                {logoUrl && (
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 text-xs text-red-500 hover:text-red-600 transition font-medium"
                        onClick={() => onChange("")}
                    >
                        <Trash2 className="w-3 h-3" />
                        Quitar logo
                    </button>
                )}
            </div>

            <p className="text-[10px] text-slate-400 text-center">Recomendado: PNG o SVG <br /> Máx: 2MB</p>
        </div>
    );
});

export default LogoUploader;
