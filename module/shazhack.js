// Import Modules
import { ShazHackActor } from "./actor.js";
import { ShazHackActorSheet } from "./sheets/actor-sheet.js";
import { ShazHackItem } from "./item.js";
import { ShazHackItemSheet } from "./sheets/item-sheet.js";

import {SHAZHACK} from "./helpers/config.js";

async function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/shazhack/templates/partials/character-partials/character-header.hbs",
    "systems/shazhack/templates/partials/character-partials/background-sheet.hbs",
    "systems/shazhack/templates/partials/character-partials/feats-sheet.hbs",
    "systems/shazhack/templates/partials/character-partials/items-sheet.hbs",
    "systems/shazhack/templates/partials/character-partials/spheres-sheet.hbs",
    "systems/shazhack/templates/partials/header-partials/attackbonus-partial.hbs",
    "systems/shazhack/templates/partials/header-partials/attributes-partial.hbs",
    "systems/shazhack/templates/partials/header-partials/encumbrance-partial.hbs",
    "systems/shazhack/templates/partials/header-partials/hitdice-partial.hbs",
    "systems/shazhack/templates/partials/header-partials/hitpoints-partial.hbs",
    "systems/shazhack/templates/partials/item-partials/armour-partial.hbs",
    "systems/shazhack/templates/partials/item-partials/equipment-partial.hbs",
    "systems/shazhack/templates/partials/item-partials/weapons-partial.hbs",
    "systems/shazhack/templates/partials/sphere-partials/sphere-partial.hbs",
    "systems/shazhack/templates/partials/sphere-partials/spell-partial.hbs",
    "systems/shazhack/templates/partials/background-partials/backgrounds-partial.hbs",
    "systems/shazhack/templates/partials/background-partials/esoterica-partial.hbs",
    "systems/shazhack/templates/partials/background-partials/languages-partial.hbs",
    "systems/shazhack/templates/partials/npc-partials/npc-header.hbs",
    "systems/shazhack/templates/partials/npc-partials/background-sheet.hbs",
    "systems/shazhack/templates/partials/npc-partials/feats-sheet.hbs",
    "systems/shazhack/templates/partials/npc-partials/items-sheet.hbs"
  ];

  return loadTemplates(templatePaths);
}

Hooks.once('init', async function() {

  game.shazhack = {
    ShazHackActor,
    ShazHackItem,
    rollItemMacro
  };

  CONFIG.SHAZHACK = SHAZHACK;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d4",
    decimals: 2
  };

  // Define custom Entity classes
  CONFIG.Actor.entityClass = ShazHackActor;
  CONFIG.Item.entityClass = ShazHackItem;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("shazhack", ShazHackActorSheet, { makeDefault: true });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("shazhack", ShazHackItemSheet, { makeDefault: true });

  // If you need to add Handlebars helpers, here are a few useful examples:
  Handlebars.registerHelper('concat', function() {
    var outStr = '';
    for (var arg in arguments) {
      if (typeof arguments[arg] != 'object') {
        outStr += arguments[arg];
      }
    }
    return outStr;
  });

  Handlebars.registerHelper('toLowerCase', function(str) {
    return str.toLowerCase();
  });

  Handlebars.registerHelper("axs", function(aString) {
    return aString.toUpperCase();
  });
  preloadHandlebarsTemplates();
});
Handlebars.registerHelper('textField', function(options) {
  var attribs;
  attribs = JSON.parse(options.hash.dataAttribs);
  console.log(attribs.text + " -- " + attribs.class);
});

Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createShazHackMacro(data, slot));
  
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createShazHackMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.ShazHack.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "shazhack.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}