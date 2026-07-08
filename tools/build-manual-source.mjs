/**
 * Convierte las páginas de reglas de la web-app (src/pages/Rules*.jsx, copiadas a
 * tools/rules-src/) en HTML limpio para el compendio "Manual de Aristilia".
 *
 * Salida: tools/manual-source.json  →  [{ key, name, sort, pages:[{title, html}] }]
 * Lo consume buildManual() en build-packs.mjs.
 *
 * El objetivo es portar FIELMENTE el contenido del repo (texto, listas y tablas),
 * descartando sólo lo que no aplica a Foundry: navegación (botones/enlaces/tarjetas
 * onClick), iconos decorativos <Icon> y <img> (assets no incluidos en el sistema).
 *
 * Uso: node tools/build-manual-source.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'tools', 'rules-src');

/** Mapa: un Journal ("libro") por sección, con sus páginas en orden. */
const BOOKS = [
  { key: 'atributos', name: 'Atributos', pages: [
    ['RulesAttributes', 'Atributos'],
  ] },
  { key: 'juego', name: 'El Juego', pages: [
    ['RulesGameMechanics', 'Mecánicas de Juego'],
    ['RulesGameCombat', 'Combate'],
    ['RulesGameManeuvers', 'Maniobras'],
    ['RulesGameExploration', 'Exploración'],
    ['RulesGameDowntime', 'Tiempo Muerto'],
    ['RulesGameLifeDeath', 'Vida y Muerte'],
    ['RulesGameXPLevel', 'Experiencia y Nivel'],
    ['RulesGameWeaponProf', 'Competencias con Arma'],
    ['RulesGameNonWeaponProf', 'Competencias sin Arma'],
  ] },
  { key: 'clases', name: 'Clases', pages: [
    ['RulesClasses', 'Introducción'],
    ['RulesClassesWarrior', 'Guerrero'],
    ['RulesClassesMagicUser', 'Usuario de Magia'],
    ['RulesClassesSpecialist', 'Especialista'],
    ['RulesClassesMulticlass', 'Multiclase'],
  ] },
  { key: 'razas', name: 'Razas', pages: [
    ['RulesRaces', 'Introducción'],
    ['RulesRacesHuman', 'Humano'],
    ['RulesRacesDwarf', 'Enano'],
    ['RulesRacesElf', 'Elfo'],
    ['RulesRacesHalfling', 'Mediano'],
    ['RulesRacesBeastman', 'Bestia'],
    ['RulesRacesVerdant', 'Verdant'],
  ] },
  { key: 'magia', name: 'Magia', pages: [
    ['RulesMagic', 'Introducción'],
    ['RulesMagicAstral', 'Escuela Astral'],
    ['RulesMagicNatural', 'Escuela Natural'],
    ['RulesMagicVoiceForm', 'Voz y Forma'],
    ['RulesMagicArchive', 'El Archivo'],
  ] },
  { key: 'equipo', name: 'Equipo', pages: [
    ['RulesGear', 'Introducción'],
    ['RulesGearWeapons', 'Armas'],
    ['RulesGearArmor', 'Armaduras y Escudos'],
    ['RulesGearApparel', 'Indumentaria'],
    ['RulesGearSupplies', 'Suministros'],
    ['RulesGearMachinery', 'Maquinaria'],
    ['RulesGearCompanions', 'Compañeros'],
    ['RulesGearMagic', 'Objetos Mágicos'],
  ] },
];

/** Tags de contenido que conservamos tal cual (semánticos). */
const KEEP = new Set([
  'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'caption',
  'strong', 'em', 'b', 'i', 'br', 'hr', 'blockquote',
]);

/** Tags contenedores que "desenvolvemos" (quitamos la etiqueta, dejamos el contenido). */
const UNWRAP = new Set(['div', 'main', 'section', 'span', 'article', 'header', 'footer', 'figure', 'figcaption']);

function jsxToHtml(src) {
  // 1) Aislar el cuerpo renderizado: del primer <section al último </section>.
  const start = src.indexOf('<section');
  const end = src.lastIndexOf('</section>');
  let s = (start >= 0 && end > start) ? src.slice(start, end + '</section>'.length) : src;

  // 2) Comentarios JSX {/* ... */}
  s = s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

  // 3) Iconos <Icon .../> e imágenes <img .../> (assets no portados).
  s = s.replace(/<Icon\b[^>]*\/?>/g, '');
  s = s.replace(/<img\b[^>]*\/?>/g, '');

  // 4) Navegación: botones, enlaces y tarjetas clicables (onClick) con su subárbol.
  s = s.replace(/<button\b[^>]*>[\s\S]*?<\/button>/g, '');
  s = s.replace(/<a\b[^>]*>[\s\S]*?<\/a>/g, '');
  // Tarjetas de navegación: <div ... onClick={...} ...>...</div> (no anidan otro div).
  let prev;
  do { prev = s; s = s.replace(/<div\b[^>]*\bonClick\b[^>]*>((?:(?!<div\b)[\s\S])*?)<\/div>/g, ''); } while (s !== prev);

  // 5) Título de página: primer <h1>…</h1> (lo quitamos; el nombre lo damos nosotros).
  s = s.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/g, '');

  // 6) Quitar TODOS los atributos de las etiquetas (className, etc.).
  s = s.replace(/<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*?(\/?)>/g, (m, tag, slash) => `<${tag.toLowerCase()}${slash ? '/' : ''}>`);

  // 7) Desenvolver contenedores (quitar etiqueta, conservar contenido).
  s = s.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\/?>/g, (m, tag) => {
    const t = tag.toLowerCase();
    if (UNWRAP.has(t)) return '';
    if (KEEP.has(t)) return m;
    return ''; // etiqueta desconocida remanente → desenvolver
  });

  // 8) Normalizar <br> y <hr> autocerrados.
  s = s.replace(/<br\/>/g, '<br>').replace(/<hr\/>/g, '<hr>');

  // 9) Escapar & sueltos que no formen una entidad.
  s = s.replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');

  // 10) Limpiar espacios: colapsar en blanco, quitar párrafos/celdas vacíos.
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  s = s.replace(/<(p|li|td|th|h[2-6])>\s*<\/\1>/g, '');
  s = s.replace(/[ \t]{2,}/g, ' ');
  s = s.replace(/>\s+</g, '>\n<');

  return s.trim();
}

const books = [];
for (let b = 0; b < BOOKS.length; b++) {
  const book = BOOKS[b];
  const pages = [];
  for (let p = 0; p < book.pages.length; p++) {
    const [file, title] = book.pages[p];
    const path = join(SRC, `${file}.jsx`);
    if (!existsSync(path)) { console.warn(`  ! falta ${file}.jsx — omitido`); continue; }
    const html = jsxToHtml(readFileSync(path, 'utf8'));
    const textLen = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().length;
    pages.push({ title, html, sort: (p + 1) * 1000 });
    console.log(`  ✓ ${book.name} › ${title}  (${textLen} chars de texto, ${(html.match(/<table>/g) || []).length} tablas)`);
  }
  books.push({ key: book.key, name: book.name, sort: (b + 1) * 100000, pages });
}

writeFileSync(join(root, 'tools', 'manual-source.json'), JSON.stringify(books, null, 2), 'utf8');
const totalPages = books.reduce((n, x) => n + x.pages.length, 0);
console.log(`\n✓ tools/manual-source.json: ${books.length} libros, ${totalPages} páginas`);
