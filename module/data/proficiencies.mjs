/**
 * Catálogo de competencias sin arma (non-weapon proficiencies) de Aristilia.
 * Portado desde src/pages/nonWeaponProficienciesData.js de la web-app de reglas.
 * Se usa para poblar el compendio de competencias y las opciones de la ficha.
 */

export const difficultyLevels = {
  Simple: { successesNeeded: 2, trainingTime: '1 semana', trainingCost: 10 },
  Moderate: { successesNeeded: 3, trainingTime: '2 semanas', trainingCost: 25 },
  Complex: { successesNeeded: 4, trainingTime: '1 mes', trainingCost: 50 },
  Rare: { successesNeeded: 5, trainingTime: '2 meses', trainingCost: 100 },
  Special: { successesNeeded: 5, trainingTime: 'Especial', trainingCost: 0 }
};

const magicRestriction = 'Sólo Usuarios de Magia; no competente: Atributo * 3, competente: 0. Tira para aprender hechizos, lanza vía ranuras.';
const naturalMagicRestriction = 'No competente: Atributo * 2; competente: tira Sab * 5%, 1d6 maná, 10 puntos para lanzar.';
const voiceAndFormRestriction = 'No competente: Atributo * 2; competente: tira Sab * 5%, toma de minutos a horas.';

