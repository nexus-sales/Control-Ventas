import React from 'react';
import { X } from 'lucide-react';
import { glassStyles } from '../../utils/designUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { BorderBeam } from './BorderBeam';

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    headerExtra,
    children,
    icon: Icon,
    iconColor = "text-indigo-600",
    maxWidth = "max-w-2xl",
    showBorderBeam = true
}) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    {/* Backdrop con blur profundo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={cn(
                            glassStyles(),
                            "relative w-full shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden max-h-[95vh]",
                            maxWidth
                        )}
                    >
                        {showBorderBeam && <BorderBeam size={200} duration={12} colorFrom="#3b82f6" colorTo="#6366f1" />}

                        {/* Header */}
                        <div className="flex items-center justify-between p-8 border-b border-slate-200/50 dark:border-white/5 shrink-0 relative z-10">
                            <div className="flex items-center gap-5">
                                {Icon && (
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center shrink-0",
                                        iconColor.replace('text-', 'bg-').replace('-600', '-500/10'),
                                        iconColor
                                    )}>
                                        <Icon className="w-7 h-7 outline-none" />
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-widest uppercase mb-1">
                                        {title}
                                    </h2>
                                    {subtitle && (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[3px]">
                                            {subtitle}
                                        </p>
                                    )}
                                    {headerExtra && <div className="mt-2">{headerExtra}</div>}
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-95 border border-transparent hover:border-rose-500/20"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar relative z-10 no-scrollbar flex-1">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
