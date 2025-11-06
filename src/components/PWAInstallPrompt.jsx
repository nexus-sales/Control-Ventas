import { useEffect, useState } from "react";

export default function PWAInstallPrompt() {
  const [ready, setReady] = useState(false);
  const [deferred, setDeferred] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
      setReady(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!ready) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setReady(false);
    setDeferred(null);
  };

  return (
    <button
      onClick={install}
      className="px-3 py-1.5 rounded-xl text-sm border bg-white hover:bg-slate-50"
      title="Instalar aplicación"
      aria-label="Instalar aplicación como PWA"
    >
      Instalar app
    </button>
  );
}

// Revisión general:
// - El componente implementa correctamente el prompt de instalación PWA usando el evento beforeinstallprompt.
// - El botón solo aparece cuando la app está lista para instalarse.
// - El flujo de instalación es correcto y seguro.
// - El diseño es simple, accesible y reutilizable.

// Sugerencias menores:
// - Podrías mostrar un mensaje de éxito o error tras la instalación si quieres mejorar la UX.
// - Si usas TypeScript, podrías tipar los estados para mayor robustez.
// - Si quieres evitar logs en producción, podrías agregar un flag para desactivarlos.

// No se requieren cambios funcionales. El archivo es robusto y listo para producción.
