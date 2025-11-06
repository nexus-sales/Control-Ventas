import React, { useEffect, useMemo, useState } from "react";

/**
 * MVP v2 — App Control Ventas & Comisiones (tema pastel)
 * Novedades:
 * 1) Roles y bloqueo por estado (Borrador → Confirmada → Cerrada → Liquidada)
 * 2) Liquidaciones por período (mensual) con IRPF y neto por colaborador
 * 3) Importador Excel (CSV) con mapeo de columnas + validaciones
 *
 * Persistencia en localStorage (simulada)
 */

// ============================
// Helpers persistencia
// ============================
const LS_KEYS = {
  ventas: "appcv_ventas",
  colaboradores: "appcv_colaboradores",
  niveles: "appcv_niveles",
  operadores: "appcv_operadores",
  productos: "appcv_productos",
  zonas: "appcv_zonas",
  reglas: "appcv_reglas",
  liquidaciones: "appcv_liquidaciones",
  currentUser: "appcv_current_user",
};

function loadLS(key, fallback) {
  try { 
    const raw = localStorage.getItem(key); 
    return raw ? JSON.parse(raw) : fallback; 
  } catch { 
    return fallback; 
  }
}

function saveLS(key, value) { 
  localStorage.setItem(key, JSON.stringify(value)); 
}

// ============================
// Datos iniciales (seed)
// ============================
const seedNiveles = [
  { id: "MASTER", nombre: "MASTER", pct_colaborador_default: 0.65, descripcion: "Nivel alto" },
  { id: "PREMIUM", nombre: "PREMIUM", pct_colaborador_default: 0.6, descripcion: "Nivel intermedio" },
  { id: "PRO", nombre: "PRO", pct_colaborador_default: 0.55, descripcion: "Nivel profesional" },
  { id: "BASE", nombre: "BASE", pct_colaborador_default: 0.5, descripcion: "Nivel base" },
];

const seedColaboradores = [
  { id: "c1", nombre: "Ana Pérez", nivel: "PREMIUM", pct_colaborador: null, fecha_alta: "2023-07-01" },
  { id: "c2", nombre: "Luis Gómez", nivel: "MASTER", pct_colaborador: 0.62, fecha_alta: "2020-02-10" },
  { id: "c3", nombre: "María Ruiz", nivel: "BASE", pct_colaborador: null, fecha_alta: "2025-02-15" },
];

const seedOperadores = [
  { id: "op1", nombre: "Operador Telco A", sector: "telefonia" },
  { id: "op2", nombre: "Energía X", sector: "energia" },
  { id: "op3", nombre: "Segurma", sector: "seguridad" },
];

const seedProductos = [
  { id: "p1", operador_id: "op1", nombre: "Fibra 1Gb", familia: "Telco", pvp: 60, comision_base_pct: 0.1 },
  { id: "p2", operador_id: "op2", nombre: "Luz Pyme", familia: "Energía", pvp: 121, comision_base_pct: 0.12 },
  { id: "p3", operador_id: "op3", nombre: "Kit Alarma Hogar", familia: "Seguridad", pvp: 36.4, comision_base_pct: 0.08 },
];

const seedZonas = [
  { id: "peninsula", nombre: "Península", impuesto_tipo: "IVA", impuesto_pct: 0.21 },
  { id: "canarias", nombre: "Canarias", impuesto_tipo: "IGIC", impuesto_pct: 0.07 },
];

// Reglas simplificadas
const seedReglas = [
  { id: "r1", operador_id: "op1", producto_id: null, nivel: "PREMIUM", tipo: "%", pct_sobre: "Base", valor: 0.05, prioridad: 10 },
  { id: "r2", operador_id: "op1", producto_id: null, nivel: "MASTER", tipo: "%", pct_sobre: "Base", valor: 0.07, prioridad: 10 },
  { id: "r3", operador_id: "op2", producto_id: "p2", nivel: "BASE", tipo: "fijo", pct_sobre: "Base", valor: 5, prioridad: 5 },
];

const seedUser = { id: "u1", nombre: "Gerencia", rol: "admin", colaborador_id: null };

// ============================
// Lógica de negocio
// ============================
function yearsBetween(aISO, bISO) { 
  const a = new Date(aISO); 
  const b = new Date(bISO); 
  return (b - a) / (1000*60*60*24*365.25); 
}

function getIrpfPctByAntiguedad(colab, refDateISO) { 
  return yearsBetween(colab.fecha_alta, refDateISO) >= 2 ? 0.15 : 0.07; 
}

function findNivelPct(colab, niveles) { 
  if (typeof colab.pct_colaborador === 'number') return colab.pct_colaborador; 
  return (niveles.find(n=>n.id===colab.nivel)?.pct_colaborador_default) ?? 0.5; 
}

function baseFromPVP(pvp, impuesto_pct){ 
  return pvp / (1 + (impuesto_pct||0)); 
}

function evaluateRules({ reglas, operador_id, producto_id, nivel, refBase, refComOper }) {
  return reglas
    .filter(r=> r.operador_id===operador_id && (r.producto_id==null || r.producto_id===producto_id) && r.nivel===nivel)
    .sort((a,b)=>(b.prioridad||0)-(a.prioridad||0))
    .reduce((acc,r)=> acc + (r.tipo==='%'
      ? (r.pct_sobre==='ComisiónOperador'? refComOper: refBase) * r.valor
      : r.valor
    ),0);
}

