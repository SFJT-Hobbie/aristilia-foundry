/**
 * Compila los compendios (LevelDB) del sistema Aristilia a partir de datos fuente.
 *   - gear:          armas + armaduras + escudos (WEAPONS, ARMOR)
 *   - proficiencies: catálogo completo (flattenProficiencies)
 *   - spells:        semilla de ejemplos por escuela (SPELLS)
 *
 * Uso: node tools/build-packs.mjs   (o npm run build:packs)
 * Requiere classic-level (devDependency).
 */
import { ClassicLevel } from 'classic-level';
import { createHash } from 'node:crypto';
import { copyFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { WEAPONS, ARMOR, GEAR, SPELLS, RACES, CLASSES } from './packs-data.mjs';
import { flattenProficiencies } from '../module/data/proficiencies.mjs';
import { TREASURE } from './treasure-data.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SYSTEM_VERSION = '0.17.0';

/** _id estable de 16 caracteres [A-Za-z0-9] derivado de una semilla. */
function makeId(seed) {
  const h = createHash('sha1').update(seed).digest('base64').replace(/[^a-zA-Z0-9]/g, '');
  return (h + '0000000000000000').slice(0, 16);
}

const ICONS = {
  weapon: 'icons/svg/sword.svg',
  armor: 'icons/svg/shield.svg',
  shield: 'icons/svg/shield.svg',
  spell: 'icons/svg/book.svg',
  proficiency: 'icons/svg/upgrade.svg',
  race: 'icons/svg/mystery-man.svg',
  class: 'icons/svg/statue.svg'
};

/** Icono por taxonomía de criatura (compendio de monstruos). */
const MONSTER_ICONS = {
  'Bestia': 'icons/svg/pawprint.svg',
  'Dragón': 'icons/svg/wing.svg',
  'No-muerto': 'icons/svg/skull.svg',
  'Constructo': 'icons/svg/statue.svg',
  'Elemental': 'icons/svg/fire.svg',
  'Planta': 'icons/svg/oak.svg',
  'Gigante': 'icons/svg/ice-aura.svg',
  'Humanoide': 'icons/svg/mystery-man.svg'
};
const MONSTER_ICON_DEFAULT = 'icons/svg/terror.svg';

function makeItem({ seed, name, type, system, folder = null }) {
  const _id = makeId(seed);
  return {
    _id,
    _key: `!items!${_id}`,
    name,
    type,
    img: ICONS[type] ?? 'icons/svg/item-bag.svg',
    system,
    effects: [],
    folder,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: {
      systemId: 'aristilia',
      systemVersion: SYSTEM_VERSION,
      coreVersion: '14',
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null
    }
  };
}

function makeActor({ seed, name, img, folder, system }) {
  const _id = makeId(seed);
  return {
    _id,
    _key: `!actors!${_id}`,
    name,
    type: 'npc',
    img,
    system,
    prototypeToken: {
      name,
      displayName: 20,
      actorLink: false,
      disposition: -1, // hostil por defecto
      texture: { src: img }
    },
    items: [],
    effects: [],
    folder: folder ?? null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: {
      systemId: 'aristilia',
      systemVersion: SYSTEM_VERSION,
      coreVersion: '14',
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null
    }
  };
}

function makeMacro({ seed, name, img, command }) {
  const _id = makeId(seed);
  return {
    _id,
    _key: `!macros!${_id}`,
    name,
    type: 'script',
    img,
    scope: 'global',
    command,
    author: null,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: {
      systemId: 'aristilia',
      systemVersion: SYSTEM_VERSION,
      coreVersion: '14',
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null
    }
  };
}

function makeFolder({ seed, name, type, sort = 0 }) {
  const _id = makeId(seed);
  return {
    _id,
    _key: `!folders!${_id}`,
    name,
    type,
    description: '',
    color: null,
    sorting: 'a',
    sort,
    folder: null,
    flags: {},
    _stats: {
      systemId: 'aristilia',
      systemVersion: SYSTEM_VERSION,
      coreVersion: '14',
      createdTime: 0,
      modifiedTime: 0,
      lastModifiedBy: null
    }
  };
}

/* -------------------------------------------- */
/*  Helpers de parseo del bestiario              */
/* -------------------------------------------- */

/** Primer entero que aparece en el valor (o 0). Acepta ya-números. */
function leadingInt(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v !== 'string') return 0;
  const m = v.match(/-?\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

/** HP medio jugable a partir del texto de Dados de Golpe (d8 estilo B/X). */
function computeHp(hdText) {
  if (typeof hdText !== 'string' || !hdText.trim()) return 1;
  if (/hp|hitpoint/i.test(hdText)) return Math.max(1, leadingInt(hdText)); // "1hp", "1-4 hitpoints"
  if (/½|1\/2/.test(hdText) && !/\d/.test(hdText.replace(/1\/2/, ''))) return 2;
  const m = hdText.match(/(\d+)\s*(?:\+\s*(\d+))?/);
  if (!m) return 1;
  const base = parseInt(m[1], 10);
  const bonus = m[2] ? parseInt(m[2], 10) : 0;
  return Math.max(1, Math.round(base * 4.5) + bonus);
}

/** Mapea el alineamiento ruidoso del bestiario a lawful | neutral | chaotic. */
function mapAlignment(a) {
  if (!a || typeof a !== 'string') return 'neutral';
  const s = a.toLowerCase();
  if (/(chaos|chaotic)/.test(s)) return 'chaotic';
  if (/(law|lawful)/.test(s)) return 'lawful';
  return 'neutral';
}

/** Mapea la taxonomía a un npcType válido (monster | humanoid | beast | vehicle). */
function mapNpcType(t) {
  if (t === 'Humanoide') return 'humanoid';
  if (t === 'Bestia') return 'beast';
  return 'monster';
}

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* -------------------------------------------- */
/*  Construcción de documentos por pack          */
/* -------------------------------------------- */

function buildMonsters() {
  const raw = JSON.parse(readFileSync(join(root, 'tools', 'monsters-source.json'), 'utf8'));
  const docs = [];

  // Carpetas por tipo (taxonomía). '-' se agrupa en "Otro".
  const ORDER = ['Bestia', 'Humanoide', 'Gigante', 'Dragón', 'No-muerto', 'Constructo', 'Elemental', 'Planta', 'Otro'];
  const folderId = (typeName) => makeId(`monfolder:${typeName}`);
  ORDER.forEach((typeName, i) => {
    docs.push(makeFolder({ seed: `monfolder:${typeName}`, name: typeName, type: 'Actor', sort: (i + 1) * 100000 }));
  });

  raw.forEach((m, i) => {
    const taxon = (m.type && m.type !== '-') ? m.type : 'Otro';
    const folderName = ORDER.includes(taxon) ? taxon : 'Otro';
    const hdInt = leadingInt(m.hit_dice);
    const hpMax = computeHp(m.hit_dice ?? '');
    const moveOpen = leadingInt(m.move);
    const img = MONSTER_ICONS[taxon] ?? MONSTER_ICON_DEFAULT;

    // Descripción autocontenida para referencia rápida en la ficha/chat.
    const descParts = [];
    if (m.description) descParts.push(`<p>${esc(m.description)}</p>`);
    if (m.attacks) descParts.push(`<p><strong>Ataques:</strong> ${esc(m.attacks)}</p>`);
    if (m.special) descParts.push(`<p><strong>Especial:</strong> ${esc(m.special)}</p>`);
    const meta = [];
    if (m.number_encountered) meta.push(`<strong>N.º encontrados:</strong> ${esc(m.number_encountered)}`);
    if (m.treasure_type) meta.push(`<strong>Tesoro:</strong> ${esc(m.treasure_type)}`);
    if (m.challenge_level) meta.push(`<strong>Nivel de desafío:</strong> ${esc(m.challenge_level)}`);
    if (meta.length) descParts.push(`<p>${meta.join(' · ')}</p>`);
    if (m.source_ref) descParts.push(`<p><em>Fuente: ${esc(m.source_ref)}</em></p>`);

    docs.push(makeActor({
      seed: `monster:${i}:${m.name}`,
      name: m.name,
      img,
      folder: folderId(folderName),
      system: {
        npcType: mapNpcType(m.type),
        creatureType: (m.type && m.type !== '-') ? m.type : '',
        biome: (m.biome && m.biome !== '-') ? m.biome : '',
        alignment: mapAlignment(m.alignment),
        hd: hdInt,
        hitDiceText: m.hit_dice ?? '',
        hp: { value: hpMax, max: hpMax },
        ac: leadingInt(m.ac_desc),
        // El bestiario da la salvación como objetivo "roll-over" (d20 ≥ S, menor = mejor);
        // Aristilia usa un bono aditivo en Target20 (1d20 + bono ≥ 20, mayor = mejor).
        // Conversión que iguala probabilidades: bono = 20 − S. Sin dato → proxy = HD.
        save: (m.saving_throw == null) ? hdInt : Math.max(0, 20 - leadingInt(m.saving_throw)),
        bonusToHit: hdInt, // convención Target20: bono ≈ Dados de Golpe
        attacks: m.attacks ?? '',
        special: m.special ?? '',
        movement: { close: moveOpen, open: moveOpen },
        moveText: m.move ?? '',
        morale: leadingInt(m.morale),
        xp: typeof m.xp === 'number' ? m.xp : leadingInt(m.xp),
        challengeLevel: m.challenge_level != null ? String(m.challenge_level) : '',
        numberEncountered: m.number_encountered ?? '',
        treasureType: m.treasure_type ?? 'Nil',
        treasureAdd: m.treasure_add ?? '',
        treasureSource: m.treasure_source ?? '',
        source: m.sources ?? '',
        sourceRef: m.source_ref ?? '',
        inventory: { cols: 5, rows: 5 },
        description: descParts.join('\n')
      }
    }));
  });
  return docs;
}

function buildGear() {
  const docs = [];
  const AMMO = new Set(['Flechas', 'Virotes', 'Piedras']); // apilables en bundles
  const fW = makeId('gearfolder:weapons');
  const fA = makeId('gearfolder:armor');
  const fG = makeId('gearfolder:gear');
  docs.push(makeFolder({ seed: 'gearfolder:weapons', name: 'Armas', type: 'Item', sort: 100000 }));
  docs.push(makeFolder({ seed: 'gearfolder:armor', name: 'Armaduras y Escudos', type: 'Item', sort: 200000 }));
  docs.push(makeFolder({ seed: 'gearfolder:gear', name: 'Equipo de aventura', type: 'Item', sort: 300000 }));

  for (const w of WEAPONS) {
    for (const [cond, row] of [['DE', w.de], ['BE', w.be]]) {
      const [damage, price, slots, range] = row;
      const name = `${w.name} (${cond})`;
      docs.push(makeItem({
        seed: `gear:weapon:${name}`,
        name,
        type: 'weapon',
        folder: fW,
        system: {
          description: `<p>Arma. Competencia: ${w.prof}.</p>`,
          proficiency: w.prof,
          damage,
          ranged: w.ranged,
          range: range || '',
          attackBonus: 0,
          condition: cond === 'DE' ? 'Desgastada' : 'Buen Estado',
          size: { w: 1, h: slots },
          slot: { x: null, y: null, equipped: false },
          quantity: 1,
          stack: { max: AMMO.has(w.name) ? 20 : 1 },
          weight: slots,
          price
        }
      }));
    }
  }
  for (const a of ARMOR) {
    for (const [cond, row] of [['DE', a.de], ['BE', a.be]]) {
      const [ac, price, slots] = row;
      const name = `${a.name} (${cond})`;
      docs.push(makeItem({
        seed: `gear:${a.kind}:${name}`,
        name,
        type: a.kind,
        folder: fA,
        system: {
          description: `<p>${a.kind === 'shield' ? 'Escudo' : 'Armadura'}. CA ${ac} (menor es mejor).</p>`,
          ac,
          size: { w: 1, h: slots },
          slot: { x: null, y: null, equipped: false },
          quantity: 1,
          weight: slots,
          price
        }
      }));
    }
  }
  for (const g of GEAR) {
    docs.push(makeItem({
      seed: `gear:gear:${g.name}`,
      name: g.name,
      type: 'gear',
      folder: fG,
      system: {
        description: '',
        category: g.category,
        container: g.container ?? { cols: 0, rows: 0 },
        size: { w: g.w, h: g.h },
        slot: { x: null, y: null, equipped: false },
        quantity: 1,
        weight: g.weight,
        price: g.price
      }
    }));
  }
  return docs;
}

function buildProficiencies() {
  const attrMap = {
    Strength: 'str', Dexterity: 'dex', Constitution: 'con',
    Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha'
  };
  return flattenProficiencies().map((p) => makeItem({
    seed: `prof:${p.category}:${p.key}`,
    name: p.key,
    type: 'proficiency',
    system: {
      description: `<p>${p.description ?? ''}</p>${p.restriction ? `<p><em>${p.restriction}</em></p>` : ''}`,
      kind: 'nonWeapon',
      category: p.category,
      attribute: attrMap[p.attribute] ?? 'str',
      slots: p.slots ?? 1,
      difficulty: p.difficulty?.successesNeeded ? `${p.difficulty.successesNeeded} éxitos` : 'Simple',
      skill: 0,
      restriction: p.restriction ?? ''
    }
  }));
}

function buildRaces() {
  return RACES.map((r) => makeItem({
    seed: `race:${r.key}`,
    name: r.name,
    type: 'race',
    system: {
      description:
        `<p><strong>Modificadores de atributo:</strong> ${r.abilityMods}</p>` +
        `<p><strong>Bono de HP:</strong> ${r.hpBonus} · <strong>Bono de salvación:</strong> +${r.saveBonus} vs. ${r.saveVs}</p>` +
        `<p><strong>Idiomas:</strong> ${r.languages} · <strong>Competencias:</strong> ${r.profSlots}</p>` +
        `<p>${r.special}</p>`,
      key: r.key,
      abilityMods: r.abilityMods,
      hpBonus: r.hpBonus,
      saveBonus: r.saveBonus,
      saveVs: r.saveVs,
      languages: r.languages,
      profSlots: r.profSlots
    }
  }));
}

function buildClasses() {
  return CLASSES.map((c) => makeItem({
    seed: `class:${c.key}`,
    name: c.name,
    type: 'class',
    system: {
      description:
        `<p><strong>Dado de golpe:</strong> ${c.hitDie} · <strong>Comp. armas:</strong> ${c.weaponSlots} · <strong>Comp. no-armas:</strong> ${c.nonWeaponSlots}</p>` +
        `<p><strong>Salvada base:</strong> +${c.baseSave} vs. ${c.saveVs} · <strong>Bono al golpear:</strong> ${c.hitBonus}</p>` +
        `<p>${c.special}</p>`,
      key: c.key,
      hitDie: c.hitDie,
      weaponSlots: c.weaponSlots,
      nonWeaponSlots: c.nonWeaponSlots,
      baseSave: c.baseSave,
      saveVs: c.saveVs,
      hitBonus: c.hitBonus
    }
  }));
}

function buildSpells() {
  return SPELLS.map((s) => makeItem({
    seed: `spell:${s.school}:${s.name}`,
    name: s.name,
    type: 'spell',
    system: {
      description: `<p>${s.description}</p>`,
      school: s.school,
      level: s.level,
      cost: s.cost ?? '',
      castingTime: s.castingTime ?? '',
      range: s.range ?? '',
      duration: s.duration ?? ''
    }
  }));
}

function docStats() {
  return { systemId: 'aristilia', systemVersion: SYSTEM_VERSION, coreVersion: '14', createdTime: 0, modifiedTime: 0, lastModifiedBy: null };
}

/** Importa los personajes de la web-app (SQL) al modelo de Aristilia. */
function buildCharacters() {
  const raw = JSON.parse(readFileSync(join(root, 'tools', 'characters-source.json'), 'utf8'));
  const docs = [];

  const RACE = { human: 'human', dwarf: 'dwarf', elf: 'elf', halfling: 'halfling', beastmen: 'beastmen', verdant: 'verdant' };
  const CLASS = { fighter: 'fighter', warrior: 'fighter', warriro: 'fighter', 'magic user': 'magicUser', magicuser: 'magicUser', specialist: 'specialist' };
  const ALIGN = { lawful: 'lawful', neutral: 'neutral', chaotic: 'chaotic' };
  const NPCTYPE = { beast: 'beast', humanoid: 'humanoid', monster: 'monster', vehicle: 'vehicle' };
  const ATTR = { strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha' };

  const mapKey = (m, v, def) => m[String(v ?? '').toLowerCase().trim()] ?? def;
  const num = (v, def = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : def; };
  const lastInt = (v) => {
    if (typeof v === 'number') return Math.trunc(v);
    const m = String(v ?? '').match(/-?\d+/g);
    return m ? parseInt(m[m.length - 1], 10) : 0;
  };
  const toHtml = (s) => String(s ?? '').replace(/\\n/g, '<br>').replace(/\r?\n/g, '<br>').trim();
  const spaceCamel = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');

  function classify(name) {
    const n = String(name).toLowerCase();
    if (/escudo|rodela|broquel/.test(n)) return 'shield';
    if (/armadura|cota|malla|coraza|chainmail|plate|placas|restos de cuero/.test(n)) return 'armor';
    if (/espad[oó]?n?|arco|daga|ballesta|hacha|maza|lanza|bast[oó]n|martillo|honda|greatsword|sword|hammer|glaive|quarterstaff/.test(n)) return 'weapon';
    return 'gear';
  }

  const folders = { PC: makeId('charfolder:PC'), NPC: makeId('charfolder:NPC') };
  docs.push(makeFolder({ seed: 'charfolder:PC', name: 'Jugadores', type: 'Actor', sort: 100000 }));
  docs.push(makeFolder({ seed: 'charfolder:NPC', name: 'PNJ (campaña)', type: 'Actor', sort: 200000 }));

  for (const c of raw) {
    const s = c.data ?? {};
    const isPC = c.type !== 'NPC';

    // Items embebidos SIN colocar en la rejilla (mochila) + competencias rollables.
    const items = [];
    for (const e of (s.equipment ?? [])) {
      const kind = classify(e.name ?? '');
      const w = e.slot_position?.w ?? 1;
      const h = e.slot_position?.h ?? 1;
      const base = { name: e.name ?? 'Objeto', description: '', size: { w, h }, slot: { x: null, y: null, equipped: false }, quantity: 1, weight: 0, price: 0 };
      const sys = kind === 'weapon'
        ? { ...base, proficiency: '', damage: '1d6', ranged: false, range: '', attackBonus: 0, condition: '' }
        : (kind === 'armor' || kind === 'shield') ? { ...base, ac: 0 }
        : { ...base, category: 'supplies' };
      const _id = makeId(`item:${c.name}:${e.id ?? e.name}`);
      items.push({ _id, name: base.name, type: kind, img: ICONS[kind] ?? 'icons/svg/item-bag.svg', system: sys, effects: [], folder: null, sort: 0, flags: {}, _stats: docStats() });
    }
    for (const p of (s.nonWeaponProficiencies ?? [])) {
      const _id = makeId(`prof:${c.name}:${p.name}`);
      items.push({ _id, name: spaceCamel(p.name ?? 'Competencia'), type: 'proficiency', img: ICONS.proficiency, system: { description: '', kind: 'nonWeapon', category: '', attribute: 'int', slots: 1, difficulty: '', skill: num(p.value, 0), restriction: '' }, effects: [], folder: null, sort: 0, flags: {}, _stats: docStats() });
    }

    const img = s.picture || (isPC ? 'icons/svg/mystery-man.svg' : MONSTER_ICON_DEFAULT);
    // Nota de CA importada (los campos equippedArmor/Shield de la web-app son inconsistentes).
    const acNote = [s.equippedArmor, s.equippedShield].filter((x) => x && String(x).trim() && String(x) !== '0')
      .map((x) => String(x)).join(' · ');
    let bio = toHtml(s.description);
    if (isPC && acNote) bio += `${bio ? '<br>' : ''}<em>CA importada (revisar): ${acNote}</em>`;

    let system, actorType, folder;
    if (isPC) {
      actorType = 'character';
      folder = folders.PC;
      const ab = s.abilityScores ?? {};
      const attrs = {};
      for (const [src, key] of Object.entries(ATTR)) attrs[key] = { value: num(ab?.[src], 10) };
      const hpMax = num(s.hitPoints ?? s.hp, 1) || 1;
      system = {
        attributes: attrs,
        details: {
          race: mapKey(RACE, s.race, 'human'), class: mapKey(CLASS, s.class, 'fighter'),
          level: num(s.level, 1) || 1, xp: num(s.xp, 0), alignment: mapKey(ALIGN, s.alignment, 'neutral'),
          ageStage: s.ageStage || 'adult', rollMethod: 'heroic', status: s.status || 'alive',
          deathDate: s.deathDate || '', deathDescription: s.deathDescription || '', restingSite: s.restingSite || ''
        },
        hp: { value: num(s.currentHP, hpMax), max: hpMax },
        ac: { armor: lastInt(s.equippedArmor), shield: lastInt(s.equippedShield) },
        combat: { bonusToHit: num(s.bonusToHit, 0), bonusToSave: num(s.bonusToSave, 0), targetAC: 0 },
        proficiencies: { weapon: (s.weaponProficiencies ?? []).map(String), nonWeapon: [] },
        currency: { gold: num(s.currency?.gold, 0), silver: num(s.currency?.silver, 0), copper: num(s.currency?.copper, 0) },
        languages: (s.languages ?? []).map(String).join(', '),
        biography: bio
      };
    } else {
      actorType = 'npc';
      folder = folders.NPC;
      const hdInt = num(s.hd, 1);
      const hpMax = num(s.hp, 0) > 0 ? num(s.hp) : Math.max(1, Math.round(hdInt * 4.5));
      system = {
        npcType: mapKey(NPCTYPE, s.npcType, 'monster'), creatureType: '', biome: '',
        alignment: mapKey(ALIGN, s.alignment, 'neutral'), hd: hdInt, hitDiceText: '',
        hp: { value: hpMax, max: hpMax }, ac: lastInt(s.ac), save: num(s.save, 0), bonusToHit: num(s.bonusToHit, 0),
        attacks: '', special: '', movement: { close: num(s.closeQuarterMovement, 30), open: num(s.openFieldMovement, 120) },
        moveText: '', morale: 0, xp: num(s.xp, 0), challengeLevel: '', numberEncountered: '',
        treasureType: 'Nil', treasureAdd: '', treasureSource: '', source: 'web-app', sourceRef: '',
        inventory: { cols: 5, rows: 5 },
        proficiencies: { weapon: (s.weaponProficiencies ?? []).map(String), nonWeapon: [] },
        description: bio
      };
    }

    const _id = makeId(`char:${c.name}:${c.user_id}`);
    docs.push({
      _id, _key: `!actors!${_id}`, name: c.name, type: actorType, img, system, items,
      prototypeToken: { name: c.name, displayName: 20, actorLink: isPC, disposition: isPC ? 1 : 0, texture: { src: img } },
      effects: [], folder, sort: 0, ownership: { default: 0 },
      flags: { aristilia: { sourceUserId: c.user_id } }, _stats: docStats()
    });
  }
  return docs;
}

function buildTreasure() {
  // Los datos B/X se inyectan como prefijo en el command de cada macro, así son
  // autocontenidas (solo dependen de APIs estables de Foundry: Roll/ChatMessage/DialogV2).
  const prelude = `const TREASURE = ${JSON.stringify(TREASURE)};\n`;
  const hoard = readFileSync(join(root, 'tools', 'macros', 'treasure-hoard.js'), 'utf8');
  const subtable = readFileSync(join(root, 'tools', 'macros', 'treasure-subtable.js'), 'utf8');
  return [
    makeMacro({ seed: 'treasure:hoard', name: 'Generar botín de tesoro', img: 'icons/svg/coins.svg', command: prelude + hoard }),
    makeMacro({ seed: 'treasure:subtable', name: 'Tirar subtabla de tesoro', img: 'icons/svg/d20-grey.svg', command: prelude + subtable })
  ];
}

/* -------------------------------------------- */
/*  Escritura LevelDB                            */
/* -------------------------------------------- */

async function writePack(name, docs) {
  const dbPath = join(root, 'packs', name);
  const db = new ClassicLevel(dbPath, { valueEncoding: 'json' });
  await db.clear(); // reconstrucción limpia
  const batch = db.batch();
  for (const doc of docs) {
    const { _key, ...value } = doc;
    batch.put(_key, value);
  }
  await batch.write();
  await db.close();
  console.log(`  ✓ pack "${name}": ${docs.length} documentos`);
}

// Sincroniza en.json = es-ES.json (mismas etiquetas en español para clientes en inglés).
copyFileSync(join(root, 'lang', 'es-ES.json'), join(root, 'lang', 'en.json'));
console.log('  ✓ lang/en.json sincronizado desde es-ES.json');

const gear = buildGear();
const profs = buildProficiencies();
const spells = buildSpells();
const races = buildRaces();
const classes = buildClasses();
const monsters = buildMonsters();
const treasure = buildTreasure();
const characters = buildCharacters();

await writePack('gear', gear);
await writePack('proficiencies', profs);
await writePack('spells', spells);
await writePack('races', races);
await writePack('classes', classes);
await writePack('monsters', monsters);
await writePack('treasure', treasure);
await writePack('characters', characters);

const total = gear.length + profs.length + spells.length + races.length + classes.length + monsters.length + treasure.length + characters.length;
console.log(`\nTotal: ${total} documentos compilados en 8 compendios.`);
