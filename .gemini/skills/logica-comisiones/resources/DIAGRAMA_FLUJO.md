# Diagrama de Flujo - Cálculo de Comisiones

```
                    ┌──────────────────────────────────────────────────────────────┐
                    │                      ENTRADA: VENTA                          │
                    │  • pvp, fecha, zona_id, producto_id, colaborador_id          │
                    └─────────────────────────────┬────────────────────────────────┘
                                                  │
                                                  ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │            1. VALIDAR ENTIDADES RELACIONADAS                 │
                    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
                    │  │ Producto │  │ Operador │  │   Zona   │  │  Colab   │     │
                    │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
                    │       │             │             │             │            │
                    │       └─────────────┴──────┬──────┴─────────────┘            │
                    │                            │                                 │
                    │              ¿Todos válidos?                                 │
                    └────────────────────────────┬─────────────────────────────────┘
                                                 │
                        ┌───────────NO───────────┴───────────SI───────────┐
                        │                                                  │
                        ▼                                                  ▼
              ┌─────────────────────┐                    ┌─────────────────────────────┐
              │  RETURN ERROR       │                    │  2. CALCULAR BASE           │
              │  { ok: false }      │                    │  base = pvp ÷ (1 + IMP%)    │
              └─────────────────────┘                    │                             │
                                                         │  Península: ÷ 1.21 (IVA)   │
                                                         │  Canarias:  ÷ 1.07 (IGIC)  │
                                                         │  Ceuta/Mel: ÷ 1.00         │
                                                         └──────────────┬──────────────┘
                                                                        │
                                                                        ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │            3. COMISIÓN BASE DEL PRODUCTO                     │
                    │                                                              │
                    │   ┌─────────────────┬─────────────────┬─────────────────┐   │
                    │   │     FIJO        │   PORCENTAJE    │      MIXTO      │   │
                    │   │                 │                 │                 │   │
                    │   │  comBase =      │  comBase =      │  comBase =      │   │
                    │   │  comision_fija  │  (pct/100)*base │  fija+(pct*base)│   │
                    │   └─────────────────┴─────────────────┴─────────────────┘   │
                    └──────────────────────────────┬───────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │               4. EVALUAR REGLAS ADICIONALES                  │
                    │                                                              │
                    │   Filtrar reglas por: operador_id + producto_id + nivel     │
                    │   Ordenar por: prioridad (mayor primero)                     │
                    │                                                              │
                    │   extra = Σ (regla.tipo === '%'                             │
                    │            ? refBase × valor                                 │
                    │            : valor)                                          │
                    └──────────────────────────────┬───────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │            5. COMISIÓN BRUTA TOTAL                           │
                    │                                                              │
                    │              comBruta = max(0, comBase + extra)              │
                    │                                                              │
                    └──────────────────────────────┬───────────────────────────────┘
                                                   │
                                                   ▼
   ┌───────────────────────────────────────────────────────────────────────────────────────────┐
   │                          6. PARTE DEL COLABORADOR                                         │
   │                                                                                           │
   │   ┌──────────────────────────────────────────────────────────────────────────────────┐   │
   │   │                 JERARQUÍA DE PRIORIDAD (primera que aplique)                      │   │
   │   │                                                                                   │   │
   │   │   1. ¿Tiene comisión_personalizada?                                              │   │
   │   │      │                                                                            │   │
   │   │      ├── SI → tipo "fijo"      →  parteColab = comision_personalizada             │   │
   │   │      │                                                                            │   │
   │   │      └── SI → tipo "porcentaje" → parteColab = comBase × (personalizada/100)     │   │
   │   │                                                                                   │   │
   │   │   2. ¿El producto es de un sector específico?                                    │   │
   │   │      │                                                                            │   │
   │   │      ├── TELEFONÍA → usa pct_telefonia del colab o nivel                         │   │
   │   │      │                                                                            │   │
   │   │      ├── ENERGÍA   → usa pct_energia del colab o nivel                           │   │
   │   │      │                                                                            │   │
   │   │      └── SEGURIDAD → usa fijo_seguridad del nivel (siempre €)                    │   │
   │   │                                                                                   │   │
   │   │   3. ¿El nivel tiene comision_tipo definido?                                     │   │
   │   │      │                                                                            │   │
   │   │      ├── "fijo"      → parteColab = nivel.comision_valor                         │   │
   │   │      │                                                                            │   │
   │   │      └── "porcentaje" → parteColab = comBase × (valor/100)                       │   │
   │   │                                                                                   │   │
   │   │   4. FALLBACK → parteColab = comBase × 0.50 (50%)                                │   │
   │   │                                                                                   │   │
   │   └──────────────────────────────────────────────────────────────────────────────────┘   │
   └───────────────────────────────────────────────┬───────────────────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │                    7. CALCULAR IRPF                          │
                    │                                                              │
                    │   ¿tipo_fiscal === 'AUTONOMO'?                               │
                    │      │                                                       │
                    │      └── NO → irpf = 0                                       │
                    │                (Empresas, CIF, EXENTO, AUTONOMO_ESPECIAL)    │
                    │                                                              │
                    │      └── SI → ¿antigüedad >= 2 años?                         │
                    │               │                                              │
                    │               ├── SI → irpf_pct = 15%                        │
                    │               │                                              │
                    │               └── NO → irpf_pct = 7%                         │
                    │                                                              │
                    │   irpf = parteColab × irpf_pct                               │
                    └──────────────────────────────┬───────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │                8. CALCULAR RESULTADOS FINALES                │
                    │                                                              │
                    │   netoColab    = parteColab - irpf                           │
                    │   costeEmpresa = netoColab                                   │
                    │   margenEmpresa = comBruta - costeEmpresa                    │
                    │                                                              │
                    └──────────────────────────────┬───────────────────────────────┘
                                                   │
                                                   ▼
                    ┌──────────────────────────────────────────────────────────────┐
                    │                     RETURN RESULTADO                         │
                    │                                                              │
                    │   {                                                          │
                    │     ok: true,                                                │
                    │     detalle: {                                               │
                    │       base, comBase, extra, comBruta,                        │
                    │       parteColab, irpf_pct, irpf,                            │
                    │       netoColab, margenEmpresa, ...                          │
                    │     }                                                        │
                    │   }                                                          │
                    └──────────────────────────────────────────────────────────────┘
```

