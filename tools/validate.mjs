/**
 * Validación estática del sistema (sin Foundry).
 * Comprueba JSON válido, que las rutas declaradas existan y que las plantillas
 * referenciadas por el manifiesto/entry estén presentes.
 * Uso: node tools/validate.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let errors = 0;
const fail = (m) => { console.error('  ✗', m); errors++; };
const ok = (m) => console.log('  ✓', m);

// 1. system.json
const sys = JSON.parse(readFileSync(join(root, 'system.json'), 'utf8'));
ok('system.json es JSON válido');
for (const f of sys.esmodules) {
  existsSync(join(root, f)) ? ok(`esmodule ${f}`) : fail(`falta esmodule ${f}`);
}
for (const s of sys.styles) {
  existsSync(join(root, s)) ? ok(`style ${s}`) : fail(`falta style ${s}`);
}
for (const l of sys.languages) {
  const p = join(root, l.path);
  if (!existsSync(p)) { fail(`falta idioma ${l.path}`); continue; }
  JSON.parse(readFileSync(p, 'utf8'));
  ok(`idioma ${l.path} válido`);
}
for (const pk of sys.packs ?? []) {
  existsSync(join(root, pk.path)) ? ok(`pack dir ${pk.path}`) : fail(`falta pack dir ${pk.path}`);
}

// 2. Plantillas referenciadas
const entry = readFileSync(join(root, 'aristilia.mjs'), 'utf8');
const tplRefs = [...entry.matchAll(/systems\/aristilia\/(templates\/[^'"]+\.hbs)/g)].map((m) => m[1]);
for (const t of new Set(tplRefs)) {
  existsSync(join(root, t)) ? ok(`plantilla ${t}`) : fail(`falta plantilla ${t}`);
}

// 3. Todas las .hbs existentes: balance de llaves {{ }}
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.hbs')) {
      const txt = readFileSync(p, 'utf8');
      const open = (txt.match(/\{\{/g) || []).length;
      const close = (txt.match(/\}\}/g) || []).length;
      open === close ? ok(`hbs balance ${name}`) : fail(`hbs desbalance ${name} (${open} vs ${close})`);
    }
  }
}
walk(join(root, 'templates'));

console.log(errors ? `\nFALLÓ con ${errors} error(es)` : '\nOK: validación estática superada');
process.exit(errors ? 1 : 0);
