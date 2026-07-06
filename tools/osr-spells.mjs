/**
 * Nombres canónicos de hechizos OSR (AD&D 1e/2e + B/X: Mago, Clérigo, Druida,
 * Ilusionista, niveles 1-6). Se usa para separar el "Núcleo OSR" (hechizos que
 * existen de verdad en OSR → ya balanceados) del "Extendido" (derivado de PF, a
 * adaptar). El cruce es por NOMBRE normalizado (minúsculas, sin puntuación).
 * Los renombrados por Pathfinder (p. ej. "Summon Monster" vs "Monster Summoning")
 * caen en Extendido; se pueden añadir alias acá si hace falta afinar.
 */
export const OSR_SPELLS = [
  // --- Mago / Arcano ---
  'Affect Normal Fires', 'Burning Hands', 'Charm Person', 'Comprehend Languages', 'Dancing Lights',
  'Detect Magic', 'Enlarge', 'Reduce', 'Erase', 'Feather Fall', 'Find Familiar', 'Floating Disk',
  "Tenser's Floating Disc", 'Hold Portal', 'Identify', 'Jump', 'Light', 'Magic Missile', 'Mending',
  'Message', 'Magic Aura', "Nystul's Magic Aura", 'Protection from Evil', 'Read Magic', 'Shield',
  'Shocking Grasp', 'Sleep', 'Spider Climb', 'Unseen Servant', 'Ventriloquism', 'Color Spray', 'Grease',
  'Audible Glamer', 'Continual Light', 'Darkness', 'Detect Evil', 'Detect Invisibility', 'ESP',
  'Fools Gold', "Fool's Gold", 'Forget', 'Invisibility', 'Knock', 'Levitate', 'Locate Object',
  'Magic Mouth', 'Mirror Image', 'Phantasmal Force', 'Pyrotechnics', 'Ray of Enfeeblement', 'Rope Trick',
  'Scare', 'Shatter', 'Stinking Cloud', 'Web', 'Blink', 'Clairaudience', 'Clairvoyance', 'Dispel Magic',
  'Explosive Runes', 'Feign Death', 'Fireball', 'Flame Arrow', 'Fly', 'Gust of Wind', 'Haste',
  'Hold Person', 'Infravision', 'Lightning Bolt', 'Protection from Normal Missiles', 'Slow', 'Suggestion',
  'Tongues', 'Water Breathing', 'Wind Wall', 'Gaseous Form', 'Secret Page', 'Charm Monster', 'Confusion',
  'Dig', 'Dimension Door', 'Enchanted Weapon', 'Fear', 'Fire Charm', 'Fire Shield', 'Fire Trap', 'Fumble',
  'Hallucinatory Terrain', 'Ice Storm', 'Massmorph', 'Minor Globe of Invulnerability', 'Plant Growth',
  'Polymorph Other', 'Polymorph Self', 'Polymorph Any Object', 'Remove Curse', 'Wall of Fire', 'Wall of Ice',
  'Wizard Eye', 'Arcane Eye', "Rary's Mnemonic Enhancer", 'Animal Growth', 'Animate Dead', 'Cloudkill',
  'Cone of Cold', 'Conjure Elemental', 'Contact Other Plane', 'Feeblemind', 'Hold Monster', 'Magic Jar',
  'Passwall', 'Stone Shape', 'Telekinesis', 'Teleport', 'Transmute Rock to Mud', 'Wall of Force',
  'Wall of Iron', 'Wall of Stone', 'Interposing Hand', 'Antimagic Field', 'Anti-Magic Shell',
  'Control Weather', 'Death Spell', 'Disintegrate', 'Enchant an Item', 'Geas', 'Globe of Invulnerability',
  'Guards and Wards', 'Invisible Stalker', 'Legend Lore', 'Lower Water', 'Move Earth', 'Part Water',
  'Project Image', 'Reincarnate', 'Reincarnation', 'Repulsion', 'Stone to Flesh', 'Freezing Sphere',
  'Forceful Hand', 'Contingency', 'True Seeing', 'Mislead',
  // --- Clérigo ---
  'Bless', 'Command', 'Create Water', 'Cure Light Wounds', 'Purify Food and Drink', 'Remove Fear',
  'Resist Cold', 'Sanctuary', 'Augury', 'Chant', 'Detect Charm', 'Find Traps', 'Know Alignment',
  'Resist Fire', 'Silence', 'Slow Poison', 'Snake Charm', 'Speak with Animals', 'Spiritual Hammer',
  'Spiritual Weapon', 'Create Food and Water', 'Cure Blindness', 'Remove Blindness', 'Cure Disease',
  'Remove Disease', 'Glyph of Warding', 'Prayer', 'Speak with Dead', 'Cure Serious Wounds', 'Detect Lie',
  'Divination', 'Neutralize Poison', 'Speak with Plants', 'Sticks to Snakes', 'Atonement', 'Commune',
  'Cure Critical Wounds', 'Dispel Evil', 'Flame Strike', 'Insect Plague', 'Plane Shift', 'Quest',
  'Raise Dead', 'Aerial Servant', 'Animate Object', 'Blade Barrier', 'Conjure Animals', 'Find the Path',
  'Heal', 'Speak with Monsters', 'Stone Tell', 'Word of Recall', 'Restoration', 'Cloak of Bravery',
  // --- Druida ---
  'Detect Snares and Pits', 'Entangle', 'Faerie Fire', 'Invisibility to Animals', 'Locate Animals',
  'Pass Without Trace', 'Predict Weather', 'Shillelagh', 'Barkskin', 'Heat Metal', 'Obscuring Mist',
  'Produce Flame', 'Warp Wood', 'Call Lightning', 'Hold Animal', 'Protection from Fire', 'Snare',
  'Summon Insects', 'Tree Shape', 'Control Temperature', 'Hallucinatory Forest', 'Protection from Lightning',
  'Repel Insects', 'Anti-Plant Shell', 'Commune with Nature', 'Control Winds', 'Pass Plant',
  'Anti-Animal Shell', 'Fire Seeds', 'Transport via Plants', 'Turn Wood', 'Wall of Thorns',
  'Weather Summoning', 'Goodberry', 'Spike Growth', 'Spike Stones', 'Wind Walk',
  // --- Ilusionista ---
  'Change Self', 'Detect Illusion', 'Gaze Reflection', 'Hypnotism', 'Wall of Fog', 'Blindness', 'Blur',
  'Deafness', 'Fog Cloud', 'Hypnotic Pattern', 'Misdirection', 'Fascinate', 'Illusory Script',
  'Nondetection', 'Spectral Force', 'Improved Invisibility', 'Massmorph', 'Minor Creation', 'Major Creation',
  'Phantasmal Killer', 'Shadow Monsters', 'Demi-Shadow Monsters', 'Programmed Illusion', 'Shades',
  'Permanent Illusion', 'Mirage Arcana', 'True Sight', 'Veil',
  // --- Alias de renombres de Pathfinder para clásicos OSR ---
  'Enlarge Person', 'Reduce Person', 'Detect Thoughts', 'See Invisibility', 'Continual Flame',
  'Protection from Arrows', 'Resist Energy', 'Silence', 'Baleful Polymorph', 'Ray of Exhaustion',
  'Phantasmal Killer', 'Summon Monster I', 'Summon Monster II', 'Summon Monster III', 'Summon Nature\'s Ally I',
  'Beast Shape I', 'Elemental Body I', 'Hold Monster', 'Mount', 'Obscuring Mist', 'Acid Arrow',
  'Cause Fear', 'Command Undead', 'Ghoul Touch', 'Vampiric Touch', 'Bestow Curse', 'Deeper Darkness',
  'Daylight', 'Magic Circle against Evil', 'Dimensional Anchor', 'Scrying', 'Break Enchantment',
  'Overland Flight', 'Teleport', 'Contact Other Plane', 'Secret Chest', 'Wall of Thorns'
];