## Diagrama de Decomisiones

```
             ┌───────────────────────────────────────────────────────────────┐
             │                    VERIFICAR BAJA CLIENTE                     │
             │                                                               │
             │  ¿El cliente tiene fecha_baja?                                │
             │      │                                                        │
             │      └── NO → No hay decomisión                               │
             │                                                               │
             │      └── SI → Continuar...                                    │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │              CALCULAR PERÍODO DE COMPROMISO                   │
             │                                                               │
             │  fechaInicio = venta.fecha_inicio                             │
             │  fechaBaja = cliente.fecha_baja                               │
             │  mesesComprometidos = venta.periodo_compromiso (ej: 12)       │
             │                                                               │
             │  fechaFinCompromiso = fechaInicio + mesesComprometidos        │
             │                                                               │
             │  ¿fechaBaja < fechaFinCompromiso?                             │
             │      │                                                        │
             │      └── NO → No hay decomisión (cumplió compromiso)          │
             │                                                               │
             │      └── SI → HAY DECOMISIÓN                                  │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │                   OBTENER REGLAS DEL OPERADOR                 │
             │                                                               │
             │  reglas = operador.reglas_decomision || {                     │
             │    antes_6_meses: 100,    // 100% penalización                │
             │    despues_6_meses: 50,   // 50% proporcional                 │
             │    limite_meses: 6        // Umbral                           │
             │  }                                                            │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │                  CALCULAR MESES TRANSCURRIDOS                 │
             │                                                               │
             │  mesesTranscurridos = (fechaBaja - fechaInicio) / 30.44 días  │
             │                                                               │
             │  ¿mesesTranscurridos < limite_meses (6)?                      │
             │      │                                                        │
             │      ├── SI → porcentajeDecomision = antes_6_meses%           │
             │      │        (Ejemplo: 100% = toda la comisión)              │
             │      │                                                        │
             │      └── NO → Cálculo proporcional:                           │
             │               porcentajeCumplido = meses / comprometidos      │
             │               porcentajeDecomision =                          │
             │                 (100 - cumplido×100) × (despues_6_meses/100)  │
             └───────────────────────────────┬───────────────────────────────┘
                                             │
                                             ▼
             ┌───────────────────────────────────────────────────────────────┐
             │                    CALCULAR IMPORTE FINAL                     │
             │                                                               │
             │  comisionOriginal = venta._calc.detalle.comBruta              │
             │                                                               │
             │  importeDecomision = comisionOriginal × porcentajeDecomision  │
             │                                                               │
             │  → Este importe se descuenta de la liquidación del colaborador│
             └───────────────────────────────────────────────────────────────┘
```

## Ejemplo Visual

```
  VENTA: Fibra 600Mb Movistar - PVP 50€
  COLABORADOR: Senior, Autónomo, 3 años

  ┌─────────────────────────────────────────────────────────────────┐
  │                                                                 │
  │   PVP: 50€                                                      │
  │   ──────────────────────────────────────────────────            │
  │                        │                                        │
  │                        ▼                                        │
  │   Base (sin IVA):   41.32€  ←── 50 ÷ 1.21                      │
  │                                                                 │
  │   ══════════════════════════════════════════════════            │
  │                                                                 │
  │   Comisión Base:    40.00€  ←── Fijo del producto              │
  │   + Reglas extra:    0.00€                                      │
  │   ────────────────────────                                      │
  │   Comisión Bruta:   40.00€                                      │
  │                                                                 │
  │   ══════════════════════════════════════════════════            │
  │                                                                 │
  │   DISTRIBUCIÓN:                                                 │
  │                                                                 │
  │   ┌──────────────────────────┐  ┌──────────────────────────┐   │
  │   │     COLABORADOR          │  │      EMPRESA             │   │
  │   │                          │  │                          │   │
  │   │   Parte: 24.00€ (60%)    │  │   Margen: 19.60€         │   │
  │   │   - IRPF: -3.60€ (15%)   │  │                          │   │
  │   │   ─────────────────      │  │                          │   │
  │   │   NETO: 20.40€           │  │                          │   │
  │   │                          │  │                          │   │
  │   └──────────────────────────┘  └──────────────────────────┘   │
  │                                                                 │
  └─────────────────────────────────────────────────────────────────┘
```
