/**
 * Datos de las tablas de tesoro (canon B/X + subtablas de objetos mágicos B/X).
 * Transcritos de los CSV fuente (treasure_csv/*). Los rangos son [lo, hi] sobre
 * el dado indicado ("00" = 100). Consumido por tools/build-packs.mjs para generar
 * las macros del compendio de tesoro (packs/treasure).
 *
 * Estructura:
 *   types   -> tipos de tesoro B/X A–V: cada letra es una lista de componentes
 *              { chance:%, amount:"texto de cantidad" } (Individual/Group = 100%).
 *   sub     -> subtablas d% de objetos mágicos { potions, rings, rods, scrolls,
 *              swords, weapons, armour, misc } como [ {lo,hi,item} ].
 *   gems         -> valor de gema por d20 [ {lo,hi,value(gp)} ].
 *   magicItemType-> categoría de objeto mágico por d% (columna Expert) [ {lo,hi,type} ].
 *   magicArmour  -> tipo de armadura mágica por d8 [ {lo,hi,type} ].
 *   scrollSpell  -> nivel de conjuro de pergamino por d% [ {lo,hi,arcane,divine} ].
 *   maps         -> contenido señalado por cada mapa (I–XII).
 *   jewelleryFormula -> cada joya vale 3d6×100 gp.
 */

