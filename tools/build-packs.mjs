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
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { WEAPONS, ARMOR, SPELLS, RACES, CLASSES } from './packs-data.mjs';
import { flattenProficiencies } from '../module/data/proficiencies.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SYSTEM_VERSION = '0.6.2';

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

function makeItem({ seed, name, type, system }) {
  const _id = makeId(seed);
  return {
    _id,
    _key: `!items!${_id}`,
    name,
    type,
    img: ICONS[type] ?? 'icons/svg/item-bag.svg',
    system,
    effects: [],
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

/* -------------------------------------------- */
/*  Construcción de documentos por pack          */
/* -------------------------------------------- */

function buildGear() {
  const docs = [];
  for (const w of WEAPONS) {
    for (const [cond, row] of [['DE', w.de], ['BE', w.be]]) {
      const [damage, price, slots, range] = row;
      const name = `${w.name} (${cond})`;
      docs.push(makeItem({
        seed: `gear:weapon:${name}`,
        name,
        type: 'weapon',
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

await writePack('gear', gear);
await writePack('proficiencies', profs);
await writePack('spells', spells);
await writePack('races', races);
await writePack('classes', classes);

const total = gear.length + profs.length + spells.length + races.length + classes.length;
console.log(`\nTotal: ${total} items compilados en 5 compendios.`);
