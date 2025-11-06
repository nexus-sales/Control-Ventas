import React, { useMemo } from 'react';
import { Package, DollarSign, TrendingUp, Star } from 'lucide-react';
import Card from '../ui/Card';

export function VentasStats({ ventasCalc, productos = [] }) {
  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    let totalPvp = 0;
    let countConPvp = 0;
    let comisionesTotal = 0;

    ventasCalc.forEach((v) => {
      const prod = productos.find((p) => p?.id === v.producto_id);
      const pvpValue = prod?.pvp || v.pvp || 0;
      
      if (pvpValue > 0) {
        totalPvp += pvpValue;
        countConPvp++;
      }
      
      if (v._calc?.ok) {
        comisionesTotal += v._calc.detalle.comBruta || 0;
      }
    });

    return {
      totalVentas: ventasCalc.length,
      volumenTotal: totalPvp,
      comisionesTotal,
      ticketMedio: countConPvp > 0 ? totalPvp / countConPvp : 0,
      ventasSinPvp: ventasCalc.length - countConPvp,
    };
  }, [ventasCalc, productos]);

  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-600 text-sm font-medium">Total Ventas</p>
            <p className="text-2xl font-bold text-blue-800">
              {estadisticas.totalVentas}
            </p>
            {estadisticas.ventasSinPvp > 0 && (
              <p className="text-xs text-blue-500 mt-1">
                {estadisticas.ventasSinPvp} sin PVP
              </p>
            )}
          </div>
          <Package className="w-8 h-8 text-blue-600" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-sm font-medium">Volumen</p>
            <p className="text-2xl font-bold text-green-800">
              {estadisticas.volumenTotal.toLocaleString()}€
            </p>
            <p className="text-xs text-green-500 mt-1">
              Solo con PVP definido
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-green-600" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-600 text-sm font-medium">Comisiones</p>
            <p className="text-2xl font-bold text-purple-800">
              {estadisticas.comisionesTotal.toFixed(0)}€
            </p>
          </div>
          <TrendingUp className="w-8 h-8 text-purple-600" />
        </div>
      </Card>

      <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-amber-600 text-sm font-medium">Ticket Medio</p>
            <p className="text-2xl font-bold text-amber-800">
              {estadisticas.ticketMedio.toFixed(0)}€
            </p>
          </div>
          <Star className="w-8 h-8 text-amber-600" />
        </div>
      </Card>
    </div>
  );
}
