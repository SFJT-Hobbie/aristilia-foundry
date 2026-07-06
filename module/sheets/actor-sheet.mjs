/**
 * Fichas de Actor (ApplicationV2 + HandlebarsApplicationMixin) para Aristilia.
 * Una clase base con la lógica compartida y dos subclases (personaje / PNJ).
 */

import { ARISTILIA } from '../config.mjs';
import { flattenProficiencies } from '../data/proficiencies.mjs';

const ATTR_KEY = {
  Strength: 'str', Dexterity: 'dex', Constitution: 'con',
  Intelligence: 'int', Wisdom: 'wis', Charisma: 'cha'
};

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

class BaseActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['aristilia', 'sheet', 'actor'],
    position: { width: 740, height: 720 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollAttribute: BaseActorSheet.#onRollAttribute,
      rollSave: BaseActorSheet.#onRollSave,
      rollHit: BaseActorSheet.#onRollHit,
      rollSkill: BaseActorSheet.#onRollSkill,
      rollWeapon: BaseActorSheet.#onRollWeapon,
      toggleSituational: BaseActorSheet.#onToggleSituational,
      createItem: BaseActorSheet.#onCreateItem,
      editItem: BaseActorSheet.#onEditItem,
      deleteItem: BaseActorSheet.#onDeleteItem,
      toChat: BaseActorSheet.#onToChat,
      toggleEquip: BaseActorSheet.#onToggleEquip,
      switchTab: BaseActorSheet.#onSwitchTab,
      unplaceItem: BaseActorSheet.#onUnplaceItem
    }
  };

  /** Pestaña activa (persistida entre renders). */
  _activeTab = 'main';

  /** ¿Preguntar por un modificador situacional en la próxima tirada? */
  _situational = false;

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    context.actor = actor;
    context.system = actor.system;
    context.config = ARISTILIA;
    context.editable = this.isEditable;
    context.activeTab = this._activeTab;
    context.situational = this._situational;

    // Items agrupados por tipo
    const inventory = actor.items.filter((i) => ['weapon', 'armor', 'shield', 'gear'].includes(i.type));
    context.items = {
      weapons: actor.items.filter((i) => i.type === 'weapon'),
      armor: actor.items.filter((i) => i.type === 'armor' || i.type === 'shield'),
      gear: actor.items.filter((i) => i.type === 'gear'),
      spells: actor.items.filter((i) => i.type === 'spell'),
      proficiencies: actor.items.filter((i) => i.type === 'proficiency'),
      inventory
    };

    // Grid de inventario: items colocados (con slot) vs. mochila (sin colocar)
    const { cell, gap, pad } = BaseActorSheet.GRID;
    const cols = actor.system.inventory?.cols ?? 5;
    const rows = actor.system.inventory?.rows ?? 5;
    const stride = cell + gap;
    const isPlaced = (i) => Number.isInteger(i.system.slot?.x) && Number.isInteger(i.system.slot?.y);
    context.grid = {
      cols, rows,
      cells: cols * rows,
      widthPx: pad * 2 + cols * cell + (cols - 1) * gap,
      heightPx: pad * 2 + rows * cell + (rows - 1) * gap,
      placed: inventory.filter(isPlaced).map((i) => {
        const w = i.system.size?.w ?? 1;
        const h = i.system.size?.h ?? 1;
        const detail = i.type === 'weapon' ? i.system.damage
          : (i.type === 'armor' || i.type === 'shield') ? `CA ${i.system.ac}`
          : '';
        const qty = i.system.quantity ?? 1;
        const tooltip = `${i.name}${detail ? ` — ${detail}` : ''}${qty > 1 ? ` ×${qty}` : ''}`;
        return {
          id: i.id, name: i.name, img: i.img, qty, showQty: qty > 1, tooltip,
          leftPx: pad + i.system.slot.x * stride,
          topPx: pad + i.system.slot.y * stride,
          wPx: w * cell + (w - 1) * gap,
          hPx: h * cell + (h - 1) * gap
        };
      }),
      // La lista muestra TODOS los objetos, marcando cuáles están colocados en la rejilla.
      all: inventory.map((i) => ({ item: i, placed: isPlaced(i) }))
    };

    // Biografía / descripción enriquecida
    const rawBio = actor.system.biography ?? actor.system.description ?? '';
    context.enrichedBio = await foundry.applications.ux.TextEditor.implementation.enrichHTML(rawBio, {
      relativeTo: actor,
      secrets: actor.isOwner
    });
    return context;
  }

  /* ---------- Grid de inventario (drag & drop) ---------- */

  // Debe coincidir con styles/aristilia.css
  static GRID = { cell: 40, gap: 2, pad: 4 };

  // Controlador para re-enganchar los listeners de DnD en CADA render. Al abortar
  // el set anterior, nunca se acumulan (evita el parpadeo creciente) y siempre
  // quedan sobre el root actual aunque Foundry lo reemplace (evita que la rejilla
  // quede "inerte" y que los drops desde compendio dejen de crear el item).
  #dndAbort = null;

  /** @override — engancha listeners tras cada render. */
  _onRender(context, options) {
    super._onRender(context, options);
    const root = this.element;
    if (!root || !this.isEditable) return;

    this.#dndAbort?.abort();
    this.#dndAbort = new AbortController();
    const { signal } = this.#dndAbort;

    root.querySelectorAll('.inv-draggable').forEach((el) => {
      el.addEventListener('dragstart', this.#onDragStart.bind(this), { signal });
    });
    root.querySelectorAll('.grid-item').forEach((el) => {
      el.addEventListener('dblclick', this.#onGridUnplace.bind(this), { signal });
    });
    root.addEventListener('dragover', (ev) => ev.preventDefault(), { signal });
    root.addEventListener('drop', this.#onDrop.bind(this), { signal });
  }

  #onDragStart(event) {
    const id = event.currentTarget.dataset.itemId;
    const item = this.document.items.get(id);
    const data = { aristiliaItemId: id };
    if (item) { data.type = 'Item'; data.uuid = item.uuid; }
    event.dataTransfer.setData('text/plain', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  }

  async #onDrop(event) {
    event.preventDefault();
    let data;
    try { data = JSON.parse(event.dataTransfer.getData('text/plain')); } catch { return; }
    const overGrid = event.target.closest?.('.inventory-grid');

    // Item que ya pertenece al actor
    const owned = data.aristiliaItemId && this.document.items.get(data.aristiliaItemId);
    if (owned) {
      if (overGrid) {
        // Soltado sobre la rejilla -> colocar/reposicionar
        await this.#placeInGrid(owned, event, overGrid);
      } else if (event.target.closest?.('.inventory-block')) {
        // Soltado fuera de la rejilla (en la lista de Objetos) -> quitar de la rejilla
        if (Number.isInteger(owned.system.slot?.x)) {
          await owned.update({ 'system.slot.x': null, 'system.slot.y': null });
        }
      }
      return;
    }

    // Item externo (compendio, barra lateral, otro actor) -> crear incrustado
    if (data.type === 'Item' && data.uuid) {
      const source = await fromUuid(data.uuid);
      if (!source) return;
      const [created] = await this.document.createEmbeddedDocuments('Item', [source.toObject()]);
      if (overGrid && created) await this.#placeInGrid(created, event, overGrid);
    }
  }

  async #placeInGrid(item, event, grid) {
    const rect = grid.getBoundingClientRect();
    const { cell, gap, pad } = BaseActorSheet.GRID;
    const stride = cell + gap;
    let x = Math.floor((event.clientX - rect.left - pad) / stride);
    let y = Math.floor((event.clientY - rect.top - pad) / stride);

    const cols = this.document.system.inventory?.cols ?? 5;
    const rows = this.document.system.inventory?.rows ?? 5;
    const w = item.system.size?.w ?? 1;
    const h = item.system.size?.h ?? 1;
    x = Math.min(Math.max(0, x), Math.max(0, cols - w));
    y = Math.min(Math.max(0, y), Math.max(0, rows - h));

    // Fusión de bundles: si el destino tiene un apilado del mismo objeto con hueco,
    // se juntan en una sola celda hasta el máximo; el sobrante queda como estaba.
    const target = this.#stackTargetAt(x, y, item);
    if (target) {
      const max = target.system.stack?.max ?? 1;
      const space = Math.max(0, max - (target.system.quantity ?? 1));
      const moved = Math.min(space, item.system.quantity ?? 1);
      if (moved > 0) {
        await target.update({ 'system.quantity': (target.system.quantity ?? 1) + moved });
        const remain = (item.system.quantity ?? 1) - moved;
        return remain <= 0 ? item.delete() : item.update({ 'system.quantity': remain });
      }
    }

    if (this.#gridCollision(x, y, w, h, item.id)) {
      ui.notifications.warn(game.i18n.localize('ARISTILIA.Inventory.collision'));
      return;
    }
    await item.update({ 'system.slot.x': x, 'system.slot.y': y });
  }

  /** Apilado del mismo objeto (nombre+tipo, apilable, con hueco) que cubre la celda destino. */
  #stackTargetAt(x, y, item) {
    if ((item.system.stack?.max ?? 1) <= 1) return null;
    return this.document.items.find((i) =>
      i.id !== item.id && i.type === item.type && i.name === item.name &&
      (i.system.stack?.max ?? 1) > 1 &&
      (i.system.quantity ?? 1) < (i.system.stack?.max ?? 1) &&
      Number.isInteger(i.system.slot?.x) && Number.isInteger(i.system.slot?.y) &&
      x >= i.system.slot.x && x < i.system.slot.x + (i.system.size?.w ?? 1) &&
      y >= i.system.slot.y && y < i.system.slot.y + (i.system.size?.h ?? 1)
    ) ?? null;
  }

  #gridCollision(x, y, w, h, ignoreId) {
    const placed = this.document.items.filter((i) =>
      i.id !== ignoreId &&
      ['weapon', 'armor', 'shield', 'gear'].includes(i.type) &&
      Number.isInteger(i.system.slot?.x) && Number.isInteger(i.system.slot?.y)
    );
    for (const i of placed) {
      const ix = i.system.slot.x, iy = i.system.slot.y;
      const iw = i.system.size?.w ?? 1, ih = i.system.size?.h ?? 1;
      const overlap = x < ix + iw && x + w > ix && y < iy + ih && y + h > iy;
      if (overlap) return true;
    }
    return false;
  }

  async #onGridUnplace(event) {
    const id = event.currentTarget.dataset.itemId;
    const item = this.document.items.get(id);
    if (item) await item.update({ 'system.slot.x': null, 'system.slot.y': null });
  }

  static async #onUnplaceItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item) await item.update({ 'system.slot.x': null, 'system.slot.y': null });
  }

  /* ---------- Modificador situacional ---------- */

  static #onToggleSituational(event, target) {
    this._situational = target.checked;
  }

  /**
   * Devuelve el modificador situacional a aplicar en una tirada:
   *  - 0 si la casilla no está marcada.
   *  - null si el jugador cancela el diálogo (abortar la tirada).
   *  - el número introducido en caso contrario (si es 0, desmarca la casilla).
   */
  async #promptSituational() {
    if (!this._situational) return 0;
    const result = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize('ARISTILIA.Situational.title'), icon: 'fas fa-dice' },
      content: `<div class="aristilia-create-dialog">
        <label class="field">${game.i18n.localize('ARISTILIA.Situational.label')}
          <input type="number" name="mod" value="0" step="1" autofocus />
        </label>
        <p class="hint">${game.i18n.localize('ARISTILIA.Situational.hint')}</p>
      </div>`,
      classes: ['aristilia', 'dialog'],
      rejectClose: false,
      ok: {
        label: game.i18n.localize('ARISTILIA.Roll.roll'),
        callback: (ev, button) => Number(new foundry.applications.ux.FormDataExtended(button.form).object.mod) || 0
      }
    });
    if (result === null || result === undefined) return null; // cancelado
    if (result === 0) { this._situational = false; this.render(); } // 0 => desmarcar
    return result;
  }

  /* ---------- Acciones de tirada ---------- */

  static async #onRollAttribute(event, target) {
    const situational = await this.#promptSituational();
    if (situational === null) return;
    await this.document.rollAttribute(target.dataset.attr, { situational });
  }

  static async #onRollSave(event, target) {
    const situational = await this.#promptSituational();
    if (situational === null) return;
    await this.document.rollSave({ situational });
  }

  /**
   * Diálogo unificado de ataque: elegir arma (opcional), CA del enemigo y
   * modificador situacional. Devuelve {weaponId, targetAC, situational} o null.
   */
  async #attackDialog(weaponId = null) {
    const weapons = this.document.items.filter((i) => i.type === 'weapon');
    const options = [`<option value="">${game.i18n.localize('ARISTILIA.Attack.noWeapon')}</option>`]
      .concat(weapons.map((w) =>
        `<option value="${w.id}" ${w.id === weaponId ? 'selected' : ''}>${w.name} (${w.system.damage})</option>`))
      .join('');
    const defaultAC = this.document.system.combat?.targetAC ?? 0;
    const content = `
      <div class="aristilia-create-dialog">
        <label class="field">${game.i18n.localize('ARISTILIA.Attack.weapon')}
          <select name="weaponId">${options}</select>
        </label>
        <div class="dims">
          <label class="field">${game.i18n.localize('ARISTILIA.TargetAC')}
            <input type="number" name="targetAC" value="${defaultAC}" step="1" />
          </label>
          <label class="field">${game.i18n.localize('ARISTILIA.Situational.label')}
            <input type="number" name="situational" value="0" step="1" />
          </label>
        </div>
      </div>`;

    const data = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize('ARISTILIA.Attack.title'), icon: 'fas fa-dice-d20' },
      content,
      classes: ['aristilia', 'dialog'],
      rejectClose: false,
      ok: {
        label: game.i18n.localize('ARISTILIA.Roll.roll'),
        callback: (ev, button) => new foundry.applications.ux.FormDataExtended(button.form).object
      }
    });
    if (!data) return null;
    return {
      weaponId: data.weaponId || null,
      targetAC: Number(data.targetAC) || 0,
      situational: Number(data.situational) || 0
    };
  }

  /** Ejecuta un ataque a partir del resultado del diálogo. */
  async #doAttack(res) {
    if (!res) return;
    const opts = { targetAC: res.targetAC, situational: res.situational };
    if (res.weaponId) await this.document.rollWeapon(res.weaponId, opts);
    else await this.document.rollHit(opts);
  }

  static async #onRollHit(event, target) {
    await this.#doAttack(await this.#attackDialog(null));
  }

  static async #onRollSkill(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item) await this.document.rollSkill(item.name, item.system.skill ?? 0);
  }

  static async #onRollWeapon(event, target) {
    await this.#doAttack(await this.#attackDialog(target.dataset.itemId));
  }

  static async #onCreateItem(event, target) {
    const type = target.dataset.type;
    if (type === 'proficiency') return BaseActorSheet.#onCreateProficiency.call(this);
    const typeLabel = game.i18n.localize(`TYPES.Item.${type}`);
    const name = game.i18n.format('ARISTILIA.NewItem', { type: typeLabel });
    // Un único popup: crear y abrir la ficha del item (el mismo que "editar"),
    // donde se ajustan nombre, tamaño (ancho×alto) y demás.
    const [created] = await this.document.createEmbeddedDocuments('Item', [{ name, type }]);
    created?.sheet.render(true);
  }

  static async #onEditItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    item?.sheet.render(true);
  }

  static async #onDeleteItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    await item?.delete();
  }

  static async #onToChat(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    await item?.toChat();
  }

  static async #onToggleEquip(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item) await item.update({ 'system.slot.equipped': !item.system.slot?.equipped });
  }

  /** Picker de competencia sin arma desde el catálogo de Aristilia. */
  static async #onCreateProficiency() {
    const catalog = flattenProficiencies();
    const byCat = {};
    catalog.forEach((p, i) => { (byCat[p.category] ??= []).push({ ...p, i }); });

    const groups = Object.entries(byCat).map(([cat, list]) => {
      const opts = list.map((p) => {
        const abbr = game.i18n.localize(ARISTILIA.attributeAbbr[ATTR_KEY[p.attribute]] ?? '');
        return `<option value="${p.i}">${p.key} — ${abbr} · ${p.slots} ${p.slots === 1 ? 'ranura' : 'ranuras'}</option>`;
      }).join('');
      return `<optgroup label="${cat}">${opts}</optgroup>`;
    }).join('');

    const content = `
      <div class="aristilia-create-dialog">
        <label class="field">${game.i18n.localize('ARISTILIA.Proficiencies')}
          <select name="idx">${groups}</select>
        </label>
        <p class="hint" data-prof-desc></p>
      </div>`;

    const data = await foundry.applications.api.DialogV2.prompt({
      window: { title: game.i18n.localize('ARISTILIA.Prof.pick'), icon: 'fas fa-scroll' },
      content,
      classes: ['aristilia', 'dialog'],
      rejectClose: false,
      render: (event, dialog) => {
        const sel = dialog.element.querySelector('select[name="idx"]');
        const desc = dialog.element.querySelector('[data-prof-desc]');
        const show = () => { desc.textContent = catalog[Number(sel.value)]?.description ?? ''; };
        sel.addEventListener('change', show); show();
      },
      ok: {
        label: game.i18n.localize('ARISTILIA.Add'),
        callback: (ev, button) => new foundry.applications.ux.FormDataExtended(button.form).object
      }
    });
    if (!data) return;

    const p = catalog[Number(data.idx)];
    if (!p) return;
    await this.document.createEmbeddedDocuments('Item', [{
      name: p.key,
      type: 'proficiency',
      system: {
        description: `<p>${p.description ?? ''}</p>${p.restriction ? `<p><em>${p.restriction}</em></p>` : ''}`,
        kind: 'nonWeapon',
        category: p.category,
        attribute: ATTR_KEY[p.attribute] ?? 'str',
        slots: p.slots ?? 1,
        difficulty: p.difficulty?.successesNeeded ? `${p.difficulty.successesNeeded} éxitos` : 'Simple',
        skill: 0
      }
    }]);
  }

  static #onSwitchTab(event, target) {
    if (this._activeTab === target.dataset.tab) return;
    this._activeTab = target.dataset.tab;
    // Re-render: solo se renderiza la pestaña activa, así los editores ProseMirror
    // siempre se crean visibles (nunca dentro de display:none).
    this.render();
  }
}

/* -------------------------------------------- */
/*  Ficha de personaje (PC)                      */
/* -------------------------------------------- */

export class AristiliaCharacterSheet extends BaseActorSheet {
  static PARTS = {
    // scrollable: [''] preserva la posición de scroll del elemento raíz de la parte
    // entre re-renders (p. ej. al colocar un item en la rejilla).
    body: { template: 'systems/aristilia/templates/actor/character-sheet.hbs', scrollable: [''] }
  };
}

/* -------------------------------------------- */
/*  Ficha de PNJ                                 */
/* -------------------------------------------- */

export class AristiliaNpcSheet extends BaseActorSheet {
  static PARTS = {
    body: { template: 'systems/aristilia/templates/actor/npc-sheet.hbs', scrollable: [''] }
  };
}

// Alias por compatibilidad con el registro genérico.
export const AristiliaActorSheet = AristiliaCharacterSheet;
