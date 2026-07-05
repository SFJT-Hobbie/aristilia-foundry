/**
 * Helpers de tirada de Aristilia.
 *  - Target20: 1d20 + mods + CA_enemigo >= 20 (éxito). 20 natural éxito, 1 natural fallo.
 *  - Competencia d100%: d100 <= skill. Crítico 1-5 éxito, 96-100 fallo.
 */

import { ARISTILIA } from '../config.mjs';
import { formatMod } from './modifiers.mjs';

const M = ARISTILIA.mechanics;

async function renderChat(actor, template, data) {
  const content = await foundry.applications.handlebars.renderTemplate(template, data);
  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content
  });
}

/**
 * Resolución Target20.
 * @param {object} p  { actor, label, mod, bonusToHit, targetAC, flavor }
 */
export async function rollTarget20({ actor, label, mod = 0, bonusToHit = 0, targetAC = 0, flavor } = {}) {
  const parts = ['1d20'];
  if (mod) parts.push(`${mod}`);
  if (bonusToHit) parts.push(`${bonusToHit}`);
  if (targetAC) parts.push(`${targetAC}`);
  const roll = await new Roll(parts.join(' + ')).evaluate();

  const die = roll.dice[0]?.results?.[0]?.result ?? roll.total;
  let outcome;
  if (die === M.critD20Success) outcome = 'critSuccess';
  else if (die === M.critD20Fail) outcome = 'critFail';
  else outcome = roll.total >= M.target ? 'success' : 'fail';

  const data = {
    type: 'target20',
    label: label ?? game.i18n.localize('ARISTILIA.Roll.target20'),
    flavor,
    formula: roll.formula,
    total: roll.total,
    target: M.target,
    die,
    modText: mod ? formatMod(mod) : null,
    bonusToHit: bonusToHit || null,
    targetAC: targetAC || null,
    outcome,
    outcomeLabel: game.i18n.localize(`ARISTILIA.Outcome.${outcome}`),
    tooltip: await roll.getTooltip()
  };
  await renderChat(actor, 'systems/aristilia/templates/chat/target20-card.hbs', data);
  return roll;
}

/**
 * Tirada de competencia d100%.
 * @param {object} p  { actor, label, skill }
 */
export async function rollSkillD100({ actor, label, skill = 0 } = {}) {
  const roll = await new Roll('1d100').evaluate();
  const value = roll.total;
  let outcome;
  if (value <= M.critD100SuccessMax) outcome = 'critSuccess';
  else if (value >= M.critD100FailMin) outcome = 'critFail';
  else outcome = value <= skill ? 'success' : 'fail';

  const data = {
    type: 'skill',
    label: label ?? game.i18n.localize('ARISTILIA.Roll.skill'),
    total: value,
    skill,
    outcome,
    outcomeLabel: game.i18n.localize(`ARISTILIA.Outcome.${outcome}`),
    tooltip: await roll.getTooltip()
  };
  await renderChat(actor, 'systems/aristilia/templates/chat/skill-card.hbs', data);
  return roll;
}

/**
 * Ataque con arma: usa STR (cuerpo a cuerpo) o DEX (proyectil) del actor.
 * @param {object} p  { actor, item, targetAC }
 */
export async function rollWeaponAttack({ actor, item, targetAC = 0 } = {}) {
  const sys = actor.system;
  const attrKey = item.system.ranged ? 'dex' : 'str';
  const mod = sys.attributes?.[attrKey]?.mod ?? 0;
  const bonusToHit = (sys.combat?.bonusToHit ?? 0) + (item.system.attackBonus ?? 0);

  const attackRoll = await rollTarget20({
    actor,
    label: `${item.name} — ${game.i18n.localize('ARISTILIA.Roll.attack')}`,
    mod,
    bonusToHit,
    targetAC,
    flavor: game.i18n.format('ARISTILIA.Roll.attackWith', { attr: game.i18n.localize(`ARISTILIA.Attr.${attrKey}`) })
  });

  // Tirada de daño (informativa, con modificador de atributo)
  if (item.system.damage) {
    const dmgFormula = mod ? `${item.system.damage} + ${mod}` : item.system.damage;
    const dmgRoll = await new Roll(dmgFormula).evaluate();
    await renderChat(actor, 'systems/aristilia/templates/chat/damage-card.hbs', {
      label: `${item.name} — ${game.i18n.localize('ARISTILIA.Roll.damage')}`,
      formula: dmgRoll.formula,
      total: dmgRoll.total,
      tooltip: await dmgRoll.getTooltip()
    });
  }
  return attackRoll;
}
