/* =========================================================
   GENERADOR AUTOMÁTICO DE NIVELES · PlopDoku
   ---------------------------------------------------------
   GitHub Actions lo ejecuta los días 1 y 15 de cada mes.
   En cada ejecución:
   1. Agrega una ZONA NORMAL nueva (20 niveles).
   2. Si en las próximas dos semanas hay una fecha especial
      (Halloween, Navidad, Independencia…), agrega además
      una ZONA ESPECIAL temática (10 niveles).
   3. Guarda todo en niveles.json, que la app descarga.
   Cada nivel tiene una sola solución y se resuelve solo con
   lógica (mismas reglas que la pista del juego).

   Uso manual:  node generar.js
   Pruebas:     FECHA=2026-10-15 CANTIDAD=3 node generar.js
   ========================================================= */
const fs = require("fs");
const ARCHIVO = "niveles.json";

/* ---------- Configuración (lo único que quizá quieras tocar) ---------- */
const NIVELES_ZONA_NORMAL = +(process.env.CANTIDAD || 20);
const NIVELES_ZONA_ESPECIAL = +(process.env.CANTIDAD || 10);
const TAMANOS_NORMALES = [10, 11, 12];               // se van alternando zona por zona
const TAMANOS_ESPECIALES = [8, 8, 9, 9, 9, 10, 10, 10, 11, 11];  // eventos: más relajados
const LIMITE_MS_POR_ZONA = 25 * 60 * 1000;           // tope de seguridad

const ZONAS_NORMALES = [
  { nombre: "Baño del hospital",       emoji: "🏥", deco: ["🩺", "💊", "🧴", "🧻"] },
  { nombre: "Baño del cine",           emoji: "🎬", deco: ["🍿", "🎟️", "🥤", "🧻"] },
  { nombre: "Baño de la feria",        emoji: "🎡", deco: ["🎠", "🍭", "🎈", "🧻"] },
  { nombre: "Baño del lago",           emoji: "🛶", deco: ["🐟", "🌋", "🦆", "🫧"] },
  { nombre: "Baño del tren",           emoji: "🚂", deco: ["🛤️", "🧳", "🎫", "🧻"] },
  { nombre: "Baño de la playa",        emoji: "🏖️", deco: ["🐚", "🦀", "🩴", "🌊"] },
  { nombre: "Baño del museo",          emoji: "🏛️", deco: ["🖼️", "🗿", "🏺", "🧻"] },
  { nombre: "Baño del crucero",        emoji: "🛳️", deco: ["⚓", "🐬", "🛟", "🌊"] },
  { nombre: "Baño de la selva",        emoji: "🌿", deco: ["🦜", "🐒", "🌺", "🐸"] },
  { nombre: "Baño del castillo",       emoji: "🏰", deco: ["🗡️", "🛡️", "🕯️", "🐉"] },
  { nombre: "Baño de la montaña",      emoji: "🏔️", deco: ["🧗", "🌲", "❄️", "🦅"] },
  { nombre: "Baño del submarino",      emoji: "🤿", deco: ["🐙", "🐠", "🫧", "🦑"] },
  { nombre: "Baño del circo",          emoji: "🎪", deco: ["🤡", "🎩", "🐘", "🎺"] },
  { nombre: "Baño de la granja",       emoji: "🐄", deco: ["🐔", "🐖", "🌽", "🚜"] },
  { nombre: "Baño del laboratorio",    emoji: "🧪", deco: ["🔬", "⚗️", "🧬", "🧯"] },
  { nombre: "Baño de la estación espacial", emoji: "🚀", deco: ["🪐", "👽", "🛰️", "🌌"] }
];
const COLORES = ["var(--r1)", "var(--r7)", "var(--r9)", "var(--r11)", "var(--r10)", "var(--r8)", "var(--r3)", "var(--r6)"];