export const TREASURE = {
  jewelleryFormula: '3d6*100',

  types: {
    A: [
      { chance: 25, amount: '1d6×1,000 cp' }, { chance: 30, amount: '1d6×1,000 sp' },
      { chance: 20, amount: '1d4×1,000 ep' }, { chance: 35, amount: '2d6×1,000 gp' },
      { chance: 25, amount: '1d2×1,000 pp' }, { chance: 50, amount: '6d6 gems' },
      { chance: 50, amount: '6d6 jewellery' }, { chance: 30, amount: '3 magic items' }
    ],
    B: [
      { chance: 50, amount: '1d8×1,000 cp' }, { chance: 25, amount: '1d6×1,000 sp' },
      { chance: 25, amount: '1d4×1,000 ep' }, { chance: 25, amount: '1d3×1,000 gp' },
      { chance: 25, amount: '1d6 gems' }, { chance: 25, amount: '1d6 jewellery' },
      { chance: 10, amount: '1 magic sword, armour, or weapon' }
    ],
    C: [
      { chance: 20, amount: '1d12×1,000 cp' }, { chance: 30, amount: '1d4×1,000 sp' },
      { chance: 10, amount: '1d4×1,000 ep' }, { chance: 25, amount: '1d4 gems' },
      { chance: 25, amount: '1d4 jewellery' }, { chance: 10, amount: '2 magic items' }
    ],
    D: [
      { chance: 10, amount: '1d8×1,000 cp' }, { chance: 15, amount: '1d12×1,000 sp' },
      { chance: 60, amount: '1d6×1,000 gp' }, { chance: 30, amount: '1d8 gems' },
      { chance: 30, amount: '1d8 jewellery' }, { chance: 15, amount: '2 magic items + 1 potion' }
    ],
    E: [
      { chance: 5, amount: '1d10×1,000 cp' }, { chance: 30, amount: '1d12×1,000 sp' },
      { chance: 25, amount: '1d4×1,000 ep' }, { chance: 25, amount: '1d8×1,000 gp' },
      { chance: 10, amount: '1d10 gems' }, { chance: 10, amount: '1d10 jewellery' },
      { chance: 25, amount: '3 magic items + 1 scroll' }
    ],
    F: [
      { chance: 10, amount: '2d10×1,000 sp' }, { chance: 20, amount: '1d8×1,000 ep' },
      { chance: 45, amount: '1d12×1,000 gp' }, { chance: 30, amount: '1d3×1,000 pp' },
      { chance: 20, amount: '2d12 gems' }, { chance: 10, amount: '1d12 jewellery' },
      { chance: 30, amount: '3 magic items (not weapons) + 1 potion + 1 scroll' }
    ],
    G: [
      { chance: 50, amount: '1d4×10,000 gp' }, { chance: 50, amount: '1d6×1,000 pp' },
      { chance: 25, amount: '3d6 gems' }, { chance: 25, amount: '1d10 jewellery' },
      { chance: 35, amount: '4 magic items + 1 scroll' }
    ],
    H: [
      { chance: 25, amount: '3d8×1,000 cp' }, { chance: 50, amount: '1d100×1,000 sp' },
      { chance: 50, amount: '1d4×10,000 ep' }, { chance: 50, amount: '1d6×10,000 gp' },
      { chance: 25, amount: '5d4×1,000 pp' }, { chance: 50, amount: '1d100 gems' },
      { chance: 50, amount: '1d4×10 jewellery' }, { chance: 15, amount: '4 magic items + 1 potion + 1 scroll' }
    ],
    I: [
      { chance: 30, amount: '1d8×1,000 pp' }, { chance: 50, amount: '2d6 gems' },
      { chance: 50, amount: '2d6 jewellery' }, { chance: 15, amount: '1 magic item' }
    ],
    J: [ { chance: 25, amount: '1d4×1,000 cp' }, { chance: 10, amount: '1d3×1,000 sp' } ],
    K: [ { chance: 30, amount: '1d6×1,000 sp' }, { chance: 10, amount: '1d2×1,000 ep' } ],
    L: [ { chance: 50, amount: '1d4 gems' } ],
    M: [
      { chance: 40, amount: '2d4×1,000 gp' }, { chance: 50, amount: '5d6×1,000 pp' },
      { chance: 55, amount: '5d4 gems' }, { chance: 45, amount: '2d6 jewellery' }
    ],
    N: [ { chance: 40, amount: '2d4 potions' } ],
    O: [ { chance: 50, amount: '1d4 scrolls' } ],
    P: [ { chance: 100, amount: '3d8 cp' } ],
    Q: [ { chance: 100, amount: '3d6 sp' } ],
    R: [ { chance: 100, amount: '2d6 ep' } ],
    S: [ { chance: 100, amount: '2d4 gp' } ],
    T: [ { chance: 100, amount: '1d6 pp' } ],
    U: [
      { chance: 10, amount: '1d100 cp' }, { chance: 10, amount: '1d100 sp' },
      { chance: 5, amount: '1d100 gp' }, { chance: 5, amount: '1d4 gems' },
      { chance: 5, amount: '1d4 jewellery' }, { chance: 2, amount: '1 magic item' }
    ],
    V: [
      { chance: 10, amount: '1d100 sp' }, { chance: 5, amount: '1d100 ep' },
      { chance: 10, amount: '1d100 gp' }, { chance: 5, amount: '1d100 pp' },
      { chance: 10, amount: '1d4 gems' }, { chance: 10, amount: '1d4 jewellery' },
      { chance: 5, amount: '1 magic item' }
    ]
  },

  gems: [
    { lo: 1, hi: 4, value: 10 }, { lo: 5, hi: 9, value: 50 }, { lo: 10, hi: 15, value: 100 },
    { lo: 16, hi: 19, value: 500 }, { lo: 20, hi: 20, value: 1000 }
  ],

  magicItemType: [
    { lo: 1, hi: 10, type: 'Armour or Shield' }, { lo: 11, hi: 15, type: 'Miscellaneous Item' },
    { lo: 16, hi: 35, type: 'Potion' }, { lo: 36, hi: 40, type: 'Ring' },
    { lo: 41, hi: 45, type: 'Rod / Staff / Wand' }, { lo: 46, hi: 75, type: 'Scroll or Map' },
    { lo: 76, hi: 95, type: 'Sword' }, { lo: 96, hi: 100, type: 'Weapon' }
  ],

  magicArmour: [
    { lo: 1, hi: 2, type: 'Leather' }, { lo: 3, hi: 6, type: 'Chainmail' }, { lo: 7, hi: 8, type: 'Plate mail' }
  ],

  scrollSpell: [
    { lo: 1, hi: 25, arcane: '1st', divine: '1st' }, { lo: 26, hi: 50, arcane: '2nd', divine: '2nd' },
    { lo: 51, hi: 70, arcane: '3rd', divine: '3rd' }, { lo: 71, hi: 85, arcane: '4th', divine: '4th' },
    { lo: 86, hi: 95, arcane: '5th', divine: '5th' }, { lo: 96, hi: 100, arcane: '6th', divine: '5th' }
  ],

  maps: {
    I: '1 magic item',
    II: '1d6×10 gems and 2d10 jewellery',
    III: '2 magic items',
    IV: '3 magic items (no swords)',
    V: '3 magic items and 1 potion',
    VI: '3 magic items, 1 scroll, 1 potion',
    VII: '5d6 gems and 2 magic items',
    VIII: 'Hoard 1d4×1,000 gp',
    IX: 'Hoard 5d6×1,000 gp',
    X: 'Hoard 5d6×1,000 gp + 1 magic item',
    XI: 'Hoard 5d6×1,000 gp + 5d6 gems',
    XII: 'Hoard 6d6×1,000 gp'
  },

  sub: {
    potions: [
      { lo: 1, hi: 3, item: 'Clarialudición (Clairaudience)' }, { lo: 4, hi: 7, item: 'Clarividencia' },
      { lo: 8, hi: 10, item: 'Control Animal' }, { lo: 11, hi: 13, item: 'Control de Dragones' },
      { lo: 14, hi: 16, item: 'Control de Gigantes' }, { lo: 17, hi: 19, item: 'Control Humano' },
      { lo: 20, hi: 22, item: 'Control de Plantas' }, { lo: 23, hi: 25, item: 'Control de No-muertos' },
      { lo: 26, hi: 32, item: 'Ilusión (Delusion)' }, { lo: 33, hi: 35, item: 'Disminución' },
      { lo: 36, hi: 39, item: 'PES (ESP)' }, { lo: 40, hi: 43, item: 'Resistencia al Fuego' },
      { lo: 44, hi: 47, item: 'Vuelo' }, { lo: 48, hi: 51, item: 'Forma Gaseosa' },
      { lo: 52, hi: 55, item: 'Fuerza de Gigante' }, { lo: 56, hi: 59, item: 'Crecimiento' },
      { lo: 60, hi: 63, item: 'Curación' }, { lo: 64, hi: 68, item: 'Heroísmo' },
      { lo: 69, hi: 72, item: 'Invisibilidad' }, { lo: 73, hi: 76, item: 'Invulnerabilidad' },
      { lo: 77, hi: 80, item: 'Levitación' }, { lo: 81, hi: 84, item: 'Longevidad' },
      { lo: 85, hi: 86, item: 'Veneno' }, { lo: 87, hi: 89, item: 'Autopolimorfia' },
      { lo: 90, hi: 97, item: 'Velocidad' }, { lo: 98, hi: 100, item: 'Detección de Tesoros' }
    ],
    rings: [
      { lo: 1, hi: 5, item: 'Control de Animales' }, { lo: 6, hi: 10, item: 'Control de Humanos' },
      { lo: 11, hi: 16, item: 'Control de Plantas' }, { lo: 17, hi: 26, item: 'Ilusión (Delusion)' },
      { lo: 27, hi: 29, item: 'Invocación de Djinni' }, { lo: 30, hi: 39, item: 'Resistencia al Fuego' },
      { lo: 40, hi: 50, item: 'Invisibilidad' }, { lo: 51, hi: 55, item: 'Protección +1, radio 1,5 m' },
      { lo: 56, hi: 70, item: 'Protección +1' }, { lo: 71, hi: 72, item: 'Regeneración' },
      { lo: 73, hi: 74, item: 'Almacenar Conjuros' }, { lo: 75, hi: 80, item: 'Reflejo de Conjuros' },
      { lo: 81, hi: 82, item: 'Telequinesis' }, { lo: 83, hi: 88, item: 'Caminar sobre el Agua' },
      { lo: 89, hi: 94, item: 'Debilidad (maldito)' }, { lo: 95, hi: 96, item: 'Deseos (1–2)' },
      { lo: 97, hi: 97, item: 'Deseos (1–3)' }, { lo: 98, hi: 98, item: 'Deseos (2–4)' },
      { lo: 99, hi: 100, item: 'Visión de Rayos X' }
    ],
    rods: [
      { lo: 1, hi: 8, item: 'Vara de Cancelación' }, { lo: 9, hi: 11, item: 'Bastón de Mando' },
      { lo: 12, hi: 21, item: 'Bastón de Curación' }, { lo: 22, hi: 23, item: 'Bastón de Poder' },
      { lo: 24, hi: 28, item: 'Bastón de Serpientes' }, { lo: 29, hi: 31, item: 'Bastón de Golpear' },
      { lo: 32, hi: 34, item: 'Bastón de Marchitar' }, { lo: 35, hi: 35, item: 'Bastón de Hechicería' },
      { lo: 36, hi: 40, item: 'Varita de Frío' }, { lo: 41, hi: 45, item: 'Varita de Detección de Enemigos' },
      { lo: 46, hi: 50, item: 'Varita de Miedo' }, { lo: 51, hi: 55, item: 'Varita de Bolas de Fuego' },
      { lo: 56, hi: 60, item: 'Varita de Ilusión' }, { lo: 61, hi: 65, item: 'Varita de Relámpagos' },
      { lo: 66, hi: 70, item: 'Varita de Detección de Magia' }, { lo: 71, hi: 75, item: 'Varita de Detección de Metales' },
      { lo: 76, hi: 80, item: 'Varita de Negación' }, { lo: 81, hi: 85, item: 'Varita de Parálisis' },
      { lo: 86, hi: 90, item: 'Varita de Polimorfia' }, { lo: 91, hi: 95, item: 'Varita de Detección de Puertas Secretas' },
      { lo: 96, hi: 100, item: 'Varita de Detección de Trampas' }
    ],
    scrolls: [
      { lo: 1, hi: 15, item: '1 Conjuro' }, { lo: 16, hi: 25, item: '2 Conjuros' },
      { lo: 26, hi: 31, item: '3 Conjuros' }, { lo: 32, hi: 34, item: '5 Conjuros' },
      { lo: 35, hi: 35, item: '7 Conjuros' }, { lo: 36, hi: 40, item: 'Pergamino Maldito' },
      { lo: 41, hi: 50, item: 'Protección contra Elementales' }, { lo: 51, hi: 60, item: 'Protección contra Licántropos' },
      { lo: 61, hi: 65, item: 'Protección contra Magia' }, { lo: 66, hi: 75, item: 'Protección contra No-muertos' },
      { lo: 76, hi: 78, item: 'Mapa del Tesoro: I' }, { lo: 79, hi: 80, item: 'Mapa del Tesoro: II' },
      { lo: 81, hi: 82, item: 'Mapa del Tesoro: III' }, { lo: 83, hi: 83, item: 'Mapa del Tesoro: IV' },
      { lo: 84, hi: 84, item: 'Mapa del Tesoro: V' }, { lo: 85, hi: 85, item: 'Mapa del Tesoro: VI' },
      { lo: 86, hi: 86, item: 'Mapa del Tesoro: VII' }, { lo: 87, hi: 90, item: 'Mapa del Tesoro: VIII' },
      { lo: 91, hi: 95, item: 'Mapa del Tesoro: IX' }, { lo: 96, hi: 96, item: 'Mapa del Tesoro: X' },
      { lo: 97, hi: 98, item: 'Mapa del Tesoro: XI' }, { lo: 99, hi: 100, item: 'Mapa del Tesoro: XII' }
    ],
    swords: [
      { lo: 1, hi: 2, item: 'Espada −1, Maldita' }, { lo: 3, hi: 4, item: 'Espada −2, Maldita' },
      { lo: 5, hi: 44, item: 'Espada +1' }, { lo: 45, hi: 50, item: 'Espada +1, +2 vs Licántropos' },
      { lo: 51, hi: 56, item: 'Espada +1, +2 vs Usuarios de Conjuros' }, { lo: 57, hi: 61, item: 'Espada +1, +3 vs Dragones' },
      { lo: 62, hi: 66, item: 'Espada +1, +3 vs Criaturas Encantadas' }, { lo: 67, hi: 71, item: 'Espada +1, +3 vs Criaturas Regenerativas' },
      { lo: 72, hi: 76, item: 'Espada +1, +3 vs No-muertos' }, { lo: 77, hi: 77, item: 'Espada +1, Drena Energía' },
      { lo: 78, hi: 81, item: 'Espada +1, Flamígera' }, { lo: 82, hi: 89, item: 'Espada +1, Luz' },
      { lo: 90, hi: 92, item: 'Espada +1, Localizar Objetos' }, { lo: 93, hi: 93, item: 'Espada +1, Deseos' },
      { lo: 94, hi: 96, item: 'Espada +2' }, { lo: 97, hi: 98, item: 'Espada +2, Hechizar Persona' },
      { lo: 99, hi: 100, item: 'Espada +3' }
    ],
    weapons: [
      { lo: 1, hi: 2, item: 'Flechas +1 (3d10)' }, { lo: 3, hi: 12, item: 'Flechas +1 (10 / 2d6)' },
      { lo: 13, hi: 18, item: 'Flechas +2 (1d6)' }, { lo: 19, hi: 27, item: 'Hacha +1' },
      { lo: 28, hi: 30, item: 'Hacha +2' }, { lo: 31, hi: 33, item: 'Arco +1' },
      { lo: 34, hi: 43, item: 'Virotes de Ballesta +1 (2d6)' }, { lo: 44, hi: 45, item: 'Virotes de Ballesta +1 (3d10)' },
      { lo: 46, hi: 52, item: 'Virotes de Ballesta +2 (1d6)' }, { lo: 53, hi: 55, item: 'Daga +1' },
      { lo: 56, hi: 56, item: 'Daga +2, +3 vs orcos/goblins/kobolds' }, { lo: 57, hi: 64, item: 'Maza +1' },
      { lo: 65, hi: 67, item: 'Maza +2' }, { lo: 68, hi: 68, item: 'Maza +3' },
      { lo: 69, hi: 74, item: 'Honda +1' }, { lo: 75, hi: 82, item: 'Lanza +1' },
      { lo: 83, hi: 86, item: 'Lanza +2' }, { lo: 87, hi: 87, item: 'Lanza +3' },
      { lo: 88, hi: 94, item: 'Martillo de Guerra +1' }, { lo: 95, hi: 99, item: 'Martillo de Guerra +2' },
      { lo: 100, hi: 100, item: 'Martillo de Guerra +3, Lanzador Enano' }
    ],
    armour: [
      { lo: 1, hi: 15, item: 'Armadura +1' }, { lo: 16, hi: 25, item: 'Armadura +1, Escudo +1' },
      { lo: 26, hi: 27, item: 'Armadura +1, Escudo +2' }, { lo: 28, hi: 28, item: 'Armadura +1, Escudo +3' },
      { lo: 29, hi: 33, item: 'Armadura +2' }, { lo: 34, hi: 36, item: 'Armadura +2, Escudo +1' },
      { lo: 37, hi: 41, item: 'Armadura +2, Escudo +2' }, { lo: 42, hi: 42, item: 'Armadura +2, Escudo +3' },
      { lo: 43, hi: 45, item: 'Armadura +3' }, { lo: 46, hi: 46, item: 'Armadura +3, Escudo +1' },
      { lo: 47, hi: 47, item: 'Armadura +3, Escudo +2' }, { lo: 48, hi: 48, item: 'Armadura +3, Escudo +3' },
      { lo: 49, hi: 51, item: 'Armadura Maldita −1' }, { lo: 52, hi: 53, item: 'Armadura Maldita −2' },
      { lo: 54, hi: 54, item: 'Armadura Maldita −2 con Escudo +1' }, { lo: 55, hi: 56, item: 'Armadura Maldita, CA 9 [10]' },
      { lo: 57, hi: 62, item: 'Escudo Maldito −2' }, { lo: 63, hi: 65, item: 'Escudo Maldito, CA 9 [10]' },
      { lo: 66, hi: 85, item: 'Escudo +1' }, { lo: 86, hi: 95, item: 'Escudo +2' },
      { lo: 96, hi: 100, item: 'Escudo +3' }
    ],
    misc: [
      { lo: 1, hi: 3, item: 'Amuleto de Protección contra Videncia' }, { lo: 4, hi: 5, item: 'Bolsa Devoradora' },
      { lo: 6, hi: 11, item: 'Bolsa de Contención' }, { lo: 12, hi: 16, item: 'Botas de Levitación' },
      { lo: 17, hi: 21, item: 'Botas de Velocidad' }, { lo: 22, hi: 26, item: 'Botas de Viaje y Salto' },
      { lo: 27, hi: 31, item: 'Escoba Voladora' }, { lo: 32, hi: 35, item: 'Bola de Cristal' },
      { lo: 36, hi: 37, item: 'Bola de Cristal con Clarialudición' }, { lo: 38, hi: 38, item: 'Bola de Cristal con PES' },
      { lo: 39, hi: 40, item: 'Capa de Desplazamiento' }, { lo: 41, hi: 41, item: 'Tambores del Pánico' },
      { lo: 42, hi: 42, item: 'Botella del Efreeti' }, { lo: 43, hi: 43, item: 'Dispositivo de Invocación Elemental: Aire' },
      { lo: 44, hi: 44, item: 'Dispositivo de Invocación Elemental: Tierra' }, { lo: 45, hi: 45, item: 'Dispositivo de Invocación Elemental: Fuego' },
      { lo: 46, hi: 46, item: 'Dispositivo de Invocación Elemental: Agua' }, { lo: 47, hi: 56, item: 'Capa y Botas Élficas' },
      { lo: 57, hi: 57, item: 'Alfombra Voladora' }, { lo: 58, hi: 64, item: 'Guanteletes de Fuerza de Ogro' },
      { lo: 65, hi: 66, item: 'Cinturón de Fuerza de Gigante' }, { lo: 67, hi: 77, item: 'Yelmo de Cambio de Alineamiento' },
      { lo: 78, hi: 82, item: 'Yelmo de Leer Idiomas y Magia' }, { lo: 83, hi: 83, item: 'Yelmo de Telepatía' },
      { lo: 84, hi: 84, item: 'Yelmo de Teletransporte' }, { lo: 85, hi: 85, item: 'Cuerno de Estruendo' },
      { lo: 86, hi: 90, item: 'Medallón de PES 9 m' }, { lo: 91, hi: 93, item: 'Medallón de PES 27 m' },
      { lo: 94, hi: 94, item: 'Espejo de Atrapar Vida' }, { lo: 95, hi: 97, item: 'Cuerda de Trepar' },
      { lo: 98, hi: 100, item: 'Escarabajo de Protección' }
    ]
  }
};
