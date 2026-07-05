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
    form: { submitOnChange: true }
  };

  static PARTS = {
    body: { template: 'systems/aristilia/templates/item/item-sheet.hbs' }
  };

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
