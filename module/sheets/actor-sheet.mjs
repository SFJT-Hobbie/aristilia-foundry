/**
 * Fichas de Actor (ApplicationV2 + HandlebarsApplicationMixin) para Aristilia.
 * Una clase base con la lógica compartida y dos subclases (personaje / PNJ).
 */

import { ARISTILIA } from '../config.mjs';

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
      toggleEquip: BaseActorSheet.#onToggleEquip
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    context.actor = actor;
    context.system = actor.system;
    context.config = ARISTILIA;
    context.editable = this.isEditable;

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
    const isPlaced = (i) => Number.isInteger(i.system.slot?.x) && Number.isInteger(i.system.slot?.y);
    context.grid = {
      cols: actor.system.inventory?.cols ?? 5,
      rows: actor.system.inventory?.rows ?? 5,
      cells: (actor.system.inventory?.cols ?? 5) * (actor.system.inventory?.rows ?? 5),
      placed: inventory.filter(isPlaced).map((i) => ({
        id: i.id, name: i.name, img: i.img,
        x: i.system.slot.x, y: i.system.slot.y,
        w: i.system.size?.w ?? 1, h: i.system.size?.h ?? 1
      })),
      backpack: inventory.filter((i) => !isPlaced(i))
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

    // Item que ya pertenece al actor -> colocar en la cuadrícula (si se suelta sobre ella)
    const owned = data.aristiliaItemId && this.document.items.get(data.aristiliaItemId);
    if (owned) {
      if (overGrid) await this.#placeInGrid(owned, event, overGrid);
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
    const name = game.i18n.format('ARISTILIA.NewItem', {
      type: game.i18n.localize(`TYPES.Item.${type}`)
    });
    await this.document.createEmbeddedDocuments('Item', [{ name, type }]);
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
}

/* -------------------------------------------- */
/*  Ficha de personaje (PC)                      */
/* -------------------------------------------- */

export class AristiliaCharacterSheet extends BaseActorSheet {
  static PARTS = {
    body: { template: 'systems/aristilia/templates/actor/character-sheet.hbs' }
  };
}

/* -------------------------------------------- */
/*  Ficha de PNJ                                 */
/* -------------------------------------------- */

export class AristiliaNpcSheet extends BaseActorSheet {
  static PARTS = {
    body: { template: 'systems/aristilia/templates/actor/npc-sheet.hbs' }
  };
}

// Alias por compatibilidad con el registro genérico.
export const AristiliaActorSheet = AristiliaCharacterSheet;
