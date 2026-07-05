/**
 * Tabla de modificadores de atributo de Aristilia (propia, NO la de D&D).
 *   3       -> -2
 *   4 a 6   -> -1
 *   7 a 13  ->  0
 *   14 a 17 -> +1
 *   18      -> +2
 * Valores fuera de rango se extrapolan de forma segura (< 3 => -2, > 18 => +2).
 */
export function abilityMod(value) {
  const v = Number(value) || 0;
  if (v <= 3) return -2;
  if (v <= 6) return -1;
  if (v <= 13) return 0;
  if (v <= 17) return 1;
  return 2;
}

/** Formatea un modificador con signo explícito ("+2", "0", "-1"). */
export function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}
