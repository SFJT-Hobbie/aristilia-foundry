/**
 * Punto de entrada del sistema Aristilia para Foundry VTT (v13+/v14).
 */

import { ARISTILIA } from './module/config.mjs';
import * as models from './module/data-models.mjs';
import { AristiliaActor, AristiliaItem } from './module/documents.mjs';
import { AristiliaCharacterSheet, AristiliaNpcSheet } from './module/sheets/actor-sheet.mjs';
import { AristiliaItemSheet } from './module/sheets/item-sheet.mjs';
import { abilityMod, formatMod } from './module/helpers/modifiers.mjs';

/* -------------------------------------------- */
/*  Init                                        */
/* -------------------------------------------- */

Hooks.once('init', function () {
  console.log('Aristilia | Inicializando sistema');

  game.aristilia = { ARISTILIA };
  CONFIG.ARISTILIA = ARISTILIA;

  // Fórmula de iniciativa por bando (1d6)
  CONFIG.Combat.initiative = { formula: '1d6', decimals: 0 };

  // Clases de documento
  CONFIG.Actor.documentClass = AristiliaActor;
  CONFIG.Item.documentClass = AristiliaItem;

  // DataModels de Actor
  CONFIG.Actor.dataModels.character = models.CharacterData;
  CONFIG.Actor.dataModels.npc = models.NpcData;

  // DataModels de Item
  CONFIG.Item.dataModels.weapon = models.WeaponData;
  CONFIG.Item.dataModels.armor = models.ArmorData;
  CONFIG.Item.dataModels.shield = models.ShieldData;
  CONFIG.Item.dataModels.gear = models.GearData;
  CONFIG.Item.dataModels.spell = models.SpellData;
  CONFIG.Item.dataModels.proficiency = models.ProficiencyData;
  CONFIG.Item.dataModels.class = models.ClassData;
  CONFIG.Item.dataModels.race = models.RaceData;

  // Barra de recurso del token
  CONFIG.Actor.trackableAttributes = {
    character: { bar: ['hp'], value: [] },
    npc: { bar: ['hp'], value: [] }
  };

  // Registro de fichas (namespace v13+, con respaldo)
  const Actors = foundry.documents.collections.Actors ?? globalThis.Actors;
  const Items = foundry.documents.collections.Items ?? globalThis.Items;

  try { Actors.unregisterSheet('core', foundry.appv1?.sheets?.ActorSheet ?? globalThis.ActorSheet); } catch (e) { /* núcleo sin ficha V1 */ }
  Actors.registerSheet('aristilia', AristiliaCharacterSheet, {
    types: ['character'],
    makeDefault: true,
    label: 'ARISTILIA.Sheet.character'
  });
  Actors.registerSheet('aristilia', AristiliaNpcSheet, {
    types: ['npc'],
    makeDefault: true,
    label: 'ARISTILIA.Sheet.npc'
  });

  try { Items.unregisterSheet('core', foundry.appv1?.sheets?.ItemSheet ?? globalThis.ItemSheet); } catch (e) { /* núcleo sin ficha V1 */ }
  Items.registerSheet('aristilia', AristiliaItemSheet, {
    makeDefault: true,
    label: 'ARISTILIA.Sheet.item'
  });

  registerHandlebarsHelpers();
  preloadTemplates();
});

Hooks.once('ready', function () {
  console.log('Aristilia | Sistema listo');
});

/* -------------------------------------------- */
/*  Handlebars                                  */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  Handlebars.registerHelper('aristiliaMod', (value) => formatMod(abilityMod(value)));
  Handlebars.registerHelper('formatMod', (mod) => formatMod(Number(mod) || 0));
  Handlebars.registerHelper('aristiliaConcat', (...args) => args.slice(0, -1).join(''));
  Handlebars.registerHelper('aristiliaRange', (n) => Array.from({ length: Number(n) || 0 }, (_, i) => i));
  Handlebars.registerHelper('multiply', (a, b) => (Number(a) || 0) * (Number(b) || 0));
  Handlebars.registerHelper('add', (a, b) => (Number(a) || 0) + (Number(b) || 0));
  Handlebars.registerHelper('eq', (a, b) => a === b);
}

function preloadTemplates() {
  const paths = [
    'systems/aristilia/templates/actor/character-sheet.hbs',
    'systems/aristilia/templates/actor/npc-sheet.hbs',
    'systems/aristilia/templates/actor/parts/attributes.hbs',
    'systems/aristilia/templates/actor/parts/inventory-grid.hbs',
    'systems/aristilia/templates/actor/parts/proficiencies.hbs',
    'systems/aristilia/templates/item/item-sheet.hbs',
    'systems/aristilia/templates/chat/target20-card.hbs',
    'systems/aristilia/templates/chat/skill-card.hbs',
    'systems/aristilia/templates/chat/damage-card.hbs',
    'systems/aristilia/templates/chat/item-card.hbs'
  ];
  return foundry.applications.handlebars.loadTemplates(paths);
}
