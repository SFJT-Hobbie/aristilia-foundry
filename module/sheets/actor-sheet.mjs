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
      rollSkill: BaseActorSheet.#onRollSkill,
      rollWeapon: BaseActorSheet.#onRollWeapon,
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

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    context.actor = actor;
    context.system = actor.system;
    context.config = ARISTILIA;
    context.editable = this.isEditable;
    context.activeTab = this._activeTab;

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
        return {
          id: i.id, name: i.name, img: i.img,
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

  /** @override — engancha listeners tras cada render. */
  _onRender(context, options) {
    super._onRender(context, options);
    this.#applyTabs();
    const root = this.element;
    if (!root || !this.isEditable) return;

    root.querySelectorAll('.inv-draggable').forEach((el) => {
      el.addEventListener('dragstart', this.#onDragStart.bind(this));
    });
    root.querySelectorAll('.grid-item').forEach((el) => {
      el.addEventListener('dblclick', this.#onGridUnplace.bind(this));
    });
    root.addEventListener('dragover', (ev) => ev.preventDefault());
    root.addEventListener('drop', this.#onDrop.bind(this));
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

    if (this.#gridCollision(x, y, w, h, item.id)) {
      ui.notifications.warn(game.i18n.localize('ARISTILIA.Inventory.collision'));
      return;
    }
    await item.update({ 'system.slot.x': x, 'system.slot.y': y });
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

  /* ---------- Acciones ---------- */

  static async #onRollAttribute(event, target) {
    const key = target.dataset.attr;
    await this.document.rollAttribute(key);
  }

  static async #onRollSkill(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item) await this.document.rollSkill(item.name, item.system.skill ?? 0);
  }

  static async #onRollWeapon(event, target) {
    await this.document.rollWeapon(target.dataset.itemId);
  }

  static async #onCreateItem(event, target) {
    const type = target.dataset.type;
    if (type === 'proficiency') return BaseActorSheet.#onCreateProficiency.call(this);
    const sized = ['weapon', 'armor', 'shield', 'gear'].includes(type);
    const typeLabel = game.i18n.localize(`TYPES.Item.${type}`);
    const defName = game.i18n.format('ARISTILIA.NewItem', { type: typeLabel });
    const cols = this.document.system.inventory?.cols ?? 5;
    const rows = this.document.system.inventory?.rows ?? 5;

    const content = `
      <div class="aristilia-create-dialog">
        <label class="field">${game.i18n.localize('ARISTILIA.Name')}
          <input type="text" name="name" value="${defName}" autofocus />
        </label>
        ${sized ? `
        <div class="dims">
          <label class="field">${game.i18n.localize('ARISTILIA.Item.width')}
            <input type="number" name="w" value="1" min="1" max="${cols}" />
          </label>
          <label class="field">${game.i18n.localize('ARISTILIA.Item.height')}
            <input type="number" name="h" value="1" min="1" max="${rows}" />
          </label>
        </div>
        <p class="hint">${game.i18n.localize('ARISTILIA.Item.sizeHint')}</p>` : ''}
      </div>`;

    const data = await foundry.applications.api.DialogV2.prompt({
      window: { title: defName, icon: 'fas fa-plus' },
      content,
      classes: ['aristilia', 'dialog'],
      rejectClose: false,
      ok: {
        label: game.i18n.localize('ARISTILIA.Add'),
        callback: (ev, button) => new foundry.applications.ux.FormDataExtended(button.form).object
      }
    });
    if (!data) return;

    const itemData = { name: (data.name ?? '').trim() || typeLabel, type };
    if (sized) {
      itemData.system = {
        size: {
          w: Math.min(cols, Math.max(1, Number(data.w) || 1)),
          h: Math.min(rows, Math.max(1, Number(data.h) || 1))
        }
      };
    }
    // Un solo popup: creamos el item ya configurado, sin abrir su ficha.
    await this.document.createEmbeddedDocuments('Item', [itemData]);
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
    this._activeTab = target.dataset.tab;
    this.#applyTabs();
  }

  #applyTabs() {
    const root = this.element;
    if (!root) return;
    root.querySelectorAll('.tab-content').forEach((el) =>
      el.classList.toggle('active', el.dataset.tab === this._activeTab));
    root.querySelectorAll('.sheet-tabs .tab-link').forEach((el) =>
      el.classList.toggle('active', el.dataset.tab === this._activeTab));
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
