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
      unplaceItem: BaseActorSheet.#onUnplaceItem,
      placeItem: BaseActorSheet.#onPlaceItem,
      viewContainer: BaseActorSheet.#onViewContainer,
      pickItem: BaseActorSheet.#onPickItem,
      openRule: BaseActorSheet.#onOpenRule
    }
  };

  /** Pestaña activa (persistida entre renders). */
  _activeTab = 'main';

  /** ¿Preguntar por un modificador situacional en la próxima tirada? */
  _situational = false;

  /** Índice cacheado de objetos de compendio (weapon/armor/shield/gear/proficiency). */
  #packCache = null;

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

    // Grid principal: objetos del inventario principal, EXCLUYENDO las mochilas
    // equipadas (que se muestran como rejilla anexa). Los objetos dentro de una
    // mochila (containerId) tampoco están en el principal.
    const cols = actor.system.inventory?.cols ?? 5;
    const rows = actor.system.inventory?.rows ?? 5;
    const mainItems = inventory.filter((i) =>
      !i.system.containerId && !(this.#isContainer(i) && i.system.slot?.equipped));
    context.grid = this.#gridData(mainItems, cols, rows, '');

    // Rejillas anexas: una por cada mochila-contenedor EQUIPADA.
    context.containers = inventory
      .filter((i) => this.#isContainer(i) && i.system.slot?.equipped)
      .map((c) => ({
        id: c.id, name: c.name, img: c.img,
        ...this.#gridData(inventory.filter((x) => x.system.containerId === c.id),
          c.system.container.cols, c.system.container.rows, c.id)
      }));

    // Biografía / descripción enriquecida
    const rawBio = actor.system.biography ?? actor.system.description ?? '';
    context.enrichedBio = await foundry.applications.ux.TextEditor.implementation.enrichHTML(rawBio, {
      relativeTo: actor,
      secrets: actor.isOwner
    });
    return context;
  }

  /** ¿El objeto es una mochila-contenedor (gear con rejilla interna)? */
  #isContainer(i) {
    return i.type === 'gear' && (i.system.container?.cols ?? 0) > 0 && (i.system.container?.rows ?? 0) > 0;
  }

  /** Construye los datos de una rejilla (principal o de mochila) para el template. */
  #gridData(items, cols, rows, containerId) {
    const { cell, gap, pad } = BaseActorSheet.GRID;
    const stride = cell + gap;
    const isPlaced = (i) => Number.isInteger(i.system.slot?.x) && Number.isInteger(i.system.slot?.y);
    return {
      cols, rows, containerId, cellPx: cell,
      cells: cols * rows,
      widthPx: pad * 2 + cols * cell + (cols - 1) * gap,
      heightPx: pad * 2 + rows * cell + (rows - 1) * gap,
      placed: items.filter(isPlaced).map((i) => {
        const w = i.system.size?.w ?? 1;
        const h = i.system.size?.h ?? 1;
        const detail = i.type === 'weapon' ? i.system.damage
          : (i.type === 'armor' || i.type === 'shield') ? `CA ${i.system.ac}` : '';
        const qty = i.system.quantity ?? 1;
        return {
          id: i.id, name: i.name, img: i.img, qty, showQty: qty > 1,
          tooltip: `${i.name}${detail ? ` — ${detail}` : ''}${qty > 1 ? ` ×${qty}` : ''}`,
          leftPx: pad + i.system.slot.x * stride,
          topPx: pad + i.system.slot.y * stride,
          wPx: w * cell + (w - 1) * gap,
          hPx: h * cell + (h - 1) * gap
        };
      }),
      all: items.map((i) => ({
        item: i, placed: isPlaced(i),
        container: this.#isContainer(i),
        inside: this.document.items.filter((x) => x.system.containerId === i.id).length
      }))
    };
  }

  /* ---------- Grid de inventario (drag & drop) ---------- */

  // Tamaño de celda de la rejilla (px). widthPx/positions se derivan de aquí y el
  // template usa cellPx, así que cambiar 'cell' reescala todo de forma consistente.
  static GRID = { cell: 52, gap: 2, pad: 4 };

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
    this.#stopAutoScroll();
    root.addEventListener('dragover', this.#onDragOver.bind(this), { signal });
    root.addEventListener('drop', this.#onDrop.bind(this), { signal });
    root.addEventListener('dragend', () => this.#stopAutoScroll(), { signal });
  }

  /** Índice (cacheado) de objetos de compendio (weapon/armor/shield/gear/proficiency). */
  async #searchCompendia(q) {
    if (!this.#packCache) {
      this.#packCache = [];
      for (const pack of game.packs) {
        if (pack.metadata.type !== 'Item') continue;
        let idx;
        try { idx = await pack.getIndex(); } catch { continue; }
        for (const e of idx) {
          if (!['weapon', 'armor', 'shield', 'gear', 'proficiency'].includes(e.type)) continue;
          this.#packCache.push({
            uuid: e.uuid ?? `Compendium.${pack.collection}.Item.${e._id}`,
            name: e.name, img: e.img ?? 'icons/svg/item-bag.svg', type: e.type,
            category: foundry.utils.getProperty(e, 'system.category') ?? '',
            damage: foundry.utils.getProperty(e, 'system.damage') ?? '',
            ac: foundry.utils.getProperty(e, 'system.ac')
          });
        }
      }
    }
    return this.#packCache.filter((e) => e.name.toLowerCase().includes(q));
  }

  /* ---------- Auto-scroll durante el arrastre ---------- */
  // El drag-and-drop HTML5 no auto-scrollea: si el inventario es largo y la rejilla
  // queda fuera de vista, sin esto no se podría soltar allí. Al acercar el puntero a
  // un borde del panel scrolleable, se desplaza solo con un bucle rAF.
  #autoScroll = { dir: 0, raf: 0, el: null };

  #scrollEl() {
    return this.element?.querySelector('.aristilia-sheet') ?? this.element;
  }

  #onDragOver(event) {
    event.preventDefault();
    const sc = this.#scrollEl();
    if (!sc) return;
    const rect = sc.getBoundingClientRect();
    const margin = 50;
    let dir = 0;
    if (event.clientY < rect.top + margin) dir = -1;
    else if (event.clientY > rect.bottom - margin) dir = 1;
    this.#autoScroll.dir = dir;
    this.#autoScroll.el = sc;
    if (dir && !this.#autoScroll.raf) {
      const step = () => {
        if (!this.#autoScroll.dir) { this.#autoScroll.raf = 0; return; }
        this.#autoScroll.el.scrollTop += this.#autoScroll.dir * 12;
        this.#autoScroll.raf = requestAnimationFrame(step);
      };
      this.#autoScroll.raf = requestAnimationFrame(step);
    }
  }

  #stopAutoScroll() {
    this.#autoScroll.dir = 0;
    if (this.#autoScroll.raf) { cancelAnimationFrame(this.#autoScroll.raf); this.#autoScroll.raf = 0; }
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
    this.#stopAutoScroll();
    let data;
    try { data = JSON.parse(event.dataTransfer.getData('text/plain')); } catch { return; }
    const overGrid = event.target.closest?.('.inventory-grid');

    // Item que ya pertenece al actor
    const owned = data.aristiliaItemId && this.document.items.get(data.aristiliaItemId);
    if (owned) {
      if (overGrid) {
        // Soltado sobre una rejilla (principal o de mochila) -> colocar/reposicionar
        await this.#placeInGrid(owned, event, overGrid);
      } else if (event.target.closest?.('.inventory-block')) {
        // Soltado en la lista -> al inventario principal, sin colocar (sale de cualquier mochila)
        await owned.update({ 'system.slot.x': null, 'system.slot.y': null, 'system.containerId': '' });
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

  async #placeInGrid(item, event, gridEl) {
    const containerId = gridEl.dataset.containerId || '';

    // Las mochilas nunca ocupan una rejilla: van a la lista (o se rechaza anidar).
    if (this.#isContainer(item)) {
      if (containerId) { ui.notifications.warn(game.i18n.localize('ARISTILIA.Container.noNest')); return; }
      await item.update({ 'system.slot.x': null, 'system.slot.y': null, 'system.containerId': '' });
      return;
    }

    const rect = gridEl.getBoundingClientRect();
    const { cell, gap, pad } = BaseActorSheet.GRID;
    const stride = cell + gap;
    let x = Math.floor((event.clientX - rect.left - pad) / stride);
    let y = Math.floor((event.clientY - rect.top - pad) / stride);

    let cols, rows;
    if (containerId) {
      const c = this.document.items.get(containerId);
      cols = c?.system.container?.cols ?? 0;
      rows = c?.system.container?.rows ?? 0;
    } else {
      cols = this.document.system.inventory?.cols ?? 5;
      rows = this.document.system.inventory?.rows ?? 5;
    }
    const w = item.system.size?.w ?? 1;
    const h = item.system.size?.h ?? 1;
    x = Math.min(Math.max(0, x), Math.max(0, cols - w));
    y = Math.min(Math.max(0, y), Math.max(0, rows - h));

    // Fusión de bundles (dentro de la misma rejilla): apilado del mismo objeto con hueco.
    const target = this.#stackTargetAt(x, y, item, containerId);
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

    if (this.#gridCollision(x, y, w, h, item.id, containerId)) {
      ui.notifications.warn(game.i18n.localize('ARISTILIA.Inventory.collision'));
      return;
    }
    await item.update({ 'system.slot.x': x, 'system.slot.y': y, 'system.containerId': containerId });
  }

  /** Apilado del mismo objeto en la MISMA rejilla (mismo containerId) que cubre la celda. */
  #stackTargetAt(x, y, item, containerId) {
    if ((item.system.stack?.max ?? 1) <= 1) return null;
    return this.document.items.find((i) =>
      i.id !== item.id && i.type === item.type && i.name === item.name &&
      (i.system.containerId || '') === containerId &&
      (i.system.stack?.max ?? 1) > 1 &&
      (i.system.quantity ?? 1) < (i.system.stack?.max ?? 1) &&
      Number.isInteger(i.system.slot?.x) && Number.isInteger(i.system.slot?.y) &&
      x >= i.system.slot.x && x < i.system.slot.x + (i.system.size?.w ?? 1) &&
      y >= i.system.slot.y && y < i.system.slot.y + (i.system.size?.h ?? 1)
    ) ?? null;
  }

  #gridCollision(x, y, w, h, ignoreId, containerId) {
    const placed = this.document.items.filter((i) =>
      i.id !== ignoreId &&
      ['weapon', 'armor', 'shield', 'gear'].includes(i.type) &&
      (i.system.containerId || '') === containerId &&
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
    if (item) await item.update({ 'system.slot.x': null, 'system.slot.y': null, 'system.containerId': '' });
  }

  static async #onUnplaceItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (item) await item.update({ 'system.slot.x': null, 'system.slot.y': null, 'system.containerId': '' });
  }

  /** Coloca el objeto en la primera celda libre de la rejilla principal (alternativa al arrastre). */
  static async #onPlaceItem(event, target) {
    const item = this.document.items.get(target.dataset.itemId);
    if (!item) return;
    const cols = this.document.system.inventory?.cols ?? 5;
    const rows = this.document.system.inventory?.rows ?? 5;
    const w = item.system.size?.w ?? 1;
    const h = item.system.size?.h ?? 1;
    const cell = this.#firstFreeCell(w, h, cols, rows, '', item.id);
    if (!cell) { ui.notifications.warn(game.i18n.localize('ARISTILIA.Inventory.noRoom')); return; }
    await item.update({ 'system.slot.x': cell.x, 'system.slot.y': cell.y, 'system.containerId': '' });
  }

  /** Primera celda (x,y) donde cabe un objeto w×h sin colisión, o null si no hay hueco. */
  #firstFreeCell(w, h, cols, rows, containerId, ignoreId) {
    for (let y = 0; y <= rows - h; y++) {
      for (let x = 0; x <= cols - w; x++) {
        if (!this.#gridCollision(x, y, w, h, ignoreId, containerId)) return { x, y };
      }
    }
    return null;
  }

  /** Pop-up para ver/retirar el contenido de una mochila (equipada o guardada). */
  static async #onViewContainer(event, target) {
    const container = this.document.items.get(target.dataset.itemId);
    if (!container) return;
    const inside = this.document.items.filter((i) => i.system.containerId === container.id);
    const rows = inside.length
      ? inside.map((i) => {
          const qty = (i.system.quantity ?? 1) > 1 ? ` ×${i.system.quantity}` : '';
          return `<li><span>${foundry.utils.escapeHTML(i.name)}${qty}</span><a data-take="${i.id}">${game.i18n.localize('ARISTILIA.Container.take')}</a></li>`;
        }).join('')
      : `<li class="empty">${game.i18n.localize('ARISTILIA.Container.empty')}</li>`;
    await foundry.applications.api.DialogV2.wait({
      window: { title: container.name, icon: 'fas fa-box-open' },
      classes: ['aristilia', 'dialog'],
      content: `<div class="aristilia-create-dialog"><ol class="container-contents">${rows}</ol></div>`,
      rejectClose: false,
      buttons: [{ action: 'close', label: game.i18n.localize('ARISTILIA.Icon.close'), default: true }],
      render: (ev, dialog) => {
        dialog.element.querySelectorAll('a[data-take]').forEach((el) => {
          el.addEventListener('click', async () => {
            const it = this.document.items.get(el.dataset.take);
            if (it) await it.update({ 'system.containerId': '', 'system.slot.x': null, 'system.slot.y': null });
            el.closest('li')?.remove();
          });
        });
      }
    });
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

  /** CA del objetivo actualmente marcado (game.user.targets), o null si no hay. */
  static #targetInfo() {
    const token = Array.from(game.user?.targets ?? [])[0];
    const actor = token?.actor;
    if (!actor) return null;
    const ac = actor.type === 'npc' ? (actor.system.ac ?? 0) : (actor.system?.ac?.value ?? 0);
    return { name: actor.name, ac: Number(ac) || 0 };
  }

  /**
   * Diálogo unificado de ataque: elegir arma (opcional), CA del enemigo y
   * modificador situacional. Devuelve {weaponId, targetAC, situational} o null.
   * Si hay un objetivo marcado, la CA se autocompleta con la del objetivo.
   */
  async #attackDialog(weaponId = null) {
    const weapons = this.document.items.filter((i) => i.type === 'weapon');
    const options = [`<option value="">${game.i18n.localize('ARISTILIA.Attack.noWeapon')}</option>`]
      .concat(weapons.map((w) =>
        `<option value="${w.id}" ${w.id === weaponId ? 'selected' : ''}>${w.name} (${w.system.damage})</option>`))
      .join('');
    // Si hay un objetivo marcado (game.user.targets), usamos su CA automáticamente.
    const tgt = BaseActorSheet.#targetInfo();
    const defaultAC = tgt ? tgt.ac : (this.document.system.combat?.targetAC ?? 0);
    const tgtNote = tgt
      ? `<p class="hint"><i class="fas fa-crosshairs"></i> ${game.i18n.format('ARISTILIA.Attack.targetInfo', { name: tgt.name, ac: tgt.ac })}</p>`
      : '';
    const content = `
      <div class="aristilia-create-dialog">
        ${tgtNote}
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

  /**
   * Selector unificado (buscar+añadir del compendio, o crear personalizado) para
   * arma/armadura/escudo/equipo/competencia. Para equipo y competencia muestra un
   * primer desplegable de categoría.
   */
  static async #onPickItem(event, target) {
    const type = target.dataset.type; // weapon | armor | shield | gear | proficiency
    const typeLabel = game.i18n.localize(`TYPES.Item.${type}`);
    await this.#searchCompendia(''); // asegura el índice cargado
    const cache = (this.#packCache ?? []).filter((e) => e.type === type)
      .sort((a, b) => a.name.localeCompare(b.name));

    const hasCats = (type === 'gear' || type === 'proficiency');
    const catLabel = (c) => (type === 'gear' ? game.i18n.localize(ARISTILIA.gearCategories?.[c] ?? c) : c);
    const cats = hasCats ? [...new Set(cache.map((e) => e.category).filter(Boolean))].sort() : [];
    const catSelect = (hasCats && cats.length)
      ? `<select class="sp-cat"><option value="">${game.i18n.localize('ARISTILIA.Pick.allCategories')}</option>` +
        cats.map((c) => `<option value="${foundry.utils.escapeHTML(c)}">${foundry.utils.escapeHTML(catLabel(c))}</option>`).join('') + '</select>'
      : '';

    const detail = (e) => {
      if (type === 'weapon') return e.damage ? foundry.utils.escapeHTML(String(e.damage)) : '';
      if (type === 'armor' || type === 'shield') return Number.isFinite(e.ac) ? `CA ${e.ac}` : '';
      return foundry.utils.escapeHTML(catLabel(e.category) || '');
    };

    const content = `<div class="aristilia-create-dialog spell-picker">
      <div class="sp-filters">${catSelect}<input type="search" class="sp-search" placeholder="${game.i18n.localize('ARISTILIA.Pick.search')}" autofocus /></div>
      <div class="sp-results"></div>
    </div>`;

    const action = await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.format('ARISTILIA.Pick.title', { type: typeLabel }), icon: 'fas fa-plus' },
      classes: ['aristilia', 'dialog'],
      content,
      rejectClose: false,
      buttons: [
        { action: 'custom', label: game.i18n.localize('ARISTILIA.Pick.custom') },
        { action: 'close', label: game.i18n.localize('ARISTILIA.Icon.close'), default: true }
      ],
      render: (ev, dialog) => {
        const el = dialog.element;
        const search = el.querySelector('.sp-search');
        const catSel = el.querySelector('.sp-cat');
        const results = el.querySelector('.sp-results');
        const apply = () => {
          const q = search.value.trim().toLowerCase();
          const cat = catSel?.value ?? '';
          let list = cache;
          if (cat) list = list.filter((e) => e.category === cat);
          if (q) list = list.filter((e) => e.name.toLowerCase().includes(q));
          results.innerHTML = list.length
            ? list.slice(0, 80).map((e) =>
              `<div class="sp-row" data-uuid="${e.uuid}"><span class="sp-name">${foundry.utils.escapeHTML(e.name)}</span>` +
              `<span class="sp-meta">${detail(e)}</span>` +
              `<a class="sp-add" title="${game.i18n.localize('ARISTILIA.Add')}"><i class="fas fa-plus"></i></a></div>`).join('')
            : `<p class="hint">${game.i18n.localize('ARISTILIA.Pick.noResults')}</p>`;
          results.querySelectorAll('.sp-add').forEach((btn) => {
            btn.addEventListener('click', async () => {
              const uuid = btn.closest('.sp-row')?.dataset.uuid;
              const doc = uuid && await fromUuid(uuid);
              if (doc) { await this.document.createEmbeddedDocuments('Item', [doc.toObject()]); ui.notifications.info(`${doc.name} ✓`); }
            });
          });
        };
        search.addEventListener('input', apply);
        catSel?.addEventListener('change', apply);
        apply();
      }
    });

    if (action === 'custom') {
      const name = game.i18n.format('ARISTILIA.NewItem', { type: typeLabel });
      const [created] = await this.document.createEmbeddedDocuments('Item', [{ name, type }]);
      created?.sheet.render(true);
    }
  }

  /** Abre en el Manual la página de la raza o clase del personaje (mundo importado o compendio). */
  static async #onOpenRule(event, target) {
    event.preventDefault();
    const kind = target.dataset.kind;             // 'race' | 'class'
    const key = target.dataset.key;               // p.ej. 'fighter', 'beastmen'
    const pageName = ARISTILIA.manualPages?.[kind]?.[key];
    const journalName = ARISTILIA.manualJournal?.[kind]; // pista para el camino rápido
    if (!pageName) {
      console.warn('Aristilia | openRule: sin mapeo para', { kind, key });
      return;
    }

    const findPage = (j) => j?.pages?.find((p) => p.name === pageName);
    let journal = null;
    let page = null;

    // 1) Camino rápido: diario del mundo con ese nombre.
    journal = game.journal?.getName?.(journalName) ?? null;
    page = findPage(journal);

    // 2) Cualquier diario del mundo que contenga la página (por si se renombró/movió el journal).
    if (!page) {
      for (const j of (game.journal ?? [])) { const p = findPage(j); if (p) { journal = j; page = p; break; } }
    }

    // 3) Compendio del sistema (si el Manual no fue importado).
    if (!page) {
      const pack = game.packs.get(ARISTILIA.manualPack);
      if (pack) {
        const docs = await pack.getDocuments();
        for (const j of docs) { const p = findPage(j); if (p) { journal = j; page = p; break; } }
      }
    }

    if (!page) {
      console.warn('Aristilia | openRule: no se encontró la página', {
        kind, key, pageName, journalName,
        diariosMundo: (game.journal ?? []).map((j) => j.name)
      });
      return ui.notifications.warn(game.i18n.localize('ARISTILIA.Manual.missing'));
    }

    journal.sheet.render(true, { pageId: page.id });
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
