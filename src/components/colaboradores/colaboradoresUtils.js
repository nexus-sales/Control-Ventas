// Funciones utilitarias y helpers para colaboradores

export const normalizarTipoFiscal = (tipo = "") => {
    return tipo
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/\s+/g, "_");
};

export const calcularEstadoColaborador = (colaborador) => {
    if (!colaborador) return {};

    const tipoFiscal = normalizarTipoFiscal(colaborador.tipo_fiscal);
    const esEmpresa = tipoFiscal === "EMPRESA";
    const esAutonomoEspecial = tipoFiscal === "AUTONOMO_ESPECIAL";
    const esAutonomo = tipoFiscal === "AUTONOMO";

    let irpf = null;
    if (esAutonomo) {
        const fechaAlta = new Date(colaborador.fecha_alta);
        const ahora = new Date();
        // Aproximación de años transcurridos
        const añosTranscurridos = (ahora - fechaAlta) / (1000 * 60 * 60 * 24 * 365.25);
        irpf = añosTranscurridos < 2 ? 7 : 15;
    }

    const esta_activo = !colaborador.fecha_baja || new Date(colaborador.fecha_baja) > new Date();

    return {
        irpf_calculado: irpf,
        exento_impuestos: esEmpresa || esAutonomoEspecial,
        esta_activo,
        tipo_fiscal_normalizado: tipoFiscal
    };
};

export const procesarColaboradores = (colaboradores) => {
    if (!Array.isArray(colaboradores)) return [];

    return colaboradores.map((c) => {
        const estado = calcularEstadoColaborador(c);
        return {
            ...c,
            ...estado
        };
    });
};

export const filtrarColaboradores = (colaboradoresProcesados, { searchTerm, filtroEstado }) => {
    let filtered = colaboradoresProcesados;

    // Filtro por búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(c =>
            c.nombre?.toLowerCase().includes(term) ||
            c.cif_dni?.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term)
        );
    }

    // Filtro por estado
    if (filtroEstado === "ACTIVOS") {
        filtered = filtered.filter(c => c.esta_activo);
    } else if (filtroEstado === "INACTIVOS") {
        filtered = filtered.filter(c => !c.esta_activo);
    }

    return filtered;
};

export const getZonaNombre = (zonas, zona_id) => {
    if (!Array.isArray(zonas)) return "Sin asignar";
    return zonas.find((z) => z.id === zona_id)?.nombre || "Sin asignar";
};

export const getNivelInfo = (niveles, nivelId) => {
    if (!Array.isArray(niveles)) return null;
    return niveles.find((n) => n.id === nivelId) || null;
};