export const nonWeaponProficiencyOptions = {
  'Wilderness Exploration Skills': {
    Strength: {
      Climbing: { slots: 1, description: 'Escala acantilados desmoronados o troncos nudosos, desafiando la oscuridad abismal.', difficulty: difficultyLevels.Simple }
    },
    Dexterity: {
      Firecraft: { slots: 1, description: 'Arranca llamas fugaces de la humedad podrida o ramas escasas en un páramo salvaje.', difficulty: difficultyLevels.Simple }
    },
    Constitution: {
      SurvivalWilderness: { slots: 2, description: 'Soporta el cruel abrazo de lo salvaje, arañando refugio de una tierra ansiosa de matar.', difficulty: difficultyLevels.Complex },
      EndureElements: { slots: 1, description: 'Resiste vendavales aullantes o calor abrasador en un mundo sin piedad.', difficulty: difficultyLevels.Simple },
      AltitudeAdaptation: { slots: 1, description: 'Respira aire fino y helado en cumbres dentadas, donde hasta la esperanza se adelgaza.', difficulty: difficultyLevels.Moderate }
    },
    Intelligence: {
      Trailblazing: { slots: 1, description: 'Abre senderos entre la decadencia enmarañada, dejando marcas tragadas por el tiempo.', difficulty: difficultyLevels.Moderate },
      NavigationSurface: { slots: 1, description: 'Halla el rumbo bajo un cielo hueco, guiado por estrellas apagadas o piedra rota.', difficulty: difficultyLevels.Moderate },
      Herbalism: { slots: 2, description: 'Cosecha raíces retorcidas para ungüentos o venenos de una tierra marchita.', difficulty: difficultyLevels.Complex }
    },
    Wisdom: {
      Foraging: { slots: 1, description: 'Rebusca hierbas amargas o presa flaca en un yermo que mata a los suyos.', difficulty: difficultyLevels.Simple },
      Tracking: { slots: 2, description: 'Sigue tenues rastros de sangre o pisada, cazando por una extensión maldita.', difficulty: difficultyLevels.Complex },
      WeatherSense: { slots: 1, description: 'Lee los presagios sombríos del cielo —tormentas o escarcha— para prepararte.', difficulty: difficultyLevels.Moderate }
    },
    Charisma: {
      AnimalHandling: { slots: 1, description: 'Doma bestias feroces o mulas cansadas, atándolas a tu senda condenada.', difficulty: difficultyLevels.Moderate }
    }
  },
  'Dungeon Exploration Skills': {
    Dexterity: {
      TrapDetection: { slots: 1, description: 'Detecta trampas oxidadas o cuchillas ocultas al acecho en la penumbra del calabozo.', difficulty: difficultyLevels.Moderate },
      Caving: { slots: 1, description: 'Repta por abismos dentados, donde la piedra muerde y la oscuridad traga.', difficulty: difficultyLevels.Moderate }
    },
    Constitution: {
      SurvivalUnderground: { slots: 2, description: 'Prospera en profundidades angostas y sin aire, arrancando vida de la roca y la podredumbre.', difficulty: difficultyLevels.Complex }
    },
    Intelligence: {
      NavigationUnderground: { slots: 1, description: 'Enhebra criptas y cuevas retorcidas, donde los hitos se deshacen en polvo.', difficulty: difficultyLevels.Moderate },
      Stonecraft: { slots: 1, description: 'Lee los huesos del calabozo en busca de secretos o derrumbes.', difficulty: difficultyLevels.Moderate },
      LightManagement: { slots: 1, description: 'Estira llamas moribundas o chispas tenues para perforar la noche del calabozo.', difficulty: difficultyLevels.Simple },
      Mapping: { slots: 1, description: 'Garabatea mapas toscos en jirones, frágil escudo contra el olvido.', difficulty: difficultyLevels.Moderate }
    },
    Wisdom: {
      DungeonHearing: { slots: 1, description: 'Oye los susurros del calabozo —garras lejanas o goteo funesto— en el silencio.', difficulty: difficultyLevels.Moderate },
      HazardSense: { slots: 2, description: 'Percibe lo invisible —muros que se mueven o emboscadas— en un mundo traidor.', difficulty: difficultyLevels.Complex },
      DungeonHazards: { slots: 1, description: 'Conoce los crueles regalos de la cripta —gas o inundaciones— y evita su garra.', difficulty: difficultyLevels.Moderate }
    }
  },
  'Physical & Movement Skills': {
    Strength: {
      Swimming: { slots: 1, description: 'Lucha contra mareas turbias o tumbas inundadas, donde los ahogados tienen hambre.', difficulty: difficultyLevels.Simple },
      Athletics: { slots: 1, description: 'Salta grietas o carga escombros, desafiando una tierra que ansía tu caída.', difficulty: difficultyLevels.Simple }
    },
    Dexterity: {
      Riding: { slots: 1, description: 'Domina monturas esqueléticas o bestias cansadas por un reino de ceniza y ruina.', difficulty: difficultyLevels.Moderate },
      Stealth: { slots: 2, description: 'Fúndete en sombra o maleza, invisible para lo hueco y lo maldito.', difficulty: difficultyLevels.Moderate }
    },
    Constitution: {
      Endurance: { slots: 2, description: 'Sobrevive marchas interminables por lodazal y ruina, sin doblegarte ante la desesperación.', difficulty: difficultyLevels.Complex }
    }
  },
  'Crafting & Trade Skills': {
    Strength: {
      Metalworking: { slots: 2, description: 'Forja acero dentado de óxido y fuego, un baluarte contra la oscuridad.', difficulty: difficultyLevels.Complex },
      Boating: { slots: 1, description: 'Rema embarcaciones frágiles por aguas negras, huyendo de orillas desesperadas.', difficulty: difficultyLevels.Moderate }
    },
    Dexterity: {
      Carpentry: { slots: 1, description: 'Martillea madera astillada en refugios fugaces en medio de un mundo que se derrumba.', difficulty: difficultyLevels.Moderate },
      Leatherworking: { slots: 1, description: 'Cose pieles harapientas en equipo, desolladas de los muertos silenciosos.', difficulty: difficultyLevels.Moderate },
      RopeUse: { slots: 1, description: 'Anuda cuerdas deshilachadas en cuerdas de vida, un hilo contra el abismo.', difficulty: difficultyLevels.Simple }
    },
    Intelligence: {
      WeaponRepair: { slots: 1, description: 'Repara hojas melladas o astas dobladas, demorando su ruina final.', difficulty: difficultyLevels.Moderate },
      Engineering: { slots: 2, description: 'Crea máquinas toscas o repara reliquias, doblegándolas a un propósito sombrío.', difficulty: difficultyLevels.Rare }
    },
    Wisdom: {
      Cooking: { slots: 1, description: 'Convierte restos fétidos en comidas magras, apaciguando el mordisco del hambre.', difficulty: difficultyLevels.Simple },
      Scavenging: { slots: 1, description: 'Arranca herramientas oxidadas o restos de los huesos, la cosecha sombría de un carroñero.', difficulty: difficultyLevels.Simple }
    }
  },
  'Social & Interaction Skills': {
    Intelligence: {
      Signaling: { slots: 1, description: 'Envía gritos tenues o destellos por la penumbra, una llamada a los perdidos.', difficulty: difficultyLevels.Simple }
    },
    Charisma: {
      Persuasion: { slots: 1, description: 'Exprime ayuda o secretos de almas vaciadas con una lengua de plata.', difficulty: difficultyLevels.Moderate },
      Etiquette: { slots: 1, description: 'Apacigua cultos dementes o señores de ruina con ritos de una era olvidada.', difficulty: difficultyLevels.Moderate },
      Intimidation: { slots: 1, description: 'Quiebra voluntades con una voz forjada en los fuegos de la desolación.', difficulty: difficultyLevels.Moderate },
      Leadership: { slots: 2, description: 'Reúne a los quebrados en una hueste sombría, marchando por la condenación.', difficulty: difficultyLevels.Complex },
      Barter: { slots: 1, description: 'Comercia con vagabundos flacos o moradores de cripta por sobras de supervivencia.', difficulty: difficultyLevels.Moderate }
    }
  },
  'Knowledge & Scholarship Skills': {
    Intelligence: {
      History: { slots: 1, description: 'Recuerda relatos de reinos caídos, sus huesos enterrados en ceniza y tiempo.', difficulty: difficultyLevels.Moderate },
      Languages: { slots: 1, description: 'Descifra los cánticos guturales o escrituras apagadas de los muertos antiguos.', difficulty: difficultyLevels.Moderate },
      DungeonLore: { slots: 1, description: 'Conoce a los constructores de criptas, sus trampas un susurro de perdición.', difficulty: difficultyLevels.Moderate },
      Astronomy: { slots: 2, description: 'Mapea las estrellas frías en busca de guía u omen en un cielo fracturado.', difficulty: difficultyLevels.Complex },
      Astrology: { slots: 2, description: 'Lee heridas celestes en busca de presagios en un mundo al borde de la ruina.', difficulty: difficultyLevels.Complex },
      Alchemy: { slots: 2, description: 'Mezcla podredumbre y óxido en pociones o llamas, una alquimia desesperada.', difficulty: difficultyLevels.Complex },
      Cryptography: { slots: 1, description: 'Desentraña cifrados grabados por manos dementes en polvo y desesperación.', difficulty: difficultyLevels.Moderate },
      Runology: { slots: 1, description: 'Traza runas de poder o peligro, marcadas a fuego en piedra y decadencia.', difficulty: difficultyLevels.Moderate },
      Runosophy: { slots: 2, description: 'Sondea las profundidades místicas de las runas, sus secretos una maldición de doble filo.', difficulty: difficultyLevels.Rare },
      Nomothetic: { slots: 2, description: 'Comprende las leyes de un mundo roto, doblegando el destino con sombría perspicacia.', difficulty: difficultyLevels.Rare },
      NaturalSciences: { slots: 2, description: 'Estudia la putrefacción de piedra y carne en busca de ventaja en una tierra moribunda.', difficulty: difficultyLevels.Complex }
    },
    Wisdom: {
      NaturalLore: { slots: 1, description: 'Conoce las formas retorcidas de bestias y espinas en un yermo marchito.', difficulty: difficultyLevels.Moderate },
      Observation: { slots: 1, description: 'Ve las tenues cicatrices de la ruina en sombra o polvo, ignoradas por casi todos.', difficulty: difficultyLevels.Moderate },
      VeiledLore: { slots: 2, description: 'Desentierra verdades y magias prohibidas, un peligro para la mente y el alma.', difficulty: difficultyLevels.Special },
      MonsterLore: { slots: 1, description: 'Percibe las debilidades de los horrores que acechan en yermos y profundidades.', difficulty: difficultyLevels.Moderate },
      GrayMagic: { slots: 2, description: 'Domina las artes veladas del equilibrio y el control, extraídas de las brumas grises de estrellas olvidadas.', difficulty: difficultyLevels.Rare, restriction: magicRestriction },
      BlackMagic: { slots: 2, description: 'Blande el arte ensombrecido de la ruina y la decadencia, secretos arrancados del vacío negro entre constelaciones.', difficulty: difficultyLevels.Rare, restriction: magicRestriction },
      WhiteMagic: { slots: 2, description: 'Canaliza la luz tenue de la salvación y el amparo, recogida del pálido brillo de estrellas lejanas.', difficulty: difficultyLevels.Rare, restriction: magicRestriction }
    }
  },
  'Combat & Tactics Skills': {
    Dexterity: {
      ImprovisedWeapons: { slots: 1, description: 'Convierte chatarra rota o huesos en herramientas de sombría matanza.', difficulty: difficultyLevels.Simple }
    },
    Intelligence: {
      Tactics: { slots: 1, description: 'Teje planes de sangre y retirada en el caos de la ruina y el bosque.', difficulty: difficultyLevels.Moderate },
      AmbushTactics: { slots: 1, description: 'Tiende trampas o divisa enemigos en pasos sombríos y salones ruinosos.', difficulty: difficultyLevels.Moderate }
    },
    Wisdom: {
      CombatAwareness: { slots: 2, description: 'Golpea certero en la penumbra o la maleza, donde la muerte acecha sin ser vista.', difficulty: difficultyLevels.Complex },
      FirstAid: { slots: 2, description: 'Cose carne o entablilla huesos con trapos, un aplazamiento fugaz de la ruina.', difficulty: difficultyLevels.Complex }
    }
  },
  'Miscellaneous & Utility Skills': {
    Strength: {
      Mining: { slots: 2, description: 'Desgarra piedra o tierra, buscando mineral o una brecha en la oscuridad.', difficulty: difficultyLevels.Complex }
    },
    Dexterity: {
      Thievery: { slots: 1, description: 'Fuerza cerraduras oxidadas o trampas frágiles por botín en un mundo de codicia.', difficulty: difficultyLevels.Moderate },
      Camouflage: { slots: 1, description: 'Fúndete con barro y ceniza, un fantasma en una tierra que caza.', difficulty: difficultyLevels.Moderate },
      Calligraphy: { slots: 1, description: 'Escribe mapas o runas con precisión, la tinta al borde del olvido.', difficulty: difficultyLevels.Moderate },
      Forgery: { slots: 1, description: 'Falsifica marcas o escrituras para engañar a los desesperados o los muertos.', difficulty: difficultyLevels.Moderate }
    },
    Intelligence: {
      ToolImprovisation: { slots: 1, description: 'Da forma a herramientas toscas con escombros, un desafío a tierras hechas añicos.', difficulty: difficultyLevels.Moderate },
      Appraisal: { slots: 1, description: 'Juzga el valor de reliquias deslustradas en un mercado de desesperación.', difficulty: difficultyLevels.Moderate }
    },
    Wisdom: {
      Scouting: { slots: 1, description: 'Escruta la niebla y la oscuridad, espiando senderos para los condenados.', difficulty: difficultyLevels.Moderate },
      NaturalMagic: { slots: 2, description: 'Canaliza el pulso crudo de la tierra, la llama o el viento, doblegando los elementos a tu voluntad en un mundo que resiste.', difficulty: difficultyLevels.Complex, restriction: naturalMagicRestriction },
      VoiceAndForm: { slots: 2, description: 'Pronuncia sustantivos y verbos a través de catalizadores cuneiformes, torciendo lo mundano —hielo a agua, chispa a llama— en un eco hueco de la creación.', difficulty: difficultyLevels.Complex, restriction: voiceAndFormRestriction }
    }
  }
};

/** Aplana el catálogo a una lista de { key, category, attribute, slots, description, difficulty }. */
export function flattenProficiencies() {
  const out = [];
  for (const [category, byAttr] of Object.entries(nonWeaponProficiencyOptions)) {
    for (const [attribute, skills] of Object.entries(byAttr)) {
      for (const [key, data] of Object.entries(skills)) {
        out.push({ key, category, attribute, ...data });
      }
    }
  }
  return out;
}
