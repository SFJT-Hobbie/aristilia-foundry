/**
 * Datos fuente de los compendios de Aristilia.
 * Armas y armaduras portadas de las tablas de RulesGearWeapons.jsx / RulesGearArmor.jsx.
 * Precios en piezas de plata (p). DE = Desgastado, BE = Buen Estado.
 * CA: valor menor = mejor armadura (se suma a la tirada Target20 del atacante).
 */

// name, proficiency(config key), ranged, [dmg, price, slots, range] para DE y BE
const W = (name, prof, ranged, de, be) => ({ name, prof, ranged, de, be });

export const WEAPONS = [
  W('Espada', 'Sword', false, ['1d4', 8, 1, ''], ['1d6', 15, 1, '']),
  W('Hacha', 'Axe', false, ['1d4', 5, 1, ''], ['1d6', 10, 1, '']),
  W('Maza', 'Mace', false, ['1d4', 10, 1, ''], ['1d6', 15, 1, '']),
  W('Bastón', 'Staff', false, ['1d4-1', 1, 2, ''], ['1d4', 3, 2, '']),
  W('Lanza', 'Spear', false, ['1d4', 3, 2, ''], ['1d6', 8, 2, '']),
  W('Daga', 'Dagger', false, ['1d4-1', 1, 1, ''], ['1d4', 5, 1, '']),
  W('Mayal', 'Flail', false, ['1d6', 12, 1, ''], ['1d8', 20, 1, '']),
  W('Martillo de Guerra', 'Warhammer', false, ['1d6', 10, 1, ''], ['1d8', 25, 1, '']),
  W('Espada a Dos Manos', 'Two-Handed Sword', false, ['1d8', 20, 2, ''], ['2d6', 50, 2, '']),
  W('Estrella Matutina', 'Morning Star', false, ['1d6', 15, 1, ''], ['1d8', 30, 1, '']),
  W('Guja', 'Glaive', false, ['1d6', 10, 2, ''], ['1d10', 25, 2, '']),
  W('Alabarda', 'Halberd', false, ['1d8', 15, 2, ''], ['1d10', 35, 2, '']),
  W('Bastón de Combate', 'Quarterstaff', false, ['1d4', 2, 2, ''], ['1d6', 5, 2, '']),
  W('Arco', 'Bow', true, ['1d4', 20, 2, '80 pies'], ['1d6', 40, 2, '150 pies']),
  W('Ballesta', 'Crossbow', true, ['1d6', 25, 2, '100 pies'], ['1d8', 50, 2, '120 pies']),
  W('Honda', 'Sling', true, ['1d4-1', 1, 1, '50 pies'], ['1d4', 2, 1, '80 pies']),
  W('Arco Corto', 'Shortbow', true, ['1d4', 15, 2, '60 pies'], ['1d6', 25, 2, '100 pies']),
  W('Ballesta de Mano', 'Hand Crossbow', true, ['1d4', 20, 1, '40 pies'], ['1d6', 40, 1, '60 pies']),
  W('Ballesta Ligera', 'Light Crossbow', true, ['1d6', 22, 2, '80 pies'], ['1d8', 35, 2, '100 pies']),
  W('Flechas', 'Bow', false, ['1d4', 1, 1, ''], ['1d6', 2, 1, '']),
  W('Virotes', 'Crossbow', false, ['1d6', 1, 1, ''], ['1d8', 3, 1, '']),
  W('Piedras', 'Sling', true, ['1d4-1', 0.1, 1, '50 pies'], ['1d4', 0.5, 1, '80 pies'])
];

// name, kind('armor'|'shield'), [ac, price, slots] para DE y BE
const A = (name, kind, de, be) => ({ name, kind, de, be });

