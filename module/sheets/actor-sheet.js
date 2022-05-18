
/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ShazHackActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["shazhack", "sheet", "actor"],
      template: "systems/shazhack/templates/character-sheet.hbs",
      width: 640,
      height: 665,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
      resizable: false,
      dragDrop: [{ dragSelector: ".item-list .item", dropSelector: null }]
    });
  }

  /* -------------------------------------------- */



  /** @override */
  get template() {
    const path = "systems/shazhack/templates";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    //return `${path}/actor-${this.actor.data.type}-sheet.html`;
    const lc = this.actor.data.type.toLowerCase();
    return `${path}/${lc}-sheet.hbs`;
  }

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;


    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare items.
    if (actorData.type == 'Character') {
      this._prepareCharacterItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'NPC') {
      this._prepareCharacterItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    return context;
  }

  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.attributes)) {
      v.label = game.i18n.localize(CONFIG.SHAZHACK.attributes[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(context) {

    // Initialize containers.
    const esoterica = [];
    const backgrounds = [];
    const languages = [];
    const equipment = [];
    const weapons = [];
    const armour = [];
    const feats = [];
    const abilities = [];
    const spheres = [];
    const spells = [];

    // Iterate through items, allocating to containers
    // let totalWeight = 0;

    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to backgrounds.
      if (i.type === 'Background') {
        backgrounds.push(i);
      }
      // Append to languages
      if (i.type === 'Language') {
        languages.push(i);
      }
      // Append to esoterica
      if (i.type === 'Esoterica') {
        esoterica.push(i);
      }
      // Append to gear.
      if (i.type === 'Equipment') {
        equipment.push(i);
      }
      //Append to weapons
      if (i.type === 'Weapon' || i.type === 'weapon') {
        weapons.push(i);
      }
      // Append to armour
      if (i.type === 'Armour') {
        armour.push(i);
      }
      // Append to features.
      else if (i.type === 'Feat') {
        feats.push(i);
      }
      // Append to features.
      else if (i.type === 'Ability') {
        abilities.push(i);
      }
      // Append to spheres.
      else if (i.type === 'Sphere') {
        spheres.push(i);
      }
      // Append to spells.
      else if (i.type === 'Spell') {
        spells.push(i);
      }
    }
    // Assign and return
    context.backgrounds = backgrounds;
    context.languages = languages;
    context.esoterica = esoterica;
    context.equipment = equipment;
    context.weapons = weapons;
    context.armour = armour;
    context.feats = feats;
    context.abilities = abilities;
    context.spheres = spheres;
    context.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    //edit attributes
    html.find('.ability-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Rollable attributes.
    html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.rollable-attribute').click(this._onRollAttribute.bind(this));
    html.find('.rollable-background').click(this._onRollBackground.bind(this));
    html.find('.rollable-armour').click(this._onRollArmour.bind(this));
    html.find('.rollable-weapon').click(this._onRollWeapon.bind(this));
    html.find('.rollable-sphere').click(this._onRollSphere.bind(this));
    html.find('.rollable-spell').click(this._onRollSpell.bind(this));
    html.find('.rollable-ability').click(this._onRollAbility.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */

  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }




  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */

  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll);
      //, this.actor.getRollData()).roll()
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  _onRollAttribute(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    let d = Dialog.prompt({
      title: "Choose Attribute:",
      content: `
      <form>
        <div class="form-group">
          <label>Input text</label>
          <select name="advantage-select" id="advantage-select">
            <option value="Advantage">Advantage</option>
            <option value="Normal" selected="selected" >Normal</option>
            <option value="Disadvantage">Disadvantage</option>
          </select>
        </div>
      </form>`,
      label: "OK",
      callback: (html) => {
        var roll;
        var label;
        if (dataset.roll) {
          if (html.find('[id=advantage-select]')[0].value == "Advantage") {
            console.log(dataset.roll);
            roll = new Roll("2d20kh1" + "+" + dataset.roll, this.actor.data.data);
          }
          if (html.find('[id=advantage-select]')[0].value == "Normal") {
            roll = new Roll("d20" + "+" + dataset.roll, this.actor.data.data);
          }
          if (html.find('[id=advantage-select]')[0].value == "Disadvantage") {
            roll = new Roll("2d20kl1" + "+" + dataset.roll, this.actor.data.data);
          }
        }
        label = dataset.label ? `Rolling ${dataset.label}` : '';
        var m = roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });
      }
    });
  }

  _onRollBackground(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    let d = Dialog.prompt({
      title: "Choose Attribute:",
      content: `
      <form>
        <div class="form-group">
          <label>Input text</label>
          <select name="advantage-select" id="advantage-select">
            <option value="Advantage">Advantage</option>
            <option value="Normal" selected="selected" >Normal</option>
            <option value="Disadvantage">Disadvantage</option>
          </select>
          <select name="attribute-select" id="attribute-select">
            <option value="Physique">Physique</option>
            <option value="Agility">Agility</option>
            <option value="Intuition">Intuition</option>
            <option value="Presence">Presence</option>
          </select>
        </div>
      </form>`,
      label: "OK",
      callback: (html) => {
        var roll;
        var label;
        if (dataset.roll) {
          if (html.find('[id=advantage-select]')[0].value == "Advantage") {
            console.log(dataset.roll);
            roll = new Roll("2d20kh1" + "+" + dataset.roll + "+" + this.actor.data.data.attributes[html.find('[id=attribute-select]')[0].value].value, this.actor.data.data);
          }
          if (html.find('[id=advantage-select]')[0].value == "Normal") {
            roll = new Roll("d20" + "+" + dataset.roll + "+" + this.actor.data.data.attributes[html.find('[id=attribute-select]')[0].value].value, this.actor.data.data);
          }
          if (html.find('[id=advantage-select]')[0].value == "Disadvantage") {
            roll = new Roll("2d20kl1" + "+" + dataset.roll + "+" + this.actor.data.data.attributes[html.find('[id=attribute-select]')[0].value].value, this.actor.data.data);
          }
        }
        label = dataset.label ? `Rolling ${dataset.label}` : '';
        var m = roll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });
      }
    });
  }

  _onRollSphere(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    var sizeDistance = new Map();
    sizeDistance.set(0, "Single Target/Short Range");
    sizeDistance.set(1, "Small Effect Area/Medium Range");
    sizeDistance.set(2, "Moderate Effect Area/Long Range");
    sizeDistance.set(4, "Large Effect Area/Very Long Range");
    var duration = new Map();
    duration.set(0, "Instant");
    duration.set(1, "Short");
    duration.set(2, "Medium");
    duration.set(4, "Long");
    var potency = new Map();
    potency.set(0, "Minimal");
    potency.set(2, "Minor");
    potency.set(4, "Moderate");
    potency.set(6, "Major");
    let d = Dialog.prompt({
      title: "Choose Attribute:",
      content: `
      <form>
        <div class="form-group flexrow">
          <label>Select Attribute:</label>
          <select name="attribute-select" id="attribute-select">
            <option value="Roll">Roll</option>
            <option value="NoRoll" selected="selected" >No Roll</option>
          </select>
        </div>
        <div class="form-group flexrow">
          <label>Size/Distance:</label>
          <select name="sizedistance-select" id="sizedistance-select">
            <option value=0 >Single Target/Short Range  (Cost: 0)</option>
            <option value=1>Small Effect Area [<5m rad.] /Medium Range (Cost: 1)</option>
            <option value=2>Moderate Effect Area [5m< X <20m rad.]//Long Range (Cost: 2)</option>
            <option value=4>Large Effect Area [20m< X <100m rad.]//Very Long Range (Cost: 4)</option>
          </select>
        </div>
        <div class="form-group flexrow">
          <label>Duration:</label>
          <select name="duration-select" id="duration-select">
            <option value=0 >Instant (Cost: 0)</option>
            <option value=1>Short [< 1 minute] (Cost: 1)</option>
            <option value=2>Medium [> 1 minute & < 1 hour] (Cost: 2)</option>
            <option value=4>Long [> 1 hour & < 1 day] (Cost: 4)</option>
          </select>
        </div>
        <div class="form-group flexrow">
          <label>Potency:</label>
          <select name="potency-select" id="potency-select">
            <option value=0 >Minimal (Cost: 0)</option>
            <option value=2>Minor (Cost: 2)</option>
            <option value=4>Moderate (Cost: 4)</option>
            <option value=6>Major (Cost: 6)</option>
          </select>
        </div>
      </form>`,
      label: "OK",
      callback: (html) => {
        if (html.find('[id=attribute-select]')[0].value != "NoRoll") {
          var abilityBonus = Math.max(this.actor.data.data.attributes.Presence.value, this.actor.data.data.attributes.Intuition.value);
          let roll = new Roll("d20+" + abilityBonus, this.actor.data.data);
          let label = dataset.label ? `Rolling ${dataset.label} Spell` : '';
          roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label
          });
        }
        var sizeDistanceValue = html.find('[id=sizedistance-select]')[0].value;
        var durationValue = html.find('[id=duration-select]')[0].value;
        var potencyValue = html.find('[id=potency-select]')[0].value;
        var cost = parseInt(sizeDistanceValue) +
          parseInt(durationValue) +
          parseInt(potencyValue) +
          parseInt(dataset.reduction);
        if (cost <= 0) {
          if (parseInt(sizeDistanceValue) == 0 && parseInt(durationValue) == 0 && parseInt(potencyValue) == 0) {
            cost = 0
          } else {
            cost = 1;
          }
        }
        ChatMessage.create({
          speaker: { alias: this.actor.name },
          content: "<h3>Using Sphere: " + dataset.label + "| Level " + dataset.level + "</h3>" +
            "<p> This costs <b style='color:green'>" + cost + "</b> hit point(s) to cast.</p>" +
            "<p> <b>Size/Distance:</b> " + sizeDistance.get(parseInt(sizeDistanceValue)) + "</p>" +
            "<p> <b>Duration:</b> " + duration.get(parseInt(durationValue)) + "</p>" +
            "<p> <b>Potency:</b> " + potency.get(parseInt(potencyValue)) + "</p>",
          type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        });
      }
    });

  }

  _onRollAbility(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    ChatMessage.create({
      speaker: { alias: this.actor.name },
      content: dataset.label + "\n" + dataset.description,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    });
  }

  _onRollSpell(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    var abilityBonus = 0;

    var cost = dataset.cost;

    if (this.actor.items.find(a => a.type == "sphere" && a.data.name == dataset.sphere) != null) {
      var adjustCost = parseInt(cost) + parseInt(this.actor.items.find(a => a.type == "sphere" && a.data.name == dataset.sphere).data.data.reduction);
    } else {
      var adjustCost = parseInt(cost);
    }

    if (cost > 0 && adjustCost <= 0) {
      adjustCost = 1;
    } else if (cost == 0) {
      adjustCost = 0;
    }
    ChatMessage.create({
      speaker: { alias: this.actor.name },
      content: "This costs " + adjustCost + " hit point(s) to cast." + "\n" + dataset.description,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    });

    if (dataset.roll != 0) {
      var abilityBonus = Math.max(this.actor.data.data.attributes.Presence.value, this.actor.data.data.attributes.Intuition.value)
      let roll = new Roll("d20+" + abilityBonus, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataset.label} Spell` : '';
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
      let roll2 = new Roll(dataset.roll, this.actor.data.data);
      let label2 = dataset.label ? `Rolling ${dataset.label} Dice` : '';
      roll2.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label2
      });
    }
  }

  _onRollArmour(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    var abilityBonus = 0;
    abilityBonus = this.actor.data.data.attributes.Agility.value;
    if (this.actor.data.items.find(a => a.name == "Artful Dodger") != null) {
      abilityBonus *= 2;
    }
    if (dataset.roll) {
      // let roll = new Roll("d20+" + abilityBonus);
      let roll = "d20+" + abilityBonus;
      // let label = dataset.label ? `Rolling Dodge` : '';
      // roll.toMessage({
      //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      //   flavor: label
      // });
      // let roll2 = new Roll(dataset.roll, this.actor.data.data);
      let roll2 = dataset.roll;
      // let label2 = dataset.label ? `Rolling ${dataset.label} Die` : '';
      // roll2.toMessage({
      //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      //   flavor: label2
      // });
      var chatMessage = {
        content: "<p style='font-size:20px' style='font-family:verdana' >Dodge Roll: " + "[[" + roll + "]]" + "</p><p style='font-size:20px'>Armour Roll: " + "[[" + roll2 + "]]" + "</p>",
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
      };
      ChatMessage.create(chatMessage);
    }
  }


  _onRollWeapon(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    var abilityBonus = 0;
    const actorData = this.actor.data.data;
    if (dataset.type == "Light") {

      // let d = Dialog.prompt({
      //   title: "Choose Attribute:",
      //   content: `
      //   <form>
      //     <div class="form-group">
      //       <label>Select Attribute:</label>
      //       <select name="attribute-select" id="attribute-select">
      //         <option value="Physique">Physique</option>
      //         <option value="Agility">Agility</option>
      //       </select>
      //     </div>
      //   </form>`,
      //   label: "OK",
      //   callback: (html) => {

      //abilityBonus = actorData.attributes[html.find('[id=attribute-select]')[0].value].value;
      abilityBonus = Math.max(this.actor.data.data.attributes.Agility.value, this.actor.data.data.attributes.Physique.value)
      if (dataset.roll) {
        let roll = "d20+" + abilityBonus;
        if (this.actor.data.items.find(a => a.name == "Weapon Proficiency")) {
          if (this.actor.data.items.find(a => a.name == "Weapon Proficiency").data.data.choice == "Light") {
            roll = "d20+" + abilityBonus + "+" + actorData.combat.attack.value;
            console.log(roll);
          }
        }
        console.log(this.actor.data.items.find(a => a.name == "Weapon Proficiency"))
        console.log(roll);
        // let roll = new Roll("d20+" + abilityBonus + "+" + this.actor.data.data.combat.attack.value, this.actor.data.data);
        // let label = dataset.label ? `Rolling ${dataset.label} Attack` : '';
        // roll.toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label
        // },false);
        // console.log()
        // let roll2 = new Roll(dataset.roll, this.actor.data.data);
        let roll2 = dataset.roll;
        // let label2 = dataset.label ? `Rolling ${dataset.label} Damage` : '';
        // roll2.toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label2
        // });
        var chatMessage = {
          content: "<p style='font-size:20px' style='font-family:verdana' >Attack Roll: " + "[[" + roll + "]]" + "</p><p style='font-size:20px'>Damage: " + "[[" + roll2 + "]]" + "</p>",
          type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        };
        ChatMessage.create(chatMessage);
      }
      //}
      //});
    } else if (dataset.type == "Ranged") {

      abilityBonus = this.actor.data.data.attributes.Agility.value;
      if (dataset.roll) {
        let roll = "d20+" + abilityBonus;
        if (this.actor.data.items.find(a => a.name == "Weapon Proficiency")) {
          if (this.actor.data.items.find(a => a.name == "Weapon Proficiency").data.data.choice == "Ranged") {
            roll = "d20+" + abilityBonus + "+" + actorData.combat.attack.value;
          }
        }
        // let roll = new Roll("d20+" + abilityBonus + "+" + this.actor.data.data.combat.attack.value, this.actor.data.data);
        // let label = dataset.label ? `Rolling ${dataset.label} Attack` : '';
        // roll.toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label
        // });
        let roll2 = dataset.roll;
        // let roll2 = new Roll(dataset.roll, this.actor.data.data);
        // let label2 = dataset.label ? `Rolling ${dataset.label} Damage` : '';
        // roll2.toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label2
        // });
        var chatMessage = {
          content: "<p style='font-size:20px' style='font-family:verdana' >Attack Roll: " + "[[" + roll + "]]" + "</p><p style='font-size:20px'>Damage: " + "[[" + roll2 + "]]" + "</p>",
          type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        };
        ChatMessage.create(chatMessage);
      }
    } else {
      abilityBonus = this.actor.data.data.attributes.Physique.value;
      if (dataset.roll) {
        let roll = "d20+" + abilityBonus;
        if (this.actor.data.items.find(a => a.name == "Weapon Proficiency")) {
          if (this.actor.data.items.find(a => a.name == "Weapon Proficiency").data.data.choice == "Heavy") {
            roll = "d20+" + abilityBonus + "+" + actorData.combat.attack.value;
          }
        }
        // let roll = new Roll("d20+" + abilityBonus + "+" + this.actor.data.data.combat.attack.value, this.actor.data.data);
        // let label = dataset.label ? `Rolling ${dataset.label} Attack` : '';
        // roll.toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label
        // });
        let roll2 = dataset.roll;
        // let roll2 = new Roll(dataset.roll, this.actor.data.data);
        // let label2 = dataset.label ? `Rolling ${dataset.label} Damage` : '';
        // roll2.toMessage({
        //   speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        //   flavor: label2
        // });
        var chatMessage = {
          content: "<p style='font-size:20px' style='font-family:verdana' >Attack Roll: " + "[[" + roll + "]]" + "</p><p style='font-size:20px'>Damage: " + "[[" + roll2 + "]]" + "</p>",
          type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        };
        ChatMessage.create(chatMessage);
      }
    }
  }
}
