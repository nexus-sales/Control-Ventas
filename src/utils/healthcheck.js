/**
 * Sistema de healthcheck y métricas de la aplicación
 * Monitorea el estado de servicios externos y métricas de rendimiento
 */

import { useState, useEffect } from 'react';
import { isSupabaseConfigured } from '../config/env';
import { supabase } from '../lib/supabaseClient';
import { logger } from './errorHandler';

/**
 * Estados posibles del healthcheck
 */
export const HealthStatus = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
};

/**
 * Métricas de rendimiento
 */
class PerformanceMetrics {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      lastCheck: null,
    };
  }

  /**
   * Registra una petición
   */
  recordRequest(duration, success = true) {
    this.metrics.requests++;
    if (!success) this.metrics.errors++;
    
    // Calcular promedio de tiempo de respuesta
    const prevAvg = this.metrics.avgResponseTime;
    const prevCount = this.metrics.requests - 1;
    this.metrics.avgResponseTime = (prevAvg * prevCount + duration) / this.metrics.requests;
  }

  /**
   * Obtiene las métricas actuales
   */
  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.requests > 0 
        ? (this.metrics.errors / this.metrics.requests) * 100 
        : 0,
    };
  }

  /**
   * Resetea las métricas
   */
  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
      lastCheck: null,
    };
  }
}

export const metrics = new PerformanceMetrics();

/**
 * Verifica el estado de Supabase
 */
async function checkSupabaseHealth() {
  if (!isSupabaseConfigured()) {
    return {
      status: HealthStatus.DEGRADED,
      message: 'Supabase no configurado (modo local)',
      latency: 0,
    };
  }

  const startTime = performance.now();
  
  try {
    // Intentar una query simple
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const latency = performance.now() - startTime;

    if (error) {
      logger.warn('Supabase healthcheck failed', { error });
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'Error al conectar con Supabase',
        latency,
        error: error.message,
      };
    }

    return {
      status: HealthStatus.HEALTHY,
      message: 'Supabase operativo',
      latency,
    };
  } catch (error) {
    const latency = performance.now() - startTime;
    logger.error('Supabase healthcheck exception', error);
    
    return {
      status: HealthStatus.UNHEALTHY,
      message: 'Excepción al conectar con Supabase',
      latency,
      error: error.message,
    };
  }
}

/**
 * Verifica el estado de LocalStorage
 */
function checkLocalStorageHealth() {
  try {
    const testKey = '__healthcheck__';
    const testValue = 'test';
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'LocalStorage no funciona correctamente',
      };
    }

    // Verificar espacio disponible (aproximado)
    const used = new Blob(Object.values(localStorage)).size;
    const available = 5 * 1024 * 1024 - used; // ~5MB límite común
    
    return {
      status: HealthStatus.HEALTHY,
      message: 'LocalStorage operativo',
      used: Math.round(used / 1024) + ' KB',
      available: Math.round(available / 1024) + ' KB',
    };
  } catch (error) {
    return {
      status: HealthStatus.UNHEALTHY,
      message: 'LocalStorage no disponible',
      error: error.message,
    };
  }
}

/**
 * Verifica el estado general de la aplicación
 */
export async function healthcheck() {
  const startTime = performance.now();
  
  const [supabaseHealth, localStorageHealth] = await Promise.all([
    checkSupabaseHealth(),
    Promise.resolve(checkLocalStorageHealth()),
  ]);

  const totalLatency = performance.now() - startTime;

  // Determinar estado general
  let overallStatus = HealthStatus.HEALTHY;
  if (
    supabaseHealth.status === HealthStatus.UNHEALTHY ||
    localStorageHealth.status === HealthStatus.UNHEALTHY
  ) {
    overallStatus = HealthStatus.UNHEALTHY;
  } else if (
    supabaseHealth.status === HealthStatus.DEGRADED ||
    localStorageHealth.status === HealthStatus.DEGRADED
  ) {
    overallStatus = HealthStatus.DEGRADED;
  }

  const result = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    latency: Math.round(totalLatency),
    services: {
      supabase: supabaseHealth,
      localStorage: localStorageHealth,
    },
    metrics: metrics.getMetrics(),
    version: import.meta.env.VITE_APP_VERSION || 'unknown',
  };

  metrics.metrics.lastCheck = result.timestamp;
  
  logger.info('Healthcheck completed', { status: overallStatus });
  
  return result;
}

/**
 * Hook de React para monitorear el healthcheck
 */
export function useHealthcheck(intervalMs = 60000) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function check() {
      try {
        const result = await healthcheck();
        if (isMounted) {
          setHealth(result);
          setLoading(false);
        }
      } catch (error) {
        logger.error('Healthcheck failed', error);
        if (isMounted) {
          setHealth({
            status: HealthStatus.UNHEALTHY,
            error: error.message,
          });
          setLoading(false);
        }
      }
    }

    check();
    const interval = setInterval(check, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [intervalMs]);

  return { health, loading };
}

/**
 * Componente React para mostrar el estado de salud
 */
export function HealthIndicator() {
  const { health, loading } = useHealthcheck(60000);

  if (loading || !health) return null;

  const statusColors = {
    [HealthStatus.HEALTHY]: 'bg-green-500',
    [HealthStatus.DEGRADED]: 'bg-yellow-500',
    [HealthStatus.UNHEALTHY]: 'bg-red-500',
  };

  const statusLabels = {
    [HealthStatus.HEALTHY]: 'Operativo',
    [HealthStatus.DEGRADED]: 'Degradado',
    [HealthStatus.UNHEALTHY]: 'Fuera de servicio',
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${statusColors[health.status]}`} />
      <span className="text-gray-600">{statusLabels[health.status]}</span>
    </div>
  );
}
