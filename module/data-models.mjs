/**
 * DataModels del sistema Aristilia (Foundry v13+/v14).
 * Definen el esquema de Actores e Items usando foundry.data.fields.
 */

import { ARISTILIA } from './config.mjs';
import { abilityMod } from './helpers/modifiers.mjs';

const fields = foundry.data.fields;

/* -------------------------------------------- */
/*  Campos reutilizables                        */
/* -------------------------------------------- */

function resourceField(value = 0, max = 0) {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, initial: value }),
    max: new fields.NumberField({ required: true, integer: true, initial: max })
  });
}

function attributeField() {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, initial: 10, min: 0 })
  });
}

/* -------------------------------------------- */
/*  Actor: Personaje (PC)                        */
/* -------------------------------------------- */

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const attrs = {};
    for (const key of Object.keys(ARISTILIA.attributes)) attrs[key] = attributeField();

    return {
      attributes: new fields.SchemaField(attrs),
      details: new fields.SchemaField({
        race: new fields.StringField({ initial: 'human' }),
        class: new fields.StringField({ initial: 'fighter' }),
        level: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
        xp: new fields.NumberField({ integer: true, initial: 0, min: 0 }),
        alignment: new fields.StringField({ initial: 'neutral' }),
        ageStage: new fields.StringField({ initial: 'adult' }),
        rollMethod: new fields.StringField({ initial: 'heroic' }),
        status: new fields.StringField({ initial: 'alive' }),
        deathDate: new fields.StringField({ initial: '' }),
        deathDescription: new fields.StringField({ initial: '' }),
        restingSite: new fields.StringField({ initial: '' })
      }),
      hp: resourceField(6, 6),
      ac: new fields.SchemaField({
        armor: new fields.NumberField({ integer: true, initial: 0 }),
        shield: new fields.NumberField({ integer: true, initial: 0 })
        // `value` es derivado
      }),
      combat: new fields.SchemaField({
        bonusToHit: new fields.NumberField({ integer: true, initial: 0 }),
        bonusToSave: new fields.NumberField({ integer: true, initial: 0 }),
        targetAC: new fields.NumberField({ integer: true, initial: 0 }) // CA del enemigo actual
      }),
      proficiencies: new fields.SchemaField({
        weapon: new fields.ArrayField(new fields.StringField()),
        nonWeapon: new fields.ArrayField(new fields.StringField())
      }),
      biography: new fields.HTMLField({ initial: '' })
    };
  }

  /** Datos derivados: modificadores, movimiento, inventario, CA, %XP. */
  prepareDerivedData() {
    const m = ARISTILIA.mechanics;
    const mods = {};
    for (const [key, attr] of Object.entries(this.attributes)) {
      attr.mod = abilityMod(attr.value);
      mods[key] = attr.mod;
    }

    // Movimiento (según Destreza)
    this.movement = {
      close: m.baseCloseMovement + mods.dex * m.closeMovementPerMod,
      open: m.baseOpenMovement + mods.dex * m.openMovementPerMod
    };

    // Inventario: filas = 5 + STR_mod (mínimo 1), columnas fijas
    this.inventory = {
      cols: m.baseInventoryCols,
      rows: Math.max(1, m.baseInventoryRows + mods.str)
    };

    // Clase de Armadura (CA descendente: menor = más difícil de golpear).
    // Es ADITIVA: se suman los valores de CA de TODAS las armaduras y escudos
    // equipados (armadura 8 + escudo -1 = 7). Si no hay nada equipado, se usan
    // los campos manuales de la ficha como respaldo.
    const items = this.parent?.items ?? [];
    const equippedAC = items.filter((i) => ['armor', 'shield'].includes(i.type) && i.system.slot?.equipped);
    if (equippedAC.length) {
      this.ac.value = equippedAC.reduce((sum, i) => sum + (i.system.ac ?? 0), 0);
    } else {
      this.ac.value = (this.ac.armor || 0) + (this.ac.shield || 0);
    }
    this.ac.equipped = equippedAC.length > 0;
    this.ac.equippedArmor = equippedAC.find((i) => i.type === 'armor')?.name ?? null;
    this.ac.equippedShield = equippedAC.find((i) => i.type === 'shield')?.name ?? null;

    // Resistencia mágica (Sabiduría, sólo si positivo)
    this.magicResistance = Math.max(0, mods.wis) * m.xpBonusPerMod;

    // % Bonus de Experiencia
    let xpBonus = mods.wis * m.xpBonusPerMod; // WIS aplica a cualquier clase
    if (this.details.class === 'fighter') xpBonus += mods.str * m.xpBonusPerMod;
    else if (this.details.class === 'magicUser') xpBonus += mods.int * m.xpBonusPerMod;
    if (this.details.rollMethod === 'mortal') xpBonus += m.mortalRollXpBonus;
    this.details.xpBonus = xpBonus;

    // Ranuras de competencia / lenguaje adicionales (Inteligencia)
    this.proficiencySlots = { bonus: mods.int, languages: Math.max(0, mods.int) };
  }
}

