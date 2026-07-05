/**
 * Ficha de Item (ApplicationV2 + HandlebarsApplicationMixin) para Aristilia.
 * Un único template que se adapta al tipo de Item.
 */

import { ARISTILIA } from '../config.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export class AristiliaItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ['aristilia', 'sheet', 'item'],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true },
    // Sobrescribe la acción integrada: los jugadores usan un selector de iconos
    // curado (sin explorar el servidor); el GM conserva el explorador completo.
    actions: { editImage: AristiliaItemSheet.#onEditImage }
  };

  static PARTS = {
    body: { template: 'systems/aristilia/templates/item/item-sheet.hbs' }
  };

  /** Cambio de icono del objeto: explorador para GM, grilla curada para jugadores. */
  static async #onEditImage(event, target) {
    if (!this.isEditable) return;
    const attr = target.dataset.edit || 'img';
    const current = foundry.utils.getProperty(this.document, attr);

    if (game.user.isGM) {
      const FP = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;
      const fp = new FP({ type: 'image', current, callback: (path) => this.document.update({ [attr]: path }) });
      return fp.browse();
    }

    const icons = ARISTILIA.itemIcons ?? [];
    const content = `<div class="aristilia-icon-picker">${icons.map((p) =>
      `<img src="${p}" data-path="${p}" class="ic${p === current ? ' sel' : ''}" title="${p.split('/').pop()}" />`).join('')}</div>`;
    await foundry.applications.api.DialogV2.wait({
      window: { title: game.i18n.localize('ARISTILIA.Icon.pick'), icon: 'fas fa-icons' },
      classes: ['aristilia', 'dialog'],
      content,
      rejectClose: false,
      buttons: [{ action: 'close', label: game.i18n.localize('ARISTILIA.Icon.close'), default: true }],
      render: (ev, dialog) => {
        dialog.element.querySelectorAll('img[data-path]').forEach((el) => {
          el.addEventListener('click', async () => {
            await this.document.update({ [attr]: el.dataset.path });
            dialog.close();
          });
        });
      }
    });
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    context.item = item;
    context.system = item.system;
    context.config = ARISTILIA;
    context.editable = this.isEditable;
    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      item.system.description ?? '',
      { relativeTo: item, secrets: item.isOwner }
    );
    return context;
  }
}
