import React from "react";

export default function ColorPicker({ color, onChange }) {
  return (
    <div className="flex flex-col items-center gap-2 p-6 bg-white/80 dark:bg-darkCard/80 backdrop-blur-md border border-slate-200 dark:border-darkAccent/30 rounded-2xl shadow w-full max-w-xs transition-colors">
      <div className="font-medium text-slate-700 dark:text-darkText mb-2">
        Color corporativo
      </div>
      <div
        className="w-16 h-16 rounded-full border-4 border-white dark:border-darkAccent shadow"
        style={{ background: color }}
      ></div>
      <input
        type="color"
        value={color}
        onChange={e => onChange(e.target.value)}
        className="w-10 h-10 border-none bg-transparent cursor-pointer mt-2"
        style={{ background: color }}
      />
      <div className="text-xs text-slate-500 dark:text-darkText/60 mt-1">
        {color}
      </div>
    </div>
  );
}
