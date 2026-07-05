/* Macro: Generar botín de tesoro (Aristilia) — canon B/X.
   Depende de la constante global TREASURE (inyectada por build-packs.mjs).
   Pide una o varias letras de tipo de tesoro (A–V) y tira el hoard completo:
   monedas por %, gemas (valor d20 c/u), joyas (3d6×100 c/u) y objetos mágicos
   (resolviendo la categoría y su subtabla, recursivamente). Publica una tarjeta al chat. */

const COIN = { cp: 'cobre', sp: 'plata', ep: 'electro', gp: 'oro', pp: 'platino' };
const COIN_ORDER = ['pp', 'gp', 'ep', 'sp', 'cp'];

const norm = (s) => String(s).replace(/,/g, '').replace(/×/g, '*').replace(/[–—]/g, '-');
const rollF = async (f) => (await new Roll(String(f)).evaluate()).total;
const d = async (n) => (await new Roll('1d' + n).evaluate()).total;
const pick = (list, r) => list.find((e) => r >= e.lo && r <= e.hi);

async function rollSub(key) {
  const r = await d(100);
  return pick(TREASURE.sub[key], r)?.item ?? '¿?';
}

async function resolveScroll() {
  const r = await d(100);
  const res = pick(TREASURE.sub.scrolls, r)?.item ?? '¿?';
  let m = res.match(/^(\d+)\s+Conjuros?$/i);
  if (m) {
    const n = +m[1]; const lvls = [];
    for (let i = 0; i < n; i++) { const sp = pick(TREASURE.scrollSpell, await d(100)); lvls.push(`${sp.arcane}/${sp.divine}`); }
    return `Pergamino de ${n} conjuro(s) — niveles arc/div: ${lvls.join(', ')}`;
  }
  m = res.match(/^Mapa del Tesoro: (\w+)$/i);
  if (m) return `Pergamino — ${res} → ${TREASURE.maps[m[1]] ?? '¿?'}`;
  return `Pergamino: ${res}`;
}

function excluded(cat, ex) {
  if (!ex.length) return false;
  if (ex.includes('weapons') && (cat === 'Weapon' || cat === 'Sword')) return true;
  if (ex.includes('swords') && cat === 'Sword') return true;
  return false;
}

async function resolveCategory(cat) {
  switch (cat) {
    case 'Potion': return 'Poción: ' + await rollSub('potions');
    case 'Ring': return 'Anillo: ' + await rollSub('rings');
    case 'Rod / Staff / Wand': return await rollSub('rods');
    case 'Sword': return await rollSub('swords');
    case 'Weapon': return 'Arma: ' + await rollSub('weapons');
    case 'Armour or Shield': return await rollSub('armour');
    case 'Miscellaneous Item': return await rollSub('misc');
    case 'Scroll or Map': return await resolveScroll();
    default: return cat;
  }
}

async function genericMagic(ex) {
  let cat = 'Miscellaneous Item';
  for (let t = 0; t < 30; t++) {
    cat = pick(TREASURE.magicItemType, await d(100))?.type ?? cat;
    if (!excluded(cat, ex)) break;
  }
  return 'Objeto mágico → ' + await resolveCategory(cat);
}

/** Resuelve una cantidad de tipo "objeto mágico" (puede tener varias cláusulas con +). */
async function resolveMagic(amount) {
  const ex = [];
  if (/not\s+weapons|no\s+weapons|except\s+weapons/i.test(amount)) ex.push('weapons');
  if (/no\s+swords|not\s+swords|except\s+swords/i.test(amount)) ex.push('swords');
  const out = [];

  if (/magic\s+sword.*or\s+weapon/i.test(amount)) {
    const opts = [['swords', 'Espada'], ['armour', 'Armadura'], ['weapons', 'Arma']];
    const p = opts[(await d(3)) - 1];
    out.push(`1 objeto mágico (${p[1]}): ${await rollSub(p[0])}`);
    return out;
  }

  for (let cl of amount.split('+')) {
    const clc = cl.replace(/\([^)]*\)/g, '').trim();
    const m = clc.match(/^(\d*d?\d+)\s+(magic items?|potions?|scrolls?)/i);
    if (!m) continue;
    const count = /d/i.test(m[1]) ? await rollF(m[1]) : parseInt(m[1], 10);
    const type = m[2].toLowerCase();
    for (let i = 0; i < count; i++) {
      if (/potion/.test(type)) out.push('Poción: ' + await rollSub('potions'));
      else if (/scroll/.test(type)) out.push(await resolveScroll());
      else out.push(await genericMagic(ex));
    }
  }
  return out;
}

