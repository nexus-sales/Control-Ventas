import React from "react";
import { AlertCircle } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // LOG ELIMINADO
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <div>
              <h2 className="font-semibold text-red-700">Error en la aplicación</h2>
              <p className="text-sm text-red-600">{String(this.state.error)}</p>
            </div>
          </div>
          <button
            className="mt-4 px-3 py-2 rounded-lg bg-slate-900 text-white"
            onClick={() => window.location.reload()}
          >
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