/* Fechas especiales. "fecha" recibe el año y devuelve [mes, día]. */
const EVENTOS = [
  { id: "anio-nuevo",     nombre: "Baño de Año Nuevo",     emoji: "🎆", color: "var(--r11)", deco: ["🎉", "🥂", "🕛", "✨"], fecha: a => [1, 1] },
  { id: "san-valentin",   nombre: "Baño del amor",         emoji: "💘", color: "var(--r1)",  deco: ["💌", "🌹", "💝", "🍫"], fecha: a => [2, 14] },
  { id: "semana-santa",   nombre: "Baño de Semana Santa",  emoji: "🌴", color: "var(--r5)",  deco: ["🕯️", "🌸", "🥖", "🐟"], fecha: a => domingoPascua(a) },
  { id: "dia-tierra",     nombre: "Baño ecológico",        emoji: "🌎", color: "var(--r4)",  deco: ["🌱", "♻️", "💧", "🌳"], fecha: a => [4, 22] },
  { id: "independencia",  nombre: "Baño patrio",           emoji: "🇬🇹", color: "var(--r3)",  deco: ["🪅", "🎺", "🥁", "🕊️"], fecha: a => [9, 15] },
  { id: "dia-nino",       nombre: "Baño de juguetes",      emoji: "🧸", color: "var(--r10)", deco: ["🪀", "🎈", "🧩", "🪁"], fecha: a => [10, 1] },
  { id: "halloween",      nombre: "Baño embrujado",        emoji: "🎃", color: "var(--r6)",  deco: ["👻", "🦇", "🕸️", "🕯️"], fecha: a => [10, 31] },
  { id: "barriletes",     nombre: "Baño de los barriletes", emoji: "🪁", color: "var(--r7)", deco: ["🪁", "🌼", "🍬", "☁️"], fecha: a => [11, 1] },
  { id: "navidad",        nombre: "Baño navideño",         emoji: "🎄", color: "var(--r4)",  deco: ["🎁", "⛄", "🔔", "🫔"], fecha: a => [12, 25] }
];

/* Domingo de Pascua (algoritmo de Meeus/Jones/Butcher) */
function domingoPascua(Y) {
  const a = Y % 19, b = Math.floor(Y / 100), c = Y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return [mes, dia - 7];   // la zona celebra desde Domingo de Ramos
}

/* =========================================================
   MOTOR DE GENERACIÓN
   ========================================================= */
let N = 8;
const ri = n => Math.floor(Math.random() * n);
const barajar = a => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function soluciones(reg, limite) {
  const out = [], pos = new Int8Array(N), off = ri(N);
  (function bt(f, cols, regs, prev) {
    if (out.length >= limite) return;
    if (f === N) { out.push(Array.from(pos)); return; }
    const fila = reg[f];
    for (let k = 0; k < N; k++) {
      const c = (k + off + f) % N;
      if (cols & (1 << c)) continue;
      const r = fila[c];
      if (regs & (1 << r)) continue;
      if (f > 0 && Math.abs(c - prev) <= 1) continue;
      pos[f] = c;
      bt(f + 1, cols | (1 << c), regs | (1 << r), c);
      if (out.length >= limite) return;
    }
  })(0, 0, 0, -9);
  return out;
}