async function generateType(letter, coins, gems, jewels, magic) {
  const comps = TREASURE.types[letter];
  if (!comps) { magic.push(`⚠ Tipo "${letter}" no está en B/X (A–V) — revisá manualmente.`); return; }
  for (const c of comps) {
    if (c.chance < 100 && (await d(100)) > c.chance) continue; // falla el %
    const n = norm(c.amount);
    const coinM = n.match(/^(.+?)\s+(cp|sp|ep|gp|pp)$/i);
    if (coinM) { coins[coinM[2]] = (coins[coinM[2]] || 0) + await rollF(coinM[1]); continue; }
    if (/gems$/i.test(n)) {
      const count = await rollF(n.replace(/gems$/i, '').trim());
      for (let i = 0; i < count; i++) { const v = pick(TREASURE.gems, await d(20)).value; gems.total += v; gems.count++; gems.byVal[v] = (gems.byVal[v] || 0) + 1; }
      continue;
    }
    if (/jewellery$/i.test(n)) {
      const count = await rollF(n.replace(/jewellery$/i, '').trim());
      for (let i = 0; i < count; i++) { jewels.total += await rollF(TREASURE.jewelleryFormula); jewels.count++; }
      continue;
    }
    (await resolveMagic(c.amount)).forEach((x) => magic.push(x));
  }
}

/* ---- diálogo de entrada ---- */
const input = await foundry.applications.api.DialogV2.prompt({
  window: { title: 'Generar botín de tesoro (B/X)', icon: 'fas fa-coins' },
  content: `<div class="aristilia-create-dialog">
    <label class="field">Tipo(s) de tesoro (letras A–V, separadas por espacio o coma)
      <input type="text" name="types" placeholder="ej. E S" autofocus />
    </label>
    <p class="hint">Para un monstruo, mirá su campo «Tipo de tesoro». «(guarida)» y «(c/u)» indican cuándo tirar cada letra.</p>
  </div>`,
  classes: ['aristilia', 'dialog'],
  rejectClose: false,
  ok: { label: 'Generar', callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object.types }
});
if (!input) return;

const letters = String(input).toUpperCase().match(/[A-Z]/g);
if (!letters?.length) { ui.notifications.warn('No se reconoció ninguna letra de tesoro.'); return; }

const coins = {}, gems = { total: 0, count: 0, byVal: {} }, jewels = { total: 0, count: 0 }, magic = [];
for (const L of letters) await generateType(L, coins, gems, jewels, magic);

/* ---- armar tarjeta ---- */
const parts = [];
const coinLine = COIN_ORDER.filter((k) => coins[k]).map((k) => `<b>${coins[k].toLocaleString('es')}</b> ${k} <span class="muted">(${COIN[k]})</span>`).join(' · ');
if (coinLine) parts.push(`<div class="tr-row"><i class="fas fa-coins"></i> ${coinLine}</div>`);
if (gems.count) {
  const bd = Object.entries(gems.byVal).sort((a, b) => a[0] - b[0]).map(([v, n]) => `${n}×${v}`).join(', ');
  parts.push(`<div class="tr-row"><i class="fas fa-gem"></i> <b>${gems.count}</b> gema(s) — ${gems.total.toLocaleString('es')} po <span class="muted">(${bd})</span></div>`);
}
if (jewels.count) parts.push(`<div class="tr-row"><i class="fas fa-ring"></i> <b>${jewels.count}</b> joya(s) — ${jewels.total.toLocaleString('es')} po</div>`);
if (magic.length) parts.push(`<div class="tr-row"><i class="fas fa-wand-magic-sparkles"></i> Objetos mágicos:<ul class="tr-magic">${magic.map((m) => `<li>${m}</li>`).join('')}</ul></div>`);
if (!parts.length) parts.push('<div class="tr-row"><em>Sin tesoro (todas las tiradas de % fallaron).</em></div>');

const content = `<div class="aristilia chat-card treasure-card">
  <div class="card-header"><i class="fas fa-treasure-chest"></i><h3>Botín — Tipo ${letters.join(', ')}</h3></div>
  ${parts.join('')}
</div>`;

ChatMessage.create({ speaker: ChatMessage.getSpeaker(), content });