function computeVenta({ venta, productos, operadores, zonas, colaboradores, niveles, reglas }){
  const producto = productos.find(p=>p.id===venta.producto_id);
  const operador = producto && operadores.find(o=>o.id===producto.operador_id);
  const zona = zonas.find(z=>z.id===venta.zona_id);
  const colab = colaboradores.find(c=>c.id===venta.colaborador_id);
  if(!producto || !operador || !zona || !colab) return { ok:false, error: 'Datos incompletos' };
  const impuesto_pct = zona.impuesto_pct;
  const base = baseFromPVP(venta.pvp, impuesto_pct);
  const comOper = base * (producto.comision_base_pct||0);
  const extra = evaluateRules({ reglas, operador_id: operador.id, producto_id: producto.id, nivel: colab.nivel, refBase: base, refComOper: comOper });
  const comBruta = Math.max(0, comOper + extra);
  const pctColab = findNivelPct(colab, niveles);
  const parteColab = comBruta * pctColab;
  const irpf_pct = getIrpfPctByAntiguedad(colab, venta.fecha);
  const irpf = parteColab * irpf_pct;
  const netoColab = parteColab - irpf;
  const costeEmpresa = netoColab;
  const margenEmpresa = comBruta - costeEmpresa;
  return { ok:true, detalle: { zona, operador, producto, colaborador: colab, impuesto_pct, base, comOper, extra, comBruta, pctColab, parteColab, irpf_pct, irpf, netoColab, costeEmpresa, margenEmpresa } };
}

// ============================
// UI util
// ============================
const Card = ({ children }) => <div className="rounded-2xl shadow-sm border border-slate-200 bg-white p-4">{children}</div>;
const SectionTitle = ({ children }) => <h2 className="text-xl font-semibold text-slate-700 mb-2">{children}</h2>;
const Pill = ({ children }) => <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">{children}</span>;

// ============================
// App principal
// ============================
export default function AppCVv2(){
  const [niveles, setNiveles] = useState(()=>loadLS(LS_KEYS.niveles, seedNiveles));
  const [colaboradores, setColaboradores] = useState(()=>loadLS(LS_KEYS.colaboradores, seedColaboradores));
  const [operadores, setOperadores] = useState(()=>loadLS(LS_KEYS.operadores, seedOperadores));
  const [productos, setProductos] = useState(()=>loadLS(LS_KEYS.productos, seedProductos));
  const [zonas, setZonas] = useState(()=>loadLS(LS_KEYS.zonas, seedZonas));
  const [reglas, setReglas] = useState(()=>loadLS(LS_KEYS.reglas, seedReglas));
  const [ventas, setVentas] = useState(()=>loadLS(LS_KEYS.ventas, []));
  const [liquidaciones, setLiquidaciones] = useState(()=>loadLS(LS_KEYS.liquidaciones, []));
  const [currentUser, setCurrentUser] = useState(()=>loadLS(LS_KEYS.currentUser, seedUser));

  useEffect(()=>saveLS(LS_KEYS.niveles, niveles), [niveles]);
  useEffect(()=>saveLS(LS_KEYS.colaboradores, colaboradores), [colaboradores]);
  useEffect(()=>saveLS(LS_KEYS.operadores, operadores), [operadores]);
  useEffect(()=>saveLS(LS_KEYS.productos, productos), [productos]);
  useEffect(()=>saveLS(LS_KEYS.zonas, zonas), [zonas]);
  useEffect(()=>saveLS(LS_KEYS.reglas, reglas), [reglas]);
  useEffect(()=>saveLS(LS_KEYS.ventas, ventas), [ventas]);
  useEffect(()=>saveLS(LS_KEYS.liquidaciones, liquidaciones), [liquidaciones]);
  useEffect(()=>saveLS(LS_KEYS.currentUser, currentUser), [currentUser]);

  const [tab, setTab] = useState("dashboard");
  const [flt, setFlt] = useState({ texto:"", operador_id:"", colaborador_id:"", zona_id:"", desde:"", hasta:"" });

  const ventasCalc = useMemo(()=> ventas.map(v=> ({...v, _calc: computeVenta({ venta:v, productos, operadores, zonas, colaboradores, niveles, reglas })})), [ventas, productos, operadores, zonas, colaboradores, niveles, reglas]);

  const ventasFiltradas = useMemo(()=> ventasCalc.filter(v=>{
    const okOper = flt.operador_id ? productos.find(p=>p.id===v.producto_id)?.operador_id===flt.operador_id : true;
    const okColab = flt.colaborador_id ? v.colaborador_id===flt.colaborador_id : true;
    const okZona = flt.zona_id ? v.zona_id===flt.zona_id : true;
    const okTexto = flt.texto ? (v.cliente||"").toLowerCase().includes(flt.texto.toLowerCase()) || (v.cif||"").toLowerCase().includes(flt.texto.toLowerCase()) : true;
    const f = v.fecha?.slice(0,10); const okDesde = flt.desde ? f>=flt.desde : true; const okHasta = flt.hasta ? f<=flt.hasta : true;
    return okOper && okColab && okZona && okTexto && okDesde && okHasta;
  }), [ventasCalc, flt, productos]);

  const kpis = useMemo(()=>{
    let comBruta=0, comPagada=0, margen=0;
    ventasFiltradas.forEach(v=>{ if(v._calc.ok){ comBruta+=v._calc.detalle.comBruta; comPagada+=v._calc.detalle.netoColab; margen+=v._calc.detalle.margenEmpresa; }});
    return { comBruta, comPagada, margen, ventas: ventasFiltradas.length };
  }, [ventasFiltradas]);

  const isAdmin = currentUser.rol === 'admin';

  const tabs = [
    ["dashboard", "Dashboard"],
    ["ventas", "Ventas"],
    ["import", "Importar Excel"],
    ["liqs", "Liquidaciones"],
    ["reglas", "Reglas"],
    ["colabs", "Colaboradores"],
    ["config", "Config"],
  ].filter(([id])=> isAdmin || !["reglas","config"].includes(id));

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-emerald-50 text-slate-800">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-200" />
          <h1 className="text-lg font-semibold">App Control Ventas & Comisiones — MVP v2</h1>
          <nav className="ml-auto flex gap-2">
            {tabs.map(([id,label])=> (
              <button key={id} onClick={()=>setTab(id)} className={`px-3 py-1.5 rounded-xl text-sm border ${tab===id? 'bg-sky-500 text-white border-sky-500':'bg-white border-slate-200 hover:bg-slate-50'}`}>{label}</button>
            ))}
          </nav>
          <div className="ml-4 flex items-center gap-2">
            <Pill>{currentUser.nombre} — {currentUser.rol}</Pill>
            <select className="border rounded-xl px-2 py-1 text-sm" value={currentUser.rol} onChange={e=> setCurrentUser(u=>({...u, rol: e.target.value}))}>
              <option value="admin">admin</option>
              <option value="comercial">comercial</option>
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid gap-6">
        {tab==="dashboard" && <Dashboard kpis={kpis} ventas={ventasFiltradas} />}
        {tab==="ventas" && (
          <Ventas
            ventas={ventasFiltradas}
            setVentas={setVentas}
            productos={productos}
            operadores={operadores}
            zonas={zonas}
            colaboradores={colaboradores}
            niveles={niveles}
            reglas={reglas}
            filtros={flt}
            setFiltros={setFlt}
            isAdmin={isAdmin}
          />
        )}
        {tab==="import" && (
          <ImportExcelMapper setVentas={setVentas} zonas={zonas} />
        )}
        {tab==="liqs" && (
          <LiquidacionesPage ventas={ventasCalc} colaboradores={colaboradores} setLiquidaciones={setLiquidaciones} liquidaciones={liquidaciones} />
        )}
        {tab==="reglas" && isAdmin && <Reglas reglas={reglas} setReglas={setReglas} operadores={operadores} productos={productos} />}
        {tab==="colabs" && <Colaboradores colaboradores={colaboradores} setColaboradores={setColaboradores} niveles={niveles} setNiveles={setNiveles} />}
        {tab==="config" && isAdmin && <Config zonas={zonas} setZonas={setZonas} operadores={operadores} setOperadores={setOperadores} productos={productos} setProductos={setProductos} />}
      </main>
    </div>
  );
}