export const ARMOR = [
  A('Cuero', 'armor', [9, 5, 2], [8, 20, 2]),
  A('Gambesón', 'armor', [9, 3, 2], [8, 10, 2]),
  A('Pieles', 'armor', [8, 8, 2], [7, 25, 2]),
  A('Cota de Malla', 'armor', [7, 50, 3], [6, 100, 3]),
  A('Cota de Escamas', 'armor', [6, 40, 3], [5, 80, 3]),
  A('Brigandina', 'armor', [6, 60, 3], [5, 120, 3]),
  A('Placa', 'armor', [5, 200, 4], [4, 400, 4]),
  A('Peto de Acero', 'armor', [5, 150, 4], [4, 300, 4]),
  A('Placa Completa', 'armor', [4, 300, 5], [3, 600, 5]),
  A('Escudo', 'shield', [-1, 10, 1], [-1, 20, 1]),
  A('Escudo Pesado', 'shield', [-2, 25, 2], [-2, 50, 2]),
  A('Rodela', 'shield', [-1, 5, 1], [-1, 15, 1])
];

/** Razas (RulesRaces*.jsx): bonos de atributo, HP, salvación, idiomas y rasgos especiales. */
export const RACES = [
  {
    key: 'human', name: 'Humano', abilityMods: '—', hpBonus: 1, saveBonus: 0, saveVs: '—',
    languages: 'Común (+1 adicional)', profSlots: '+2 adicionales',
    special: 'Adaptabilidad: +10% a la experiencia ganada. Longevidad — Joven (15–25): sin mod.; Adulto (26–50): +1 FUE, +1 CON; Anciano (51–80): +1 SAB, +1 INT, −1 FUE, −1 DES.'
  },
  {
    key: 'elf', name: 'Elfo', abilityMods: '+1 INT, +1 SAB, −1 FUE, −1 CON', hpBonus: 0, saveBonus: 2,
    saveVs: 'Encanto, miedo y sueño', languages: 'Común, Élfico (+1 adicional)', profSlots: '+1 adicional',
    special: 'Visión Élfica: ven de noche en bosques/claros/planicies como de día; en entornos naturales identifican propiedades de la flora. Longevidad — Adulto: +1 INT, +1 SAB; Anciano: +1 INT, +2 SAB.'
  },
  {
    key: 'dwarf', name: 'Enano', abilityMods: '+1 FUE, +1 CON, −2 CAR', hpBonus: 2, saveBonus: 2,
    saveVs: 'Magia', languages: 'Común, Enano (+1 adicional)', profSlots: '+1 adicional',
    special: 'Visión Enana: ven en cavernas/construcciones subterráneas en escala de grises; metales y gemas brillan ante sus ojos. Longevidad — Adulto: +1 CON, +1 FUE; Anciano: +1 CON, +1 FUE, +1 SAB.'
  },
  {
    key: 'halfling', name: 'Mediano', abilityMods: '+1 DES, +1 CAR, −1 FUE, −1 CON', hpBonus: 0, saveBonus: 0,
    saveVs: '—', languages: 'Común, Mediano', profSlots: '+1 adicional',
    special: 'Pies Ligeros: +10 pies de movimiento cerrado y +40 abierto; +1 CA permanente; pueden montar perros o cerdos. Mente Pura: los ancianos no malvados pueden elegir Saber Velado.'
  },
  {
    key: 'beastmen', name: 'Hombre Bestia', abilityMods: '+1 CON, +1 DES, −1 INT, −1 CAR', hpBonus: 2, saveBonus: 2,
    saveVs: 'Veneno y Enfermedades', languages: 'Común, Bestial', profSlots: '+2 adicionales',
    special: 'Voracidad: pueden consumir cadáveres, raciones en mal estado, agua contaminada y fauna/flora venenosa (sufriendo levemente sus efectos). Habla Bestial: se comunican con animales de su familia de especie.'
  },
  {
    key: 'verdant', name: 'Verdante', abilityMods: '+1 CON, +1 SAB, −1 FUE, −1 DES', hpBonus: 2, saveBonus: 2,
    saveVs: 'Veneno y Desplazamiento', languages: 'Común, Silvano (+1 adicional)', profSlots: '+1 adicional',
    special: 'Fotosíntesis: pueden alimentarse mientras descansan según su flora base, en superficie o subterráneo; totalmente inmóviles son indistinguibles de su contraparte vegetal.'
  }
];

