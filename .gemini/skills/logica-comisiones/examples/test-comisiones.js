// Casos de prueba para validar la lógica de comisiones
// Ejecutar con: node --experimental-vm-modules examples/test-comisiones.js

/**
 * CASO 1: Venta estándar de Telefonía en Península
 * Colaborador Senior (60%), Autónomo con 3 años de antigüedad
 */
export const caso1_telefonia_peninsula = {
    nombre: "Venta Telefonía - Península - Colaborador Senior",
    input: {
        venta: {
            id: "test-1",
            pvp: 50,
            zona_id: "zona-peninsula",
            producto_id: "prod-fibra-600",
            colaborador_id: "colab-senior-1",
            fecha: "2025-06-15",
        },
        producto: {
            id: "prod-fibra-600",
            nombre: "Fibra 600Mb",
            sector: "TELEFONIA",
            operador_id: "op-movistar",
            comision_tipo: "fijo",
            comision_fija: 40,
        },
        zona: {
            id: "zona-peninsula",
            nombre: "Península",
            impuesto_tipo: "IVA",
            impuesto_pct: 0.21,
        },
        colaborador: {
            id: "colab-senior-1",
            nombre: "Juan Pérez",
            nivel: "nivel-senior",
            tipo_fiscal: "AUTONOMO",
            fecha_alta: "2022-01-01",
        },
        nivel: {
            id: "nivel-senior",
            nombre: "Senior",
            pct_telefonia: 0.60,
            pct_colaborador_default: 0.60,
        },
    },
    expected: {
        ok: true,
        base: 41.32,        // 50 / 1.21
        comBase: 40,        // Fijo 40€
        comBruta: 40,       // Sin reglas extra
        parteColab: 24,     // 40 * 0.60
        irpf_pct: 0.15,     // >= 2 años
        irpf: 3.60,         // 24 * 0.15
        netoColab: 20.40,   // 24 - 3.60
        margenEmpresa: 19.60, // 40 - 20.40
    },
};

/**
 * CASO 2: Venta de Seguridad en Canarias
 * Colaborador Junior con comisión fija de seguridad
 */
export const caso2_seguridad_canarias = {
    nombre: "Venta Seguridad - Canarias - Colaborador Junior",
    input: {
        venta: {
            id: "test-2",
            pvp: 35,
            zona_id: "zona-canarias",
            producto_id: "prod-alarma-basica",
            colaborador_id: "colab-junior-1",
            fecha: "2025-08-20",
        },
        producto: {
            id: "prod-alarma-basica",
            nombre: "Alarma Hogar Básica",
            sector: "SEGURIDAD",
            operador_id: "op-securitas",
            comision_tipo: "fijo",
            comision_fija: 80,
        },
        zona: {
            id: "zona-canarias",
            nombre: "Canarias",
            impuesto_tipo: "IGIC",
            impuesto_pct: 0.07,
        },
        colaborador: {
            id: "colab-junior-1",
            nombre: "María López",
            nivel: "nivel-junior",
            tipo_fiscal: "AUTONOMO",
            fecha_alta: "2025-01-01",
        },
        nivel: {
            id: "nivel-junior",
            nombre: "Junior",
            fijo_seguridad: 25, // Comisión FIJA para seguridad
            pct_colaborador_default: 0.40,
        },
    },
    expected: {
        ok: true,
        base: 32.71,        // 35 / 1.07
        comBase: 80,        // Fijo 80€
        comBruta: 80,
        parteColab: 25,     // Fijo seguridad del nivel
        irpf_pct: 0.07,     // < 2 años
        irpf: 1.75,         // 25 * 0.07
        netoColab: 23.25,   // 25 - 1.75
        margenEmpresa: 56.75, // 80 - 23.25
    },
};

/**
 * CASO 3: Colaborador con comisión personalizada
 */
