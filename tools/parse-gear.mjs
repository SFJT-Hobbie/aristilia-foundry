/**
 * Parsea los archivos de equipo del repo (tools/repo-gear/*.jsx) a un JSON
 * (tools/gear-source.json) para poblar el compendio de Equipo. Prioriza el
 * contenido del repo del usuario. Uso: node tools/parse-gear.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), 'repo-gear');
const FILES = [
  ['Apparel', 'apparel'], ['Supplies', 'supplies'], ['Machinery', 'machinery'],
  ['Companions', 'companions'], ['Magic', 'magic']
];

const strip = (s) => s.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

function parseFile(text) {
  const out = [];
  const trs = text.match(/<tr[\s\S]*?<\/tr>/g) || [];
  for (const tr of trs) {
    const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => strip(m[1]));
    if (!tds.length) continue;
    const name = tds[0];
    if (!name || /^(objeto|compañero|nombre)$/i.test(name)) continue;
    const priceCell = tds.find((c) => /^[\d.]+\s*p$/i.test(c));
    const price = priceCell ? parseFloat(priceCell) : 0;
    const ints = tds.filter((c) => /^\d+$/.test(c));
    const cells = ints.length ? parseInt(ints[ints.length - 1], 10) : 1;
    // Extras: celdas que no son nombre/precio/celdas (daño, efecto, notas)
    const extras = tds.slice(1).filter((c) => c && c !== priceCell && !/^\d+$/.test(c));
    out.push({ name, price, cells, extras });
  }
  return out;
}

// Contenedor: compañeros traen su capacidad "(AxB)"; "Mochila/Morral/Alforja" → default.
function containerFor(name, extras) {
  for (const e of extras) {
    const m = e.match(/\((\d+)\s*x\s*(\d+)\)/i);
    if (m) return { cols: Math.min(10, +m[1]), rows: Math.min(10, +m[2]) };
  }
  if (/mochila|morral|alforja|zurr[oó]n/i.test(name)) return { cols: 2, rows: 2 };
  return { cols: 0, rows: 0 };
}
// Nota (p. ej. daño de trampas de maquinaria).
function noteFor(extras) {
  const dmg = extras.find((e) => /^\d*d\d+/i.test(e));
  return dmg ? `Daño: ${dmg}` : '';
}
// Apilables (heurística; el GM puede ajustar el "máx. por bundle" en cada objeto).
const STACK = [[/antorcha/i, 6], [/vela/i, 6], [/raci[oó]n/i, 7], [/aceite/i, 5],
  [/tiza/i, 10], [/clavo|pica|estaca/i, 10], [/flecha|virote|piedra|munici/i, 20], [/vendas?/i, 5]];
function stackFor(name) { for (const [re, n] of STACK) if (re.test(name)) return n; return 1; }

const result = [];
for (const [file, category] of FILES) {
  const text = readFileSync(join(dir, `${file}.jsx`), 'utf8');
  const rows = parseFile(text);
  console.log(`\n==== ${file} (${category}) — ${rows.length} filas ====`);
  for (const r of rows) {
    const container = containerFor(r.name, r.extras);
    const item = {
      name: r.name, category, price: r.price, cells: Math.max(1, r.cells || 1),
      note: noteFor(r.extras), stackMax: stackFor(r.name), container
    };
    result.push(item);
  }
  const cont = rows.filter((r) => containerFor(r.name, r.extras).cols > 0).length;
  console.log(`  contenedores: ${cont}`);
}
console.log(`\nTOTAL: ${result.length} objetos | contenedores: ${result.filter((r) => r.container.cols > 0).length} | apilables: ${result.filter((r) => r.stackMax > 1).length}`);
writeFileSync(join(dir, '..', 'gear-source.json'), JSON.stringify(result, null, 0));
console.log('Escrito tools/gear-source.json');
