/* Macro: Tirar subtabla de tesoro (Aristilia) — canon B/X.
   Depende de la constante global TREASURE (inyectada por build-packs.mjs).
   Elegís una subtabla y tira un resultado, publicándolo al chat. */

const d = async (n) => (await new Roll('1d' + n).evaluate()).total;
const pick = (list, r) => list.find((e) => r >= e.lo && r <= e.hi);

const TABLES = [
  { key: 'potions', label: 'Pociones', die: 100 },
  { key: 'rings', label: 'Anillos', die: 100 },
  { key: 'rods', label: 'Varas / Bastones / Varitas', die: 100 },
  { key: 'scrolls', label: 'Pergaminos y Mapas', die: 100 },
  { key: 'swords', label: 'Espadas', die: 100 },
  { key: 'weapons', label: 'Armas', die: 100 },
  { key: 'armour', label: 'Armaduras y Escudos', die: 100 },
  { key: 'misc', label: 'Objetos Misceláneos', die: 100 },
  { key: '@magicType', label: 'Tipo de objeto mágico', die: 100 },
  { key: '@gem', label: 'Valor de gema', die: 20 },
  { key: '@armourType', label: 'Tipo de armadura mágica', die: 8 },
  { key: '@scrollSpell', label: 'Nivel de conjuro de pergamino', die: 100 }
];

const options = TABLES.map((t, i) => `<option value="${i}">${t.label} (d${t.die})</option>`).join('');
const choice = await foundry.applications.api.DialogV2.prompt({
  window: { title: 'Tirar subtabla de tesoro', icon: 'fas fa-dice-d20' },
  content: `<div class="aristilia-create-dialog">
    <label class="field">Subtabla <select name="idx">${options}</select></label>
  </div>`,
  classes: ['aristilia', 'dialog'],
  rejectClose: false,
  ok: { label: 'Tirar', callback: (ev, btn) => new foundry.applications.ux.FormDataExtended(btn.form).object.idx }
});
if (choice === null || choice === undefined) return;

const t = TABLES[Number(choice)];
const r = await d(t.die);
let result;
if (t.key === '@magicType') result = pick(TREASURE.magicItemType, r).type;
else if (t.key === '@gem') result = `${pick(TREASURE.gems, r).value} po`;
else if (t.key === '@armourType') result = pick(TREASURE.magicArmour, r).type;
else if (t.key === '@scrollSpell') { const sp = pick(TREASURE.scrollSpell, r); result = `Nivel ${sp.arcane} (arcano) / ${sp.divine} (divino)`; }
else result = pick(TREASURE.sub[t.key], r)?.item ?? '¿?';

const content = `<div class="aristilia chat-card treasure-card">
  <div class="card-header"><i class="fas fa-dice-d20"></i><h3>${t.label}</h3></div>
  <div class="card-roll"><span class="dice-formula">d${t.die}</span><span class="dice-total">${r}</span></div>
  <div class="tr-row"><b>${result}</b></div>
</div>`;
ChatMessage.create({ speaker: ChatMessage.getSpeaker(), content });