/* -------------------------------------------- */
/*  Actor: PNJ (NPC)                             */
/* -------------------------------------------- */

export class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      npcType: new fields.StringField({ initial: 'monster' }),
      hd: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
      hp: resourceField(4, 4),
      save: new fields.NumberField({ integer: true, initial: 0 }),
      bonusToHit: new fields.NumberField({ integer: true, initial: 0 }),
      ac: new fields.NumberField({ integer: true, initial: 0 }),
      movement: new fields.SchemaField({
        close: new fields.NumberField({ integer: true, initial: 30 }),
        open: new fields.NumberField({ integer: true, initial: 120 })
      }),
      proficiencies: new fields.SchemaField({
        weapon: new fields.ArrayField(new fields.StringField()),
        nonWeapon: new fields.ArrayField(new fields.StringField())
      }),
      description: new fields.HTMLField({ initial: '' })
    };
  }
}

/* -------------------------------------------- */
/*  Items                                        */
/* -------------------------------------------- */

/** Campos comunes de posición/tamaño en el grid de inventario. */
function gridFields() {
  return {
    size: new fields.SchemaField({
      w: new fields.NumberField({ integer: true, initial: 1, min: 1 }),
      h: new fields.NumberField({ integer: true, initial: 1, min: 1 })
    }),
    slot: new fields.SchemaField({
      x: new fields.NumberField({ integer: true, initial: 0, nullable: true }),
      y: new fields.NumberField({ integer: true, initial: 0, nullable: true }),
      equipped: new fields.BooleanField({ initial: false })
    }),
    quantity: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
    weight: new fields.NumberField({ initial: 0, min: 0 }),
    price: new fields.NumberField({ initial: 0, min: 0 }) // en piezas de plata (sp)
  };
}

export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      ...gridFields(),
      proficiency: new fields.StringField({ initial: 'Sword' }),
      damage: new fields.StringField({ initial: '1d6' }),
      ranged: new fields.BooleanField({ initial: false }), // usa DEX en lugar de STR
      range: new fields.StringField({ initial: '' }),
      attackBonus: new fields.NumberField({ integer: true, initial: 0 }),
      condition: new fields.StringField({ initial: '' }) // ej: Gastada, Bien mantenida
    };
  }
}

export class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      ...gridFields(),
      ac: new fields.NumberField({ integer: true, initial: 0 })
    };
  }
}

export class ShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      ...gridFields(),
      ac: new fields.NumberField({ integer: true, initial: 0 })
    };
  }
}

export class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      ...gridFields(),
      category: new fields.StringField({ initial: 'supplies' })
    };
  }
}

export class SpellData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      school: new fields.StringField({ initial: 'astral' }),
      level: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
      cost: new fields.StringField({ initial: '' }), // maná / ranuras / puntos
      castingTime: new fields.StringField({ initial: '' }),
      range: new fields.StringField({ initial: '' }),
      duration: new fields.StringField({ initial: '' })
    };
  }
}

export class ProficiencyData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      kind: new fields.StringField({ initial: 'nonWeapon' }), // weapon | nonWeapon
      category: new fields.StringField({ initial: '' }),
      attribute: new fields.StringField({ initial: 'str' }),
      slots: new fields.NumberField({ integer: true, initial: 1, min: 0 }),
      difficulty: new fields.StringField({ initial: 'Simple' }),
      skill: new fields.NumberField({ integer: true, initial: 0, min: 0, max: 100 }), // % competencia
      restriction: new fields.StringField({ initial: '' })
    };
  }
}

export class ClassData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      key: new fields.StringField({ initial: 'fighter' }),
      hitDie: new fields.StringField({ initial: 'd10' }),
      weaponSlots: new fields.NumberField({ integer: true, initial: 0 }),
      nonWeaponSlots: new fields.NumberField({ integer: true, initial: 0 }),
      baseSave: new fields.NumberField({ integer: true, initial: 0 }),
      saveVs: new fields.StringField({ initial: '' }),
      hitBonus: new fields.StringField({ initial: '' })
    };
  }
}

export class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ initial: '' }),
      key: new fields.StringField({ initial: 'human' }),
      abilityMods: new fields.StringField({ initial: '' }),
      hpBonus: new fields.NumberField({ integer: true, initial: 0 }),
      saveBonus: new fields.NumberField({ integer: true, initial: 0 }),
      saveVs: new fields.StringField({ initial: '' }),
      languages: new fields.StringField({ initial: '' }),
      profSlots: new fields.StringField({ initial: '' })
    };
  }
}
