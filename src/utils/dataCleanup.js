// Utilidades para limpiar y normalizar datos en localStorage
const LS_KEYS = {
	zonas: 'appcv_zonas',
	operadores: 'appcv_operadores',
	productos: 'appcv_productos',
	colaboradores: 'appcv_colaboradores',
	ventas: 'appcv_ventas',
	reglas: 'appcv_reglas',
	niveles: 'appcv_niveles',
};

function loadLS(key) {
	try {
		const raw = localStorage.getItem(key);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function saveLS(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

function normalizeText(text) {
	return String(text || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.trim()
		.replace(/\s+/g, " ");
}

// Limpia duplicados y normaliza zonas
export async function cleanZonasData() {
	let zonas = loadLS(LS_KEYS.zonas);
	const seen = new Set();
	const cleaned = [];
	for (const z of zonas) {
		const key = normalizeText(z.nombre);
		if (!seen.has(key)) {
			seen.add(key);
			cleaned.push({ ...z, nombre: z.nombre.trim() });
		}
	}
	saveLS(LS_KEYS.zonas, cleaned);
	return { ok: true, count: cleaned.length, message: 'Zonas limpiadas', zonas: cleaned };
}

// Limpia duplicados y normaliza operadores
export async function cleanOperadoresData() {
	let operadores = loadLS(LS_KEYS.operadores);
	const seen = new Set();
	const cleaned = [];
	for (const o of operadores) {
		const key = normalizeText(o.nombre);
		if (!seen.has(key)) {
			seen.add(key);
			cleaned.push({ ...o, nombre: o.nombre.trim() });
		}
	}
	saveLS(LS_KEYS.operadores, cleaned);
	return { ok: true, count: cleaned.length, message: 'Operadores limpiados', operadores: cleaned };
}

// Limpieza global: zonas, operadores, productos, colaboradores, ventas, reglas, niveles
export async function cleanAllData() {
	const results = {};
	results.zonas = await cleanZonasData();
	results.operadores = await cleanOperadoresData();
	// Productos
	let productos = loadLS(LS_KEYS.productos);
	productos = productos.filter((p, i, arr) =>
		arr.findIndex(x => normalizeText(x.nombre) === normalizeText(p.nombre)) === i
	).map(p => ({ ...p, nombre: p.nombre.trim() }));
	saveLS(LS_KEYS.productos, productos);
	results.productos = { ok: true, count: productos.length, message: 'Productos limpiados', productos };
	// Colaboradores
	let colaboradores = loadLS(LS_KEYS.colaboradores);
	colaboradores = colaboradores.filter((c, i, arr) =>
		arr.findIndex(x => normalizeText(x.nombre) === normalizeText(c.nombre)) === i
	).map(c => ({ ...c, nombre: c.nombre.trim() }));
	saveLS(LS_KEYS.colaboradores, colaboradores);
	results.colaboradores = { ok: true, count: colaboradores.length, message: 'Colaboradores limpiados', colaboradores };
	// Ventas
	let ventas = loadLS(LS_KEYS.ventas);
	ventas = ventas.filter((v, i, arr) =>
		arr.findIndex(x => x.id === v.id) === i
	);
	saveLS(LS_KEYS.ventas, ventas);
	results.ventas = { ok: true, count: ventas.length, message: 'Ventas limpiadas', ventas };
	// Reglas
	let reglas = loadLS(LS_KEYS.reglas);
	reglas = reglas.filter((r, i, arr) =>
		arr.findIndex(x => x.id === r.id) === i
	);
	saveLS(LS_KEYS.reglas, reglas);
	results.reglas = { ok: true, count: reglas.length, message: 'Reglas limpiadas', reglas };
	// Niveles
	let niveles = loadLS(LS_KEYS.niveles);
	niveles = niveles.filter((n, i, arr) =>
		arr.findIndex(x => x.id === n.id) === i
	);
	saveLS(LS_KEYS.niveles, niveles);
	results.niveles = { ok: true, count: niveles.length, message: 'Niveles limpiados', niveles };
	return { ok: true, message: 'Limpieza global completada', ...results };
}
