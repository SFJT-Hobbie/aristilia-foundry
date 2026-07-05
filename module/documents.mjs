/**
 * Clases de documento del sistema Aristilia.
 * Los datos derivados viven en los DataModels (system.prepareDerivedData);
 * aquí se añaden métodos de utilidad y de tirada.
 */

import { rollTarget20, rollSkillD100, rollWeaponAttack } from './helpers/rolls.mjs';

export class AristiliaActor extends Actor {
  /**
   * Tirada Target20 basada en un atributo.
   * @param {string} attrKey  clave del atributo (str, dex, ...)
   * @param {object} [opts]    { bonusToHit, targetAC, situational, flavor }
   */
  async rollAttribute(attrKey, opts = {}) {
    const attr = this.system.attributes?.[attrKey];
    const mod = attr?.mod ?? 0;
    return rollTarget20({
      actor: this,
      label: game.i18n.localize(`ARISTILIA.Attr.${attrKey}`),
      mod,
      bonusToHit: opts.bonusToHit ?? 0,
      targetAC: opts.targetAC ?? 0,
      situational: opts.situational ?? 0,
      flavor: opts.flavor
    });
  }

  /** Tirada de salvación (Target20 con el bono de salvación). */
  async rollSave(opts = {}) {
    const bonus = this.system.combat?.bonusToSave ?? this.system.save ?? 0;
    return rollTarget20({
      actor: this,
      label: game.i18n.localize('ARISTILIA.Roll.save'),
      mod: bonus,
      situational: opts.situational ?? 0
    });
  }

  /** Tirada de golpe genérica: 1d20 + bono para golpear + CA del enemigo + situacional. */
  async rollHit(opts = {}) {
    const bonus = this.system.combat?.bonusToHit ?? this.system.bonusToHit ?? 0;
    return rollTarget20({
      actor: this,
      label: game.i18n.localize('ARISTILIA.Roll.hit'),
      mod: bonus,
      targetAC: opts.targetAC ?? this.system.combat?.targetAC ?? 0,
      situational: opts.situational ?? 0
    });
  }

  /** Tirada d100% de una competencia sin arma. `skill` es el % objetivo. */
  async rollSkill(label, skill) {
    return rollSkillD100({ actor: this, label, skill });
  }

  /** Ataque con un arma del inventario (Item). */
  async rollWeapon(itemId, opts = {}) {
    const item = this.items.get(itemId);
    if (!item || item.type !== 'weapon') return null;
    return rollWeaponAttack({ actor: this, item, targetAC: opts.targetAC ?? this.system.combat?.targetAC ?? 0, situational: opts.situational ?? 0 });
  }
}

export class AristiliaItem extends Item {
  /** Envía una tarjeta de descripción del Item al chat. */
  async toChat() {
    const content = await foundry.applications.handlebars.renderTemplate(
      'systems/aristilia/templates/chat/item-card.hbs',
      { item: this, system: this.system }
    );
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content
    });
  }
}