function tamanoRegion(reg, k) {
  const cel = [];
  for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (reg[f][c] === k) cel.push([f, c]);
  if (!cel.length) return 0;
  const vis = new Set([cel[0].join()]), pila = [cel[0]];
  while (pila.length) {
    const [f, c] = pila.pop();
    for (const [df, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = f + df, b = c + dc;
      if (a >= 0 && a < N && b >= 0 && b < N && reg[a][b] === k && !vis.has(a + "," + b)) { vis.add(a + "," + b); pila.push([a, b]); }
    }
  }
  return vis.size === cel.length ? cel.length : -1;   // -1 = región partida
}

/* Solver lógico: devuelve dificultad, o null si hace falta adivinar */
function resolverConLogica(reg) {
  const cand = Array.from({ length: N }, () => Array(N).fill(true));
  const puesto = Array(N).fill(-1);
  const ve = (f, c, pf, pc) => f === pf || c === pc || reg[f][c] === reg[pf][pc] || (Math.abs(f - pf) <= 1 && Math.abs(c - pc) <= 1);
  let nivelMax = 0, pasos = 0, avanzados = 0;
  const poner = (f, c) => { puesto[f] = c; for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (ve(a, b, f, c)) cand[a][b] = false; };
  const comb = (arr, k, i = 0, act = [], o = []) => { if (act.length === k) { o.push(act.slice()); return o; } for (let j = i; j < arr.length; j++) { act.push(arr[j]); comb(arr, k, j + 1, act, o); act.pop(); } return o; };
  const marcar = (lista, nv) => { let x = 0; for (const [f, c] of lista) if (cand[f][c]) { cand[f][c] = false; x++; } if (x) { nivelMax = Math.max(nivelMax, nv); pasos++; if (nv >= 3) avanzados++; } return x > 0; };
  for (let it = 0; it < 600; it++) {
    if (puesto.every(x => x >= 0)) return nivelMax * 100 + pasos + avanzados * 10;
    const U = [];
    for (let r = 0; r < N; r++) { const cel = []; let abierta = true; for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (reg[f][c] === r) { cel.push([f, c]); if (puesto[f] === c) abierta = false; } if (abierta) U.push({ t: "r", id: r, cel }); }
    for (let f = 0; f < N; f++) if (puesto[f] < 0) U.push({ t: "f", id: f, cel: [...Array(N).keys()].map(c => [f, c]) });
    for (let c = 0; c < N; c++) if (!puesto.includes(c)) U.push({ t: "c", id: c, cel: [...Array(N).keys()].map(f => [f, c]) });
    U.forEach(u => { u.cand = u.cel.filter(([f, c]) => cand[f][c]); });
    if (U.some(u => !u.cand.length)) return null;
    const unico = U.find(u => u.cand.length === 1);
    if (unico) { poner(...unico.cand[0]); nivelMax = Math.max(nivelMax, 1); pasos++; continue; }
    let hecho = false;
    for (const u of U) {
      if (u.t === "r") {
        const fs = [...new Set(u.cand.map(p => p[0]))], cs = [...new Set(u.cand.map(p => p[1]))];
        if (fs.length === 1 && marcar([...Array(N).keys()].map(c => [fs[0], c]).filter(([f, c]) => reg[f][c] !== u.id), 2)) { hecho = true; break; }
        if (cs.length === 1 && marcar([...Array(N).keys()].map(f => [f, cs[0]]).filter(([f, c]) => reg[f][c] !== u.id), 2)) { hecho = true; break; }
      } else {
        const rs = [...new Set(u.cand.map(([f, c]) => reg[f][c]))];
        if (rs.length === 1) { const l = []; for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (reg[f][c] === rs[0] && !(u.t === "f" ? f === u.id : c === u.id)) l.push([f, c]); if (marcar(l, 2)) { hecho = true; break; } }
      }
    }
    if (hecho) continue;
    for (const u of U) {
      const enU = new Set(u.cel.map(p => p.join())), l = [];
      for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (cand[f][c] && !enU.has(f + "," + c) && u.cand.every(([a, b]) => ve(a, b, f, c))) l.push([f, c]);
      if (marcar(l, 3)) { hecho = true; break; }
    }
    if (hecho) continue;
    const R = U.filter(u => u.t === "r"), F = U.filter(u => u.t === "f"), C = U.filter(u => u.t === "c");
    fuera: for (const k of [2, 3]) for (const idx of [0, 1]) {
      for (const g of comb(R, k)) { const ls = [...new Set(g.flatMap(u => u.cand.map(p => p[idx])))]; if (ls.length !== k) continue;
        const ids = new Set(g.map(u => u.id)), l = []; for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (ls.includes(idx === 0 ? f : c) && !ids.has(reg[f][c])) l.push([f, c]);
        if (marcar(l, 3 + k)) { hecho = true; break fuera; } }
      for (const g of comb(idx === 0 ? F : C, k)) { const rs = [...new Set(g.flatMap(u => u.cand.map(([f, c]) => reg[f][c])))]; if (rs.length !== k) continue;
        const ids = new Set(g.map(u => u.id)), l = []; for (let f = 0; f < N; f++) for (let c = 0; c < N; c++) if (rs.includes(reg[f][c]) && !ids.has(idx === 0 ? f : c)) l.push([f, c]);
        if (marcar(l, 3 + k)) { hecho = true; break fuera; } }
    }
    if (!hecho) return null;
  }
  return null;
}

function generarTablero() {
  let sol;
  do { sol = barajar([...Array(N).keys()]); } while (!sol.every((c, i) => i === 0 || Math.abs(c - sol[i - 1]) > 1));
  const enSol = new Set(sol.map((c, f) => f + "," + c));
  const reg = Array.from({ length: N }, () => Array(N).fill(-1));
  sol.forEach((c, f) => { reg[f][c] = f; });
  let libres = N * N - N;
  while (libres) {
    const f = ri(N), c = ri(N);
    if (reg[f][c] < 0) continue;
    const vec = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [f + a, c + b]).filter(([a, b]) => a >= 0 && a < N && b >= 0 && b < N && reg[a][b] < 0);
    if (vec.length) { const [a, b] = vec[ri(vec.length)]; reg[a][b] = reg[f][c]; libres--; }
  }
  // Rompe soluciones alternativas moviendo casillas entre regiones
  for (let paso = 0; paso < 4000; paso++) {
    const alt = soluciones(reg, 2).filter(x => x.join() !== sol.join());
    if (!alt.length) return reg;
    const cands = barajar(alt[0].map((c, f) => [f, c]).filter(([f, c]) => !enSol.has(f + "," + c)));
    let movido = false;
    for (const [f, c] of cands) {
      const ks = barajar([...new Set([[1, 0], [-1, 0], [0, 1], [0, -1]].map(([x, y]) => [f + x, c + y])
        .filter(([x, y]) => x >= 0 && x < N && y >= 0 && y < N && reg[x][y] !== reg[f][c]).map(([x, y]) => reg[x][y]))]);
      for (const k of ks) { const ant = reg[f][c]; reg[f][c] = k; if (tamanoRegion(reg, ant) >= 2) { movido = true; break; } reg[f][c] = ant; }
      if (movido) break;
    }
    if (!movido) return null;
  }
  return null;
}

