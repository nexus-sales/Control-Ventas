import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

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
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 dark:bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "relative w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[95vh]",
              maxWidth
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-4">
                {Icon && (
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    iconColor.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100'),
                    iconColor
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {subtitle}
                    </p>
                  )}
                  {headerExtra && <div className="mt-1">{headerExtra}</div>}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
