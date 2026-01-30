import React, { Fragment } from 'react';
import { X } from 'lucide-react';
import { glassStyles } from '../../utils/designUtils';

export default function Modal({ isOpen, onClose, title, children, icon: Icon, iconColor = "text-indigo-600", maxWidth = "max-w-2xl" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop con blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
        relative w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col
        ${glassStyles} !bg-white/95 dark:!bg-slate-900/95 !border-white/20 shadow-2xl
        animate-in zoom-in-95 duration-300
      `}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200/50 dark:border-slate-700/50 shrink-0">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${iconColor.replace('text-', 'bg-').replace('-600', '-100')} ${iconColor}`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        )}
                        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                            {title}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