/** Clases (RulesClasses*.jsx): dado de golpe, ranuras, salvación, bono al golpear y progresión. */
export const CLASSES = [
  {
    key: 'fighter', name: 'Guerrero', hitDie: 'd10', weaponSlots: 4, nonWeaponSlots: 3,
    baseSave: 6, saveVs: 'Veneno, Enfermedades, Desplazamiento y Agotamiento', hitBonus: '+1 por cada nivel en la clase',
    special: 'Salvada base +6 (+1 por cada 2 niveles). Bono de salvación +2. XP para ascenso: 1→2k, 2→4k, 3→8k, 4→16k, 5→32k (se duplica por nivel). % Bonus de XP: FUE·5.'
  },
  {
    key: 'magicUser', name: 'Usuario de Magia', hitDie: 'd4', weaponSlots: 1, nonWeaponSlots: 3,
    baseSave: 4, saveVs: 'Magia', hitBonus: '+1 por cada 3 niveles en la clase',
    special: 'Salvada base +4 (+1 por cada 2 niveles). Espacios de hechizo por nivel: 1→1, 2→2, 3→3|1… XP para ascenso: 1→2.5k, 2→5k, 3→10k… % Bonus de XP: INT·5.'
  },
  {
    key: 'specialist', name: 'Especialista', hitDie: 'd6', weaponSlots: 2, nonWeaponSlots: 5,
    baseSave: 5, saveVs: 'Trampas y Peligros Naturales', hitBonus: '+1 por cada 2 niveles en la clase',
    special: 'Salvada base +5 (+1 por cada 2 niveles). Bono de salvación +2. XP para ascenso: 1→1.25k, 2→2.5k, 3→5k, 4→10k, 5→20k.'
  },
  {
    key: 'multiclass', name: 'Multiclase', hitDie: '—', weaponSlots: 0, nonWeaponSlots: 0,
    baseSave: 0, saveVs: '—', hitBonus: 'El más alto entre las clases',
    special: 'Elige dos o más clases al crearse. Ranuras de competencia: sólo las de la clase con más. XP dividida equitativamente antes de aplicar % por clase. Al subir de nivel tira los HD de cada clase y toma el más alto. Usa la mejor salvación y el mejor bono al golpear; obtén las habilidades de todas las clases.'
  }
];

/**
 * Semilla de hechizos. Las reglas del repo documentan la ESTRUCTURA de un hechizo
 * con un ejemplo canónico por escuela (no una lista completa), así que estos son
 * ejemplos listos para ampliar.
 */
export const SPELLS = [
  {
    name: 'Protección contra el Mal (Protection from Evil)',
    school: 'astral',
    level: 1,
    cost: '1 ranura',
    castingTime: '1 acción',
    range: 'Personal',
    duration: '2 turnos',
    description: 'Crea una barrera astral que repele a las criaturas malignas y otorga bonificaciones defensivas contra sus ataques. Ejemplo canónico de la Magia Astral.'
  },
  {
    name: 'Enredar (Entangle)',
    school: 'natural',
    level: 1,
    cost: '1d6 maná (10 puntos)',
    castingTime: '1 acción',
    range: 'Medio',
    duration: '1 turno',
    description: 'La vegetación cobra vida y aferra a los enemigos en un área, inmovilizándolos. Ejemplo canónico de la Magia Natural.'
  },
  {
    name: 'Encender · Fuego (Ignite · Fire)',
    school: 'voiceForm',
    level: 1,
    cost: 'Catalizador inflamable',
    castingTime: 'Minutos',
    range: 'Toque',
    duration: 'Instantáneo',
    description: 'Voz «Ignite» (verbo: combustión) inscrita sobre la Forma «Fire» (runa de material inflamable): inicia una llama sobre un objetivo mundano. Ejemplo canónico de la Magia de Voz y Forma.'
  }
];
