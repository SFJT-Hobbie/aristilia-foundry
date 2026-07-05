/**
 * Constantes de configuración del sistema Aristilia.
 * Las etiquetas usan claves de i18n (ARISTILIA.*) resueltas en runtime.
 */

export const ARISTILIA = {};

/** Atributos (clave interna → clave i18n). Orden canónico de la ficha. */
export const ATTRIBUTES = {
  str: 'ARISTILIA.Attr.str',
  dex: 'ARISTILIA.Attr.dex',
  con: 'ARISTILIA.Attr.con',
  int: 'ARISTILIA.Attr.int',
  wis: 'ARISTILIA.Attr.wis',
  cha: 'ARISTILIA.Attr.cha'
};
ARISTILIA.attributes = ATTRIBUTES;

/** Abreviaturas de atributo. */
ARISTILIA.attributeAbbr = {
  str: 'ARISTILIA.AttrAbbr.str',
  dex: 'ARISTILIA.AttrAbbr.dex',
  con: 'ARISTILIA.AttrAbbr.con',
  int: 'ARISTILIA.AttrAbbr.int',
  wis: 'ARISTILIA.AttrAbbr.wis',
  cha: 'ARISTILIA.AttrAbbr.cha'
};

/** Clases jugables. */
ARISTILIA.classes = {
  fighter: 'ARISTILIA.Class.fighter',
  magicUser: 'ARISTILIA.Class.magicUser',
  specialist: 'ARISTILIA.Class.specialist'
};

/** Razas. */
ARISTILIA.races = {
  beastmen: 'ARISTILIA.Race.beastmen',
  dwarf: 'ARISTILIA.Race.dwarf',
  elf: 'ARISTILIA.Race.elf',
  halfling: 'ARISTILIA.Race.halfling',
  human: 'ARISTILIA.Race.human',
  verdant: 'ARISTILIA.Race.verdant'
};

/** Alineamientos. */
ARISTILIA.alignments = {
  lawful: 'ARISTILIA.Alignment.lawful',
  neutral: 'ARISTILIA.Alignment.neutral',
  chaotic: 'ARISTILIA.Alignment.chaotic'
};

/** Etapas de edad. */
ARISTILIA.ageStages = {
  young: 'ARISTILIA.AgeStage.young',
  adult: 'ARISTILIA.AgeStage.adult',
  elder: 'ARISTILIA.AgeStage.elder'
};

/** Método de generación de atributos (afecta bonus de XP). */
ARISTILIA.rollMethods = {
  heroic: 'ARISTILIA.RollMethod.heroic', // 4d6 descarta menor
  mortal: 'ARISTILIA.RollMethod.mortal' // 3d6 en orden, +10% XP
};

/** Estado vital del personaje. */
ARISTILIA.statuses = {
  alive: 'ARISTILIA.Status.alive',
  dead: 'ARISTILIA.Status.dead'
};

/** Tipos de PNJ. */
ARISTILIA.npcTypes = {
  monster: 'ARISTILIA.NpcType.monster',
  humanoid: 'ARISTILIA.NpcType.humanoid',
  beast: 'ARISTILIA.NpcType.beast',
  vehicle: 'ARISTILIA.NpcType.vehicle'
};

/** Competencias con arma disponibles. */
ARISTILIA.weaponProficiencies = [
  'Sword', 'Axe', 'Mace', 'Staff', 'Spear', 'Dagger', 'Flail', 'Warhammer',
  'Two-Handed Sword', 'Morning Star', 'Glaive', 'Halberd', 'Quarterstaff',
  'Bow', 'Shortbow', 'Crossbow', 'Hand Crossbow', 'Light Crossbow', 'Sling'
];

/** Escuelas de magia. */
ARISTILIA.spellSchools = {
  astral: 'ARISTILIA.SpellSchool.astral',
  natural: 'ARISTILIA.SpellSchool.natural',
  voiceForm: 'ARISTILIA.SpellSchool.voiceForm'
};

/** Categorías de equipo (gear). */
ARISTILIA.gearCategories = {
  apparel: 'ARISTILIA.GearCategory.apparel',
  supplies: 'ARISTILIA.GearCategory.supplies',
  machinery: 'ARISTILIA.GearCategory.machinery',
  companions: 'ARISTILIA.GearCategory.companions',
  magic: 'ARISTILIA.GearCategory.magic'
};

/** Tipo de competencia. */
ARISTILIA.proficiencyKinds = {
  weapon: 'ARISTILIA.ProfKind.weapon',
  nonWeapon: 'ARISTILIA.ProfKind.nonWeapon'
};

/** Constantes de mecánica. */
ARISTILIA.mechanics = {
  target: 20, // Target20
  critD20Success: 20,
  critD20Fail: 1,
  critD100SuccessMax: 5, // 1-5 éxito automático
  critD100FailMin: 96, // 96-100 fallo automático
  baseInventoryRows: 5, // grid 5x5 base
  baseInventoryCols: 5,
  baseCloseMovement: 30, // + DEX_mod * 5
  closeMovementPerMod: 5,
  baseOpenMovement: 120, // + DEX_mod * 20
  openMovementPerMod: 20,
  xpBonusPerMod: 5, // mod * 5 => % bonus XP
  mortalRollXpBonus: 10 // +10% por Lanzada Mortal
};

/** Dados de golpe por clase (según RulesClasses*). */
ARISTILIA.classHitDie = {
  fighter: 'd10',
  magicUser: 'd4',
  specialist: 'd6'
};

export default ARISTILIA;