/* Genera un nivel válido de tamaño n */
function generarNivel(n, limite) {
  N = n;
  while (Date.now() < limite) {
    const reg = generarTablero();
    if (!reg || soluciones(reg, 2).length !== 1) continue;
    if ([...Array(N).keys()].some(k => tamanoRegion(reg, k) < 2)) continue;
    const dif = resolverConLogica(reg);
    if (dif === null) continue;
    return { filas: reg.map(f => f.map(v => String.fromCharCode(97 + v)).join("")).join("/"), dif, n };
  }
  return null;
}

function generarZona(tamanos, prefijo) {
  const limite = Date.now() + LIMITE_MS_POR_ZONA;
  const vistos = new Set(todosLosNiveles());
  const lista = [];
  for (const n of tamanos) {
    let nivel;
    do { nivel = generarNivel(n, limite); } while (nivel && vistos.has(nivel.filas));
    if (!nivel) break;
    vistos.add(nivel.filas);
    lista.push(nivel);
    console.log(`  ${prefijo}: nivel ${lista.length}/${tamanos.length} (${n}×${n})`);
  }
  // De menor a mayor tamaño y, dentro de cada tamaño, de más fácil a más difícil
  lista.sort((a, b) => a.n - b.n || a.dif - b.dif);
  return lista.map((l, i) => ({ id: prefijo + "-" + String(i + 1).padStart(2, "0"), filas: l.filas }));
}

