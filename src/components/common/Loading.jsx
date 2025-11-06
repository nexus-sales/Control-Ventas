import React from "react";
import { Target } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-slate-500" />
          <h2 className="font-semibold text-slate-800">Cargando...</h2>
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}
