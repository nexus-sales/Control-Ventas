import React from "react";
import { Palette } from "lucide-react";

const ColorPicker = React.memo(({ color, onChange }) => {
    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-sm w-full transition-all">
            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-gray-200 uppercase text-xs tracking-wider">
                <Palette className="w-4 h-4 text-purple-500" />
                Color Corporativo
            </div>

            <div className="relative group p-1 bg-white dark:bg-gray-900 rounded-full shadow-inner border border-slate-200 dark:border-gray-700">
                <div
                    className="w-24 h-24 rounded-full shadow-lg border-4 border-white dark:border-gray-800 transition-transform group-hover:scale-105"
                    style={{ background: color }}
                />
                <input
                    type="color"
                    value={color}
                    onChange={e => onChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>

            <div className="text-center">
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono tracking-tighter">
                    {color.toUpperCase()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">Haz click en el círculo <br /> para elegir color</p>
            </div>

            <div className="grid grid-cols-5 gap-2 mt-2">
                {['#6D28D9', '#059669', '#2563EB', '#DC2626', '#D97706'].map(preset => (
                    <button
                        key={preset}
                        onClick={() => onChange(preset)}
                        className={`w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 shadow-sm transition-transform hover:scale-125 ${color === preset ? 'ring-2 ring-purple-400' : ''}`}
                        style={{ background: preset }}
                    />
                ))}
            </div>
        </div>
    );
});

export default ColorPicker;