/* =========================================================
   CALENDARIO Y ARCHIVO
   ========================================================= */
let datos = { version: 0, actualizado: null, proxima: null, zonas: [] };
if (fs.existsSync(ARCHIVO)) datos = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
function todosLosNiveles() { return datos.zonas.flatMap(z => z.niveles.map(l => l.filas)); }

const hoy = process.env.FECHA ? new Date(process.env.FECHA + "T12:00:00Z") : new Date();
const iso = d => d.toISOString().slice(0, 10);
const masDias = (d, n) => new Date(d.getTime() + n * 86400000);

/* Próxima ejecución: el siguiente día 1 o 15 */
function siguienteCorrida(d) {
  const a = d.getUTCFullYear(), m = d.getUTCMonth(), dia = d.getUTCDate();
  return dia < 15 ? new Date(Date.UTC(a, m, 15)) : new Date(Date.UTC(a, m + 1, 1));
}
const proxima = siguienteCorrida(hoy);

const nuevas = [];

// Zonas especiales: eventos entre hoy y la próxima corrida (inclusive)
for (const ev of EVENTOS) {
  for (const anio of [hoy.getUTCFullYear(), hoy.getUTCFullYear() + 1]) {
    const [mes, dia] = ev.fecha(anio);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia, 12));
    const clave = ev.id + "-" + anio;
    if (fecha >= masDias(hoy, -1) && fecha <= masDias(proxima, 1) && !datos.zonas.some(z => z.evento === clave)) {
      console.log("Zona especial:", ev.nombre, anio);
      const niveles = generarZona(TAMANOS_ESPECIALES.slice(0, NIVELES_ZONA_ESPECIAL), clave);
      if (niveles.length >= Math.min(5, NIVELES_ZONA_ESPECIAL)) {
        nuevas.push({ id: clave, evento: clave, especial: true, nombre: ev.nombre + " " + anio, emoji: ev.emoji,
          color: ev.color, deco: ev.deco, fecha: iso(fecha), niveles });
      }
    }
  }
}

// Zona normal
const numNormales = datos.zonas.filter(z => !z.especial).length;
const plantilla = ZONAS_NORMALES[numNormales % ZONAS_NORMALES.length];
const vuelta = Math.floor(numNormales / ZONAS_NORMALES.length);
const tam = TAMANOS_NORMALES[numNormales % TAMANOS_NORMALES.length];
const idNormal = "z" + iso(hoy);
if (!datos.zonas.some(z => z.id === idNormal)) {
  const nombre = plantilla.nombre + (vuelta ? " " + ["", "II", "III", "IV", "V", "VI"][vuelta] : "");
  console.log("Zona normal:", nombre, tam + "×" + tam);
  const niveles = generarZona(Array(NIVELES_ZONA_NORMAL).fill(tam), idNormal);
  if (niveles.length >= Math.min(10, NIVELES_ZONA_NORMAL)) {
    nuevas.push({ id: idNormal, especial: false, nombre, emoji: plantilla.emoji,
      color: COLORES[numNormales % COLORES.length], deco: plantilla.deco, fecha: iso(hoy), niveles });
  }
}

if (!nuevas.length) { console.log("Nada nuevo que agregar."); process.exit(0); }

// Las especiales van primero para que se jueguen a tiempo
nuevas.sort((a, b) => (b.especial ? 1 : 0) - (a.especial ? 1 : 0));
datos.zonas.push(...nuevas);
datos.version = (datos.version || 0) + 1;
datos.actualizado = iso(hoy);
datos.proxima = iso(proxima);
fs.writeFileSync(ARCHIVO, JSON.stringify(datos, null, 1));
console.log(`Listo: versión ${datos.version}, ${nuevas.length} zona(s) nueva(s), ${datos.zonas.reduce((s, z) => s + z.niveles.length, 0)} niveles en total.`);