export const caso3_comision_personalizada = {
    nombre: "Venta con Comisión Personalizada",
    input: {
        venta: {
            id: "test-3",
            pvp: 60,
            zona_id: "zona-peninsula",
            producto_id: "prod-energia-luz",
            colaborador_id: "colab-custom-1",
            fecha: "2025-09-01",
        },
        producto: {
            id: "prod-energia-luz",
            nombre: "Tarifa Luz Verde",
            sector: "ENERGIA",
            operador_id: "op-endesa",
            comision_tipo: "porcentaje",
            comision_porcentaje: 15,
        },
        zona: {
            id: "zona-peninsula",
            nombre: "Península",
            impuesto_tipo: "IVA",
            impuesto_pct: 0.21,
        },
        colaborador: {
            id: "colab-custom-1",
            nombre: "Carlos Ruiz",
            nivel: "nivel-senior",
            tipo_fiscal: "EMPRESA",
            cif_dni: "B12345678", // CIF = Sin IRPF
            comision_personalizada: 30,
            comision_tipo_personalizada: "fijo",
        },
        nivel: {
            id: "nivel-senior",
            nombre: "Senior",
            pct_energia: 0.55,
        },
    },
    expected: {
        ok: true,
        base: 49.59,        // 60 / 1.21
        comBase: 7.44,      // 49.59 * 0.15
        comBruta: 7.44,
        parteColab: 30,     // Personalizada fija 30€
        irpf_pct: 0,        // Empresa = sin IRPF
        irpf: 0,
        netoColab: 30,
        margenEmpresa: -22.56, // Comisión personalizada alta
    },
};

/**
 * CASO 4: Aplicación de reglas adicionales
 */
export const caso4_con_reglas = {
    nombre: "Venta con Reglas Adicionales",
    input: {
        venta: {
            id: "test-4",
            pvp: 45,
            zona_id: "zona-peninsula",
            producto_id: "prod-fibra-300",
            colaborador_id: "colab-senior-1",
            fecha: "2025-10-15",
        },
        producto: {
            id: "prod-fibra-300",
            nombre: "Fibra 300Mb",
            sector: "TELEFONIA",
            operador_id: "op-movistar",
            comision_tipo: "fijo",
            comision_fija: 30,
        },
        reglas: [
            {
                id: "regla-1",
                operador_id: "op-movistar",
                producto_id: null, // Aplica a todos
                nivel: "nivel-senior",
                tipo: "%",
                valor: 0.10, // +10%
                pct_sobre: "ComisiónOperador",
                prioridad: 1,
            },
        ],
        // ... resto de datos igual al caso 1
    },
    expected: {
        comBase: 30,
        extra: 3,           // 30 * 0.10
        comBruta: 33,       // 30 + 3
    },
};

/**
 * CASO 5: Decomisión por baja de cliente
 */
export const caso5_decomision = {
    nombre: "Decomisión por Baja Anticipada",
    input: {
        venta: {
            id: "test-5",
            fecha_inicio: "2025-01-15",
            periodo_compromiso: 12,
            colaborador_id: "colab-senior-1",
            operador_id: "op-movistar",
            cliente_id: "cliente-1",
            _calc: {
                ok: true,
                detalle: {
                    comBruta: 100,
                },
            },
        },
        cliente: {
            id: "cliente-1",
            nombre: "Cliente Test",
            fecha_baja: "2025-04-20", // Baja a los 3 meses
        },
        operador: {
            id: "op-movistar",
            reglas_decomision: {
                antes_6_meses: 100,
                despues_6_meses: 50,
                limite_meses: 6,
            },
        },
    },
    expected: {
        mesesTranscurridos: 3.1,
        regla_aplicada: "antes_limite",
        porcentaje_decomision: 100,
        comision_original: 100,
        importe_decomision: 100, // 100% de 100€
    },
};

/**
 * Función de validación para ejecutar los casos
 */
export function validarCaso(caso, resultado) {
    console.log(`\n📋 ${caso.nombre}`);
    console.log("─".repeat(50));

    let errores = 0;

    for (const [key, valorEsperado] of Object.entries(caso.expected)) {
        const valorObtenido = resultado.ok
            ? (resultado.detalle?.[key] ?? resultado[key])
            : resultado[key];

        const match = typeof valorEsperado === "number"
            ? Math.abs(valorObtenido - valorEsperado) < 0.01
            : valorObtenido === valorEsperado;

        const icon = match ? "✅" : "❌";
        console.log(`${icon} ${key}: ${valorObtenido} (esperado: ${valorEsperado})`);

        if (!match) errores++;
    }

    return errores === 0;
}

// Exportar todos los casos
export const todosCasos = [
    caso1_telefonia_peninsula,
    caso2_seguridad_canarias,
    caso3_comision_personalizada,
    caso4_con_reglas,
    caso5_decomision,
];