// ============================
// Dashboard
// ============================
function Dashboard({ kpis, ventas }){
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><SectionTitle>Comisión Bruta</SectionTitle><div className="text-3xl font-bold">{kpis.comBruta.toFixed(2)} €</div><Pill>Total</Pill></Card>
        <Card><SectionTitle>Comisión Pagada</SectionTitle><div className="text-3xl font-bold">{kpis.comPagada.toFixed(2)} €</div><Pill>A colaboradores</Pill></Card>
        <Card><SectionTitle>Margen Empresa</SectionTitle><div className="text-3xl font-bold">{kpis.margen.toFixed(2)} €</div><Pill>Bruta - Pagada</Pill></Card>
        <Card><SectionTitle>Nº Ventas</SectionTitle><div className="text-3xl font-bold">{kpis.ventas}</div><Pill>Filtradas</Pill></Card>
      </div>
      <Card>
        <SectionTitle>Últimas Ventas</SectionTitle>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th className="py-2">Fecha</th><th>Cliente</th><th>Producto</th><th>Estado</th><th>Bruta</th><th>Neto</th><th>Margen</th></tr></thead>
            <tbody>
              {ventas.slice(0,10).map(v=> (
                <tr key={v.id} className="border-t">
                  <td className="py-2">{v.fecha}</td>
                  <td>{v.cliente}</td>
                  <td>{v.producto_id}</td>
                  <td><Pill>{v.estado||'Borrador'}</Pill></td>
                  <td>{v._calc.ok? v._calc.detalle.comBruta.toFixed(2): '-'}</td>
                  <td>{v._calc.ok? v._calc.detalle.netoColab.toFixed(2): '-'}</td>
                  <td>{v._calc.ok? v._calc.detalle.margenEmpresa.toFixed(2): '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

// ============================
// Ventas + estados y bloqueo
// ============================
function Ventas({ ventas, setVentas, productos, operadores, zonas, colaboradores, niveles, reglas, filtros, setFiltros, isAdmin }){
  const [draft, setDraft] = useState({ fecha: new Date().toISOString().slice(0,10), cliente:"", cif:"", producto_id: productos[0]?.id||"", pvp: 121, zona_id: zonas[0]?.id||"peninsula", colaborador_id: colaboradores[0]?.id||"", estado: 'Borrador' });

  const calc = draft.producto_id && draft.colaborador_id && draft.zona_id ? computeVenta({ venta:draft, productos, operadores, zonas, colaboradores, niveles, reglas }) : { ok:false };

  const blocked = (v)=> ['Cerrada','Liquidada'].includes(v.estado);

  const addVenta = ()=>{
    const id = `v_${Date.now()}`;
    setVentas(arr=> [{ id, ...draft }, ...arr]);
    setDraft(d=> ({ ...d, cliente:"", cif:"", estado:'Borrador' }));
  };

  const removeVenta = (id)=> setVentas(arr=> arr.filter(x=> x.id!==id));

  const setEstado = (id, estado)=> setVentas(arr=> arr.map(x=> x.id===id ? { ...x, estado } : x));

  return (
    <div className="grid gap-6">
      <Card>
        <SectionTitle>Filtros</SectionTitle>
        <div className="grid md:grid-cols-7 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="Buscar cliente/CIF" value={filtros.texto} onChange={e=> setFiltros({ ...filtros, texto: e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={filtros.operador_id} onChange={e=> setFiltros({ ...filtros, operador_id: e.target.value })}>
            <option value="">Operador (todos)</option>
            {operadores.map(o=> <option key={o.id} value={o.id}>{o.nombre}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" value={filtros.colaborador_id} onChange={e=> setFiltros({ ...filtros, colaborador_id: e.target.value })}>
            <option value="">Colaborador (todos)</option>
            {colaboradores.map(c=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" value={filtros.zona_id} onChange={e=> setFiltros({ ...filtros, zona_id: e.target.value })}>
            <option value="">Zona (todas)</option>
            {zonas.map(z=> <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
          <input type="date" className="border rounded-xl px-3 py-2" value={filtros.desde} onChange={e=> setFiltros({ ...filtros, desde: e.target.value })} />
          <input type="date" className="border rounded-xl px-3 py-2" value={filtros.hasta} onChange={e=> setFiltros({ ...filtros, hasta: e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={filtros.estado||""} onChange={e=> setFiltros({ ...filtros, estado: e.target.value })}>
            <option value="">Estado (todos)</option>
            {['Borrador','Confirmada','Cerrada','Liquidada'].map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <Card>
        <SectionTitle>Nueva Venta</SectionTitle>
        <div className="grid md:grid-cols-7 gap-2">
          <input className="border rounded-xl px-3 py-2" type="date" value={draft.fecha} onChange={e=> setDraft({ ...draft, fecha: e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Cliente" value={draft.cliente} onChange={e=> setDraft({ ...draft, cliente: e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="CIF" value={draft.cif} onChange={e=> setDraft({ ...draft, cif: e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={draft.producto_id} onChange={e=> setDraft({ ...draft, producto_id: e.target.value })}>
            {productos.map(p=> <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" value={draft.zona_id} onChange={e=> setDraft({ ...draft, zona_id: e.target.value })}>
            {zonas.map(z=> <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" value={draft.colaborador_id} onChange={e=> setDraft({ ...draft, colaborador_id: e.target.value })}>
            {colaboradores.map(c=> <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" placeholder="PVP" value={draft.pvp} onChange={e=> setDraft({ ...draft, pvp: parseFloat(e.target.value||"0") })} />
          <div className="md:col-span-7 flex items-center gap-2">
            <Pill>Estado: {draft.estado}</Pill>
            <button onClick={addVenta} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Guardar</button>
          </div>
        </div>

        <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <Card>
            <div className="font-medium mb-1">Desglose</div>
            {calc.ok ? (
              <ul className="space-y-1">
                <li>Base: <b>{calc.detalle.base.toFixed(2)} €</b></li>
                <li>Com. Operador: <b>{calc.detalle.comOper.toFixed(2)} €</b></li>
                <li>Extra Reglas: <b>{calc.detalle.extra.toFixed(2)} €</b></li>
                <li>Com. Bruta: <b>{calc.detalle.comBruta.toFixed(2)} €</b></li>
              </ul>
            ) : <div className="text-slate-500">Completa los campos…</div>}
          </Card>
          <Card>
            <div className="font-medium mb-1">Colaborador</div>
            {calc.ok ? (
              <ul className="space-y-1">
                <li>Nivel: <b>{calc.detalle.colaborador.nivel}</b></li>
                <li>% Colaborador: <b>{(calc.detalle.pctColab*100).toFixed(0)}%</b></li>
                <li>Parte Colab: <b>{calc.detalle.parteColab.toFixed(2)} €</b></li>
              </ul>
            ) : <div className="text-slate-500">—</div>}
          </Card>
          <Card>
            <div className="font-medium mb-1">IRPF / Neto</div>
            {calc.ok ? (
              <ul className="space-y-1">
                <li>IRPF %: <b>{(calc.detalle.irpf_pct*100).toFixed(0)}%</b></li>
                <li>IRPF: <b>{calc.detalle.irpf.toFixed(2)} €</b></li>
                <li>Neto Colab: <b>{calc.detalle.netoColab.toFixed(2)} €</b></li>
                <li>Margen Empresa: <b>{calc.detalle.margenEmpresa.toFixed(2)} €</b></li>
              </ul>
            ) : <div className="text-slate-500">—</div>}
          </Card>
        </div>
      </Card>

      <Card>
        <SectionTitle>Listado</SectionTitle>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500"><th className="py-2">Fecha</th><th>Cliente</th><th>Producto</th><th>Zona</th><th>Colaborador</th><th>PVP</th><th>Bruta</th><th>Neto</th><th>Margen</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {ventas
                .filter(v=> filtros.estado? v.estado===filtros.estado : true)
                .map(v=> (
                <tr key={v.id} className="border-t">
                  <td className="py-2">{v.fecha}</td>
                  <td>{v.cliente}</td>
                  <td>{v.producto_id}</td>
                  <td>{v.zona_id}</td>
                  <td>{v.colaborador_id}</td>
                  <td>{Number(v.pvp).toFixed(2)}</td>
                  <td>{v._calc.ok? v._calc.detalle.comBruta.toFixed(2): '-'}</td>
                  <td>{v._calc.ok? v._calc.detalle.netoColab.toFixed(2): '-'}</td>
                  <td>{v._calc.ok? v._calc.detalle.margenEmpresa.toFixed(2): '-'}</td>
                  <td><Pill>{v.estado}</Pill></td>
                  <td className="whitespace-nowrap flex gap-1 py-2">
                    <button disabled={blocked(v)} onClick={()=> setEstado(v.id,'Confirmada')} className={`px-2 py-1 rounded-lg ${blocked(v)?'bg-slate-100 text-slate-400':'bg-amber-100 text-amber-700'}`}>Confirmar</button>
                    <button disabled={blocked(v)} onClick={()=> setEstado(v.id,'Cerrada')} className={`px-2 py-1 rounded-lg ${blocked(v)?'bg-slate-100 text-slate-400':'bg-indigo-100 text-indigo-700'}`}>Cerrar</button>
                    <button onClick={()=> setEstado(v.id,'Liquidada')} className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Liquidar</button>
                    {isAdmin && <button disabled={['Cerrada','Liquidada'].includes(v.estado)} onClick={()=> removeVenta(v.id)} className={`px-2 py-1 rounded-lg ${['Cerrada','Liquidada'].includes(v.estado)?'bg-slate-100 text-slate-400':'bg-rose-100 text-rose-700'}`}>Eliminar</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================
// Importador Excel (CSV) con mapeo
// ============================
function ImportExcelMapper({ setVentas }){
  const [raw, setRaw] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapa, setMapa] = useState({ fecha:"fecha", cliente:"cliente", cif:"cif", producto_id:"producto_id", zona_id:"zona_id", colaborador_id:"colaborador_id", pvp:"pvp", estado:"estado" });
  const camposInternos = ["fecha","cliente","cif","producto_id","zona_id","colaborador_id","pvp","estado"];

  const parseCSV = (text)=>{
    const lines = text.split(/\r?\n/).filter(Boolean);
    if(lines.length<2) return { headers:[], rows:[] };
    const hdr = lines[0].split(',').map(h=>h.trim());
    const rows = lines.slice(1).map(l=>{
      const cols = l.split(',');
      const obj = {}; hdr.forEach((h,i)=> obj[h]= (cols[i]||'').trim());
      return obj;
    });
    return { headers: hdr, rows };
  };

  const onLoad = (txt)=>{
    const { headers, rows } = parseCSV(txt);
    setHeaders(headers); setRows(rows); setRaw(txt);
    const guess = { ...mapa };
    headers.forEach(h=>{
      const H = h.toLowerCase();
      if(H.includes('cliente')) guess.cliente = h;
      if(['fecha','date'].some(k=>H.includes(k))) guess.fecha = h;
      if(['cif','nif','vat'].some(k=>H.includes(k))) guess.cif = h;
      if(H.includes('producto')) guess.producto_id = h;
      if(['zona','region'].some(k=>H.includes(k))) guess.zona_id = h;
      if(['colab','comercial','agent'].some(k=>H.includes(k))) guess.colaborador_id = h;
      if(['pvp','importe','precio'].some(k=>H.includes(k))) guess.pvp = h;
      if(['estado','status'].some(k=>H.includes(k))) guess.estado = h;
    });
    setMapa(guess);
  };

  const validarFila = (r)=>{
    const errs = [];
    if(!r[mapa.fecha]) errs.push('fecha');
    if(!r[mapa.cliente]) errs.push('cliente');
    if(!r[mapa.producto_id]) errs.push('producto_id');
    if(!r[mapa.zona_id]) errs.push('zona_id');
    if(!r[mapa.colaborador_id]) errs.push('colaborador_id');
    if(!r[mapa.pvp] || isNaN(parseFloat(r[mapa.pvp]))) errs.push('pvp');
    return errs;
  };

  const importar = ()=>{
    const nuevos = [];
    let rechazadas = 0;
    rows.forEach(r=>{
      const errs = validarFila(r);
      if(errs.length){ rechazadas++; return; }
      const v = {
        id: `v_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
        fecha: r[mapa.fecha], cliente: r[mapa.cliente], cif: r[mapa.cif]||'',
        producto_id: r[mapa.producto_id], zona_id: r[mapa.zona_id], colaborador_id: r[mapa.colaborador_id],
        pvp: parseFloat(r[mapa.pvp]), estado: r[mapa.estado]||'Confirmada'
      };
      nuevos.push(v);
    });
    setVentas(arr=> [...nuevos, ...arr]);
    alert(`Importadas ${nuevos.length} — Rechazadas ${rechazadas}`);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <SectionTitle>Cargar CSV</SectionTitle>
        <input type="file" accept=".csv" onChange={e=> e.target.files?.[0]?.text().then(onLoad)} />
        <textarea className="mt-3 w-full h-40 border rounded-xl p-2" placeholder="O pega tu CSV..." value={raw} onChange={e=> onLoad(e.target.value)} />
      </Card>
      {headers.length>0 && (
        <Card>
          <SectionTitle>Mapeo de columnas</SectionTitle>
          <div className="grid md:grid-cols-4 gap-2">
            {camposInternos.map(ci=> (
              <div key={ci} className="flex items-center gap-2">
                <label className="w-40 text-sm">{ci}</label>
                <select className="border rounded-xl px-2 py-1 text-sm w-full" value={mapa[ci]||""} onChange={e=> setMapa({ ...mapa, [ci]: e.target.value })}>
                  <option value="">—</option>
                  {headers.map(h=> <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>
      )}
      {rows.length>0 && (
        <Card>
          <SectionTitle>Previsualización (primeras 20)</SectionTitle>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr>{headers.map(h=> <th key={h} className="text-left text-slate-500 py-1 pr-4">{h}</th>)}</tr></thead>
              <tbody>
                {rows.slice(0,20).map((r,i)=>{
                  const errs = validarFila(r);
                  return (
                    <tr key={i} className={errs.length? 'bg-rose-50' : ''}>
                      {headers.map(h=> <td key={h} className="py-1 pr-4">{r[h]}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={importar} className="px-3 py-2 rounded-xl bg-sky-500 text-white">Importar</button>
          </div>
        </Card>
      )}
    </div>
  );
}

// ============================
// Liquidaciones por período
// ============================
function monthOf(dateISO){ return dateISO?.slice(0,7); } // YYYY-MM
function sum(arr,sel){ return arr.reduce((a,x)=> a+(sel(x)||0),0); }

function LiquidacionesPage({ ventas, colaboradores, liquidaciones, setLiquidaciones }){
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0,7)); // YYYY-MM
  const ventasPeriodo = useMemo(()=> ventas.filter(v=> (v.estado==='Cerrada' || v.estado==='Liquidada') && monthOf(v.fecha)===periodo), [ventas, periodo]);

  const porColab = useMemo(()=>{
    const map = new Map();
    ventasPeriodo.forEach(v=>{
      const k = v.colaborador_id; if(!map.has(k)) map.set(k, []); map.get(k).push(v);
    });
    return Array.from(map.entries()).map(([colabId, lista])=>{
      const colab = colaboradores.find(c=>c.id===colabId);
      const bruto = sum(lista, x=> x._calc.ok? x._calc.detalle.comBruta:0);
      const irpf = sum(lista, x=> x._calc.ok? x._calc.detalle.irpf:0);
      const neto = sum(lista, x=> x._calc.ok? x._calc.detalle.netoColab:0);
      return { colab, ventas: lista, bruto, irpf, neto };
    });
  }, [ventasPeriodo, colaboradores]);

  const yaExiste = (colabId)=> liquidaciones.some(l=> l.periodo===periodo && l.colaborador_id===colabId);

  const generar = ()=>{
    const nuevas = porColab.map(r=> ({ id: `liq_${periodo}_${r.colab.id}`, periodo, colaborador_id: r.colab.id, bruto: r.bruto, irpf: r.irpf, neto: r.neto, estado:'Generada' }));
    const filtradas = nuevas.filter(n=> !yaExiste(n.colaborador_id));
    if(!filtradas.length){ alert('No hay nuevas liquidaciones para generar.'); return; }
    setLiquidaciones(arr=> [...filtradas, ...arr]);
  };

  const setEstado = (id, estado)=> setLiquidaciones(arr=> arr.map(l=> l.id===id? { ...l, estado } : l));

  return (
    <div className="grid gap-4">
      <Card>
        <SectionTitle>Generar Liquidaciones</SectionTitle>
        <div className="flex items-center gap-3">
          <input type="month" className="border rounded-xl px-3 py-2" value={periodo} onChange={e=> setPeriodo(e.target.value)} />
          <button onClick={generar} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Generar</button>
        </div>
      </Card>

      <Card>
        <SectionTitle>Resumen por colaborador ({periodo})</SectionTitle>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th>Colaborador</th><th>Ventas</th><th>Bruto</th><th>IRPF</th><th>Neto</th></tr></thead>
            <tbody>
              {porColab.map(r=> (
                <tr key={r.colab.id} className="border-t">
                  <td className="py-2">{r.colab.nombre}</td>
                  <td>{r.ventas.length}</td>
                  <td>{r.bruto.toFixed(2)} €</td>
                  <td>{r.irpf.toFixed(2)} €</td>
                  <td>{r.neto.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Liquidaciones</SectionTitle>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th>Periodo</th><th>Colaborador</th><th>Bruto</th><th>IRPF</th><th>Neto</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {liquidaciones.sort((a,b)=> (b.periodo.localeCompare(a.periodo))).map(l=> {
                const colab = colaboradores.find(c=>c.id===l.colaborador_id);
                return (
                  <tr key={l.id} className="border-t">
                    <td className="py-2">{l.periodo}</td>
                    <td>{colab?.nombre||l.colaborador_id}</td>
                    <td>{l.bruto.toFixed(2)} €</td>
                    <td>{l.irpf.toFixed(2)} €</td>
                    <td>{l.neto.toFixed(2)} €</td>
                    <td><Pill>{l.estado}</Pill></td>
                    <td className="flex gap-2">
                      <button onClick={()=> setEstado(l.id,'Aprobada')} className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700">Aprobar</button>
                      <button onClick={()=> setEstado(l.id,'Pagada')} className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">Pagar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================
// Reglas
// ============================
function Reglas({ reglas, setReglas, operadores, productos }){
  const [draft, setDraft] = useState({ operador_id: operadores[0]?.id||"", producto_id:"", nivel:"BASE", tipo:"%", pct_sobre:"Base", valor:0.05, prioridad:10 });
  const add=()=> setReglas(arr=> [{ id:`r_${Date.now()}`, ...draft, valor:Number(draft.valor) }, ...arr]);
  const remove=(id)=> setReglas(arr=> arr.filter(x=> x.id!==id));
  return (
    <div className="grid gap-4">
      <Card>
        <SectionTitle>Nueva Regla</SectionTitle>
        <div className="grid md:grid-cols-8 gap-2">
          <select className="border rounded-xl px-3 py-2" value={draft.operador_id} onChange={e=> setDraft({ ...draft, operador_id:e.target.value })}>{operadores.map(o=> <option key={o.id} value={o.id}>{o.nombre}</option>)}</select>
          <select className="border rounded-xl px-3 py-2" value={draft.producto_id} onChange={e=> setDraft({ ...draft, producto_id:e.target.value })}>
            <option value="">(Todos productos del operador)</option>
            {productos.map(p=> <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select className="border rounded-xl px-3 py-2" value={draft.nivel} onChange={e=> setDraft({ ...draft, nivel:e.target.value })}>{["MASTER","PREMIUM","PRO","BASE"].map(n=> <option key={n} value={n}>{n}</option>)}</select>
          <select className="border rounded-xl px-3 py-2" value={draft.tipo} onChange={e=> setDraft({ ...draft, tipo:e.target.value })}><option value="%">%</option><option value="fijo">Fijo</option></select>
          <select className="border rounded-xl px-3 py-2" value={draft.pct_sobre} onChange={e=> setDraft({ ...draft, pct_sobre:e.target.value })}><option value="Base">Base</option><option value="ComisiónOperador">ComisiónOperador</option></select>
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" value={draft.valor} onChange={e=> setDraft({ ...draft, valor:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" type="number" step="1" value={draft.prioridad} onChange={e=> setDraft({ ...draft, prioridad:Number(e.target.value||0) })} />
          <button onClick={add} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Añadir</button>
        </div>
      </Card>
      <Card>
        <SectionTitle>Reglas existentes</SectionTitle>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th>Operador</th><th>Producto</th><th>Nivel</th><th>Tipo</th><th>Sobre</th><th>Valor</th><th>Prioridad</th><th></th></tr></thead>
            <tbody>
              {reglas.map(r=> (
                <tr key={r.id} className="border-t">
                  <td>{r.operador_id}</td><td>{r.producto_id||"*"}</td><td>{r.nivel}</td><td>{r.tipo}</td><td>{r.pct_sobre}</td>
                  <td>{r.tipo==='%'? (r.valor*100).toFixed(2)+"%": r.valor.toFixed(2)+" €"}</td>
                  <td>{r.prioridad}</td>
                  <td><button onClick={()=> remove(r.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700">Eliminar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ============================
// Colaboradores y niveles
// ============================
function Colaboradores({ colaboradores, setColaboradores, niveles, setNiveles }){
  const [cDraft, setCDraft] = useState({ nombre:"", nivel:"BASE", pct_colaborador:"", fecha_alta: new Date().toISOString().slice(0,10) });
  const [nDraft, setNDraft] = useState({ id:"NUEVO", nombre:"NUEVO", pct_colaborador_default:0.5, descripcion:"" });
  const addColab=()=>{ setColaboradores(arr=> [{ id:`c_${Date.now()}`, nombre:cDraft.nombre, nivel:cDraft.nivel, pct_colaborador: cDraft.pct_colaborador===""? null: Number(cDraft.pct_colaborador), fecha_alta:cDraft.fecha_alta }, ...arr]); setCDraft({ nombre:"", nivel:"BASE", pct_colaborador:"", fecha_alta: new Date().toISOString().slice(0,10) }); };
  const removeColab=(id)=> setColaboradores(arr=> arr.filter(x=> x.id!==id));
  const addNivel=()=>{ setNiveles(arr=> [{ id:nDraft.id, nombre:nDraft.nombre, pct_colaborador_default:Number(nDraft.pct_colaborador_default||0), descripcion:nDraft.descripcion }, ...arr]); setNDraft({ id:"NUEVO", nombre:"NUEVO", pct_colaborador_default:0.5, descripcion:"" }); };
  const removeNivel=(id)=> setNiveles(arr=> arr.filter(x=> x.id!==id));
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <SectionTitle>Nuevo Colaborador</SectionTitle>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded-xl px-3 py-2 md:col-span-2" placeholder="Nombre" value={cDraft.nombre} onChange={e=> setCDraft({ ...cDraft, nombre:e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={cDraft.nivel} onChange={e=> setCDraft({ ...cDraft, nivel:e.target.value })}>{niveles.map(n=> <option key={n.id} value={n.id}>{n.nombre}</option>)}</select>
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" placeholder="% personalizado (0-1)" value={cDraft.pct_colaborador} onChange={e=> setCDraft({ ...cDraft, pct_colaborador:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" type="date" value={cDraft.fecha_alta} onChange={e=> setCDraft({ ...cDraft, fecha_alta:e.target.value })} />
          <button onClick={addColab} className="px-3 py-2 rounded-xl bg-emerald-500 text-white md:col-span-2">Añadir</button>
        </div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>Nombre</th><th>Nivel</th><th>%</th><th>Alta</th><th></th></tr></thead><tbody>
            {colaboradores.map(c=> (
              <tr key={c.id} className="border-t"><td className="py-2">{c.nombre}</td><td>{c.nivel}</td><td>{typeof c.pct_colaborador==='number'? (c.pct_colaborador*100).toFixed(0)+"%":"(nivel)"}</td><td>{c.fecha_alta}</td><td><button onClick={()=> removeColab(c.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700">Eliminar</button></td></tr>
            ))}
          </tbody></table>
        </div>
      </Card>
      <Card>
        <SectionTitle>Niveles</SectionTitle>
        <div className="grid md:grid-cols-5 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="ID" value={nDraft.id} onChange={e=> setNDraft({ ...nDraft, id:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={nDraft.nombre} onChange={e=> setNDraft({ ...nDraft, nombre:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" placeholder="% por defecto (0-1)" value={nDraft.pct_colaborador_default} onChange={e=> setNDraft({ ...nDraft, pct_colaborador_default:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Descripción" value={nDraft.descripcion} onChange={e=> setNDraft({ ...nDraft, descripcion:e.target.value })} />
          <button onClick={addNivel} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Añadir</button>
        </div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>ID</th><th>Nombre</th><th>% por defecto</th><th>Descripción</th><th></th></tr></thead><tbody>
            {niveles.map(n=> (
              <tr key={n.id} className="border-t">
                <td className="py-2">{n.id}</td>
                <td>{n.nombre}</td>
                <td>{(n.pct_colaborador_default*100).toFixed(0)+"%"}</td>
                <td>{n.descripcion}</td>
                <td>
                  <button onClick={()=> removeNivel(n.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </Card>
    </div>
  );
}

// ============================
// Config (zonas, operadores, productos)
// ============================
function Config({ zonas, setZonas, operadores, setOperadores, productos, setProductos }){
  const [zDraft, setZDraft] = useState({ id:"", nombre:"", impuesto_tipo:"IVA", impuesto_pct:0.21 });
  const [oDraft, setODraft] = useState({ id:"", nombre:"", sector:"" });
  const [pDraft, setPDraft] = useState({ id:"", operador_id:operadores[0]?.id||"", nombre:"", familia:"", pvp:0, comision_base_pct:0.1 });

  const addZona=()=>{ setZonas(arr=> [{ id:zDraft.id, nombre:zDraft.nombre, impuesto_tipo:zDraft.impuesto_tipo, impuesto_pct:Number(zDraft.impuesto_pct) }, ...arr]); setZDraft({ id:"", nombre:"", impuesto_tipo:"IVA", impuesto_pct:0.21 }); };
  const removeZona=(id)=> setZonas(arr=> arr.filter(x=> x.id!==id));

  const addOperador=()=>{ setOperadores(arr=> [{ id:oDraft.id, nombre:oDraft.nombre, sector:oDraft.sector }, ...arr]); setODraft({ id:"", nombre:"", sector:"" }); };
  const removeOperador=(id)=> setOperadores(arr=> arr.filter(x=> x.id!==id));

  const addProducto=()=>{ setProductos(arr=> [{ id:pDraft.id, operador_id:pDraft.operador_id, nombre:pDraft.nombre, familia:pDraft.familia, pvp:Number(pDraft.pvp), comision_base_pct:Number(pDraft.comision_base_pct) }, ...arr]); setPDraft({ id:"", operador_id:operadores[0]?.id||"", nombre:"", familia:"", pvp:0, comision_base_pct:0.1 }); };
  const removeProducto=(id)=> setProductos(arr=> arr.filter(x=> x.id!==id));

  return (
    <div className="grid gap-6">
      <Card>
        <SectionTitle>Zonas</SectionTitle>
        <div className="grid md:grid-cols-5 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="ID" value={zDraft.id} onChange={e=> setZDraft({ ...zDraft, id:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={zDraft.nombre} onChange={e=> setZDraft({ ...zDraft, nombre:e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={zDraft.impuesto_tipo} onChange={e=> setZDraft({ ...zDraft, impuesto_tipo:e.target.value })}><option value="IVA">IVA</option><option value="IGIC">IGIC</option></select>
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" placeholder="% impuesto" value={zDraft.impuesto_pct} onChange={e=> setZDraft({ ...zDraft, impuesto_pct:e.target.value })} />
          <button onClick={addZona} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Añadir</button>
        </div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>ID</th><th>Nombre</th><th>Tipo</th><th>%</th><th></th></tr></thead><tbody>
            {zonas.map(z=> (
              <tr key={z.id} className="border-t"><td className="py-2">{z.id}</td><td>{z.nombre}</td><td>{z.impuesto_tipo}</td><td>{(z.impuesto_pct*100).toFixed(0)}%</td><td><button onClick={()=> removeZona(z.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700">Eliminar</button></td></tr>
            ))}
          </tbody></table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Operadores</SectionTitle>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="ID" value={oDraft.id} onChange={e=> setODraft({ ...oDraft, id:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={oDraft.nombre} onChange={e=> setODraft({ ...oDraft, nombre:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" placeholder="Sector" value={oDraft.sector} onChange={e=> setODraft({ ...oDraft, sector:e.target.value })} />
          <button onClick={addOperador} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Añadir</button>
        </div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>ID</th><th>Nombre</th><th>Sector</th><th></th></tr></thead><tbody>
            {operadores.map(o=> (
              <tr key={o.id} className="border-t"><td className="py-2">{o.id}</td><td>{o.nombre}</td><td>{o.sector}</td><td><button onClick={()=> removeOperador(o.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700">Eliminar</button></td></tr>
            ))}
          </tbody></table>
        </div>
      </Card>

      <Card>
        <SectionTitle>Productos</SectionTitle>
        <div className="grid md:grid-cols-7 gap-2">
          <input className="border rounded-xl px-3 py-2" placeholder="ID" value={pDraft.id} onChange={e=> setPDraft({ ...pDraft, id:e.target.value })} />
          <select className="border rounded-xl px-3 py-2" value={pDraft.operador_id} onChange={e=> setPDraft({ ...pDraft, operador_id:e.target.value })}>{operadores.map(o=> <option key={o.id} value={o.id}>{o.nombre}</option>)}</select>
          <input className="border rounded-xl px-3 py-2" placeholder="Nombre" value={pDraft.nombre} onChange={e=> setPDraft({ ...pDraft, nombre:e.target.value })} />
         // Continuación de la función Config que se cortó:

          <input className="border rounded-xl px-3 py-2" placeholder="Familia" value={pDraft.familia} onChange={e=> setPDraft({ ...pDraft, familia:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" placeholder="PVP" value={pDraft.pvp} onChange={e=> setPDraft({ ...pDraft, pvp:e.target.value })} />
          <input className="border rounded-xl px-3 py-2" type="number" step="0.01" placeholder="% comisión base" value={pDraft.comision_base_pct} onChange={e=> setPDraft({ ...pDraft, comision_base_pct:e.target.value })} />
          <button onClick={addProducto} className="px-3 py-2 rounded-xl bg-emerald-500 text-white">Añadir</button>
        </div>
        <div className="mt-3 overflow-auto">
          <table className="w-full text-sm"><thead><tr className="text-left text-slate-500"><th>ID</th><th>Operador</th><th>Nombre</th><th>Familia</th><th>PVP</th><th>% Com.</th><th></th></tr></thead><tbody>
            {productos.map(p=> {
              const op = operadores.find(o=>o.id===p.operador_id);
              return (
                <tr key={p.id} className="border-t">
                  <td className="py-2">{p.id}</td>
                  <td>{op?.nombre||p.operador_id}</td>
                  <td>{p.nombre}</td>
                  <td>{p.familia}</td>
                  <td>{p.pvp.toFixed(2)} €</td>
                  <td>{(p.comision_base_pct*100).toFixed(1)}%</td>
                  <td><button onClick={()=> removeProducto(p.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700">Eliminar</button></td>
                </tr>
              );
            })}
          </tbody></table>
        </div>
      </Card>
    </div>
  );
}