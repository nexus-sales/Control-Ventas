import React, { useState, useEffect } from 'react';
import { DollarSign, Save, Info, Sparkles } from 'lucide-react';
import Modal from '../../ui/Modal';
import { Input, Label, Button } from '../../ui/FormElements';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';

export function PvpEditModal({
  isOpen,
  onClose,
  onSave,
  productoId,
  productoNombre,
  pvpInicial = 0
}) {
  const [pvp, setPvp] = useState(pvpInicial);

  useEffect(() => {
    if (isOpen) {
      setPvp(pvpInicial ?? 0);
    }
  }, [isOpen, pvpInicial]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const numericPvp = parseFloat(pvp) || 0;
    onSave(productoId, numericPvp);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configura PVP Maestro"
      icon={DollarSign}
      iconColor="text-amber-500"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Informativo Premium */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-5 rounded-[1.5rem] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 shadow-xl shadow-amber-500/5"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">Aviso de Aplicación</p>
            <p className="text-xs text-slate-600 dark:text-amber-200/60 font-medium leading-relaxed">
              Este valor impactará en <strong>todos los expedientes</strong> activos de este producto.
            </p>
          </div>
        </motion.div>

        <div className="space-y-6">
          <div className="p-6 rounded-[2rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 space-y-4">
            <div className="space-y-1">
              <Label className="text-blue-500">Producto Destino</Label>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-base font-black text-slate-800 dark:text-white tracking-tight">
                  {productoNombre}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-200 dark:bg-white/5 my-4" />

            <div className="space-y-3">
              <Label>Precio de Venta al Público (PVP) *</Label>
              <div className="relative group">
                <Input
                  id="pvp-input"
                  type="number"
                  step="0.01"
                  min="0"
                  icon={DollarSign}
                  className="text-2xl font-black py-4 h-auto shadow-2xl focus:ring-amber-500/30 border-none"
                  value={pvp}
                  onChange={(e) => setPvp(e.target.value)}
                  placeholder="0.00"
                  required
                  autoFocus
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                  <div className="h-8 w-px bg-slate-200 dark:bg-white/5 mx-2" />
                  <span className="text-xl font-black text-slate-400">€</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">
                Ej: Fibra 1GB = 45.00€ / Mes
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="px-6 rounded-2xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 shadow-amber-500/20"
            icon={Save}
          >
            Fijar Precio
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PvpEditModal;
