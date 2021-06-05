/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class ShazHackActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["shazhack", "sheet", "actor"],
      template: "systems/shazhack/templates/actor/actor-sheet.html",
      width: 640,
      height: 665,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /* -------------------------------------------- */


  /** @override */
  get template() {
    const path = "systems/shazhack/templates/actor";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/actor-${this.actor.data.type}-sheet.html`;
  }

  /** @override */
  getData() {
    const data = super.getData();
    data.dtypes = ["String", "Number", "Boolean"];
    // for (let attr of Object.values(data.data.numFeats)) {
    //   attr.isCheckbox = attr.dtype === "Boolean";
    // }

    // Prepare items.
    if (this.actor.data.type == 'character') {
      this._prepareCharacterItems(data);
    }

    return data;
  }



  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterItems(sheetData) {
    const actorData = sheetData.actor;

    // Initialize containers.
    const esoterica = [];
    const backgrounds = [];
    const equipment = [];
    const weapons = [];
    const armour = [];
    const feats = [];
    const spheres = [];
    const spells = [];

    // Iterate through items, allocating to containers
    // let totalWeight = 0;
    for (let i of sheetData.items) {
      let item = i.data;
      i.img = i.img || DEFAULT_TOKEN;
      // Append to backgrounds.
      if (i.type === 'background') {
        backgrounds.push(i);
      }

      if (i.type === 'esoterica') {
        esoterica.push(i);
      }
      // Append to gear.
      if (i.type === 'equipment') {
        equipment.push(i);
      }
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      if (i.type === 'armour') {
        armour.push(i);
      }
      // Append to features.
      else if (i.type === 'feat') {
        feats.push(i);
      }
      // Append to spells.
      else if (i.type === 'sphere') {
        spheres.push(i);
      }
      else if (i.type === 'spell') {
        spells.push(i);
      }
    }


    spheres.forEach(function (a) {
      if (actorData.data.abilities.Intuition.value > actorData.data.abilities.Presence.value) {
        if (a.data.level == 1) {
          a.data.reduction = Math.ceil(actorData.data.abilities.Intuition.value / 2) * -1;
        } else if (a.data.level == 2) {
          a.data.reduction = actorData.data.abilities.Intuition.value * -1;
        } else if (a.data.level == 3) {
          a.data.reduction = (actorData.data.abilities.Intuition.value * -1) - 1;
        }
      } else {
        if (a.data.level == 1) {
          a.data.reduction = Math.ceil(actorData.data.abilities.Presence.value / 2) * -1;
        } else if (a.data.level == 2) {
          a.data.reduction = actorData.data.abilities.Presence.value * -1;
        } else if (a.data.level == 3) {
          a.data.reduction = (actorData.data.abilities.Presence.value * -1) - 1;
        }
      }
    })


    // Assign and return
    actorData.backgrounds = backgrounds;
    actorData.esoterica = esoterica;
    actorData.equipment = equipment;
    actorData.weapons = weapons;
    actorData.armour = armour;
    actorData.features = feats;
    actorData.spheres = spheres;
    actorData.spells = spells;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    //edit attributes
    html.find('.ability-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Update Inventory Item
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.getOwnedItem(li.data("itemId"));
      item.sheet.render(true);
    });

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      this.actor.deleteOwnedItem(li.data("itemId"));
      li.slideUp(200, () => this.render(false));
    });

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));
    html.find('.rollable-background').click(this._onRollBackground.bind(this));
    html.find('.rollable-armour').click(this._onRollArmour.bind(this));
    html.find('.rollable-weapon').click(this._onRollWeapon.bind(this));
    html.find('.rollable-sphere').click(this._onRollSphere.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
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




  _onItemCreate(event) {
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
    return this.actor.createOwnedItem(itemData);
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

    if (dataset.roll) {
      let roll = new Roll(dataset.roll, this.actor.data.data);
      let label = dataset.label ? `Rolling ${dataset.label}` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
    }
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
        if (dataset.roll) {
          let roll = new Roll(dataset.roll + "+" + this.actor.data.data.abilities[html.find('[id=attribute-select]')[0].value].value, this.actor.data.data);
          let label = dataset.label ? `Rolling ${dataset.label}` : '';
          roll.roll().toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label
          });
        }
      }
    });
  }

  _onRollSphere(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    let d = Dialog.prompt({
      title: "Choose Attribute:",
      content: `
      <form>
        <div class="form-group flexrow">
          <label>Select Attribute:</label>
          <select name="attribute-select" id="attribute-select">
            <option value="Intuition">Intuition</option>
            <option value="Presence">Presence</option>
            <option value="NoRoll">No Roll</option>
          </select>
        </div>
        <div class="form-group flexrow">
          <label>Size/Distance:</label>
          <select name="sizedistance-select" id="sizedistance-select">
            <option value=0 >Single Target/Short Range</option>
            <option value=1>Small Effect Area/Medium Range</option>
            <option value=2>Moderate Effect Area/Long Range</option>
            <option value=4>Large Effect Area/Very Long Range</option>
          </select>
        </div>
        <div class="form-group flexrow">
          <label>Duration:</label>
          <select name="duration-select" id="duration-select">
            <option value=0 >Instant</option>
            <option value=1>Short</option>
            <option value=2>Medium</option>
            <option value=4>Long</option>
          </select>
        </div>
        <div class="form-group flexrow">
          <label>Potency:</label>
          <select name="potency-select" id="potency-select">
            <option value=0 >Minimal</option>
            <option value=1>Minor</option>
            <option value=2>Moderate</option>
            <option value=4>Major</option>
          </select>
        </div>
      </form>`,
      label: "OK",
      callback: (html) => {
        if (html.find('[id=attribute-select]')[0].value != "NoRoll") {
          var abilityBonus = this.actor.data.data.abilities[html.find('[id=attribute-select]')[0].value].value;
          let roll = new Roll("d20+" + abilityBonus, this.actor.data.data);
          let label = dataset.label ? `Rolling ${dataset.label} Spell` : '';
          roll.roll().toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: label
          });
        }
        var cost = parseInt(html.find('[id=sizedistance-select]')[0].value) +
          parseInt(html.find('[id=duration-select]')[0].value) +
          parseInt(html.find('[id=potency-select]')[0].value) +
          parseInt(dataset.reduction);
        if (cost <= 0) {
          if (parseInt(html.find('[id=sizedistance-select]')[0].value) == 0 && parseInt(html.find('[id=duration-select]')[0].value) == 0 && parseInt(html.find('[id=potency-select]')[0].value) == 0) {
            cost = 0
          } else {
            cost = 1;
          }
        }
        ChatMessage.create({
          speaker: { alias: this.actor.name },
          content: "This costs " + cost + " hit point(s) to cast.",
          type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        });
      }
    });

  }

  _onRollArmour(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    var abilityBonus = 0;
    abilityBonus = this.actor.data.data.abilities.Agility.value;
   if (this.actor.data.items.find(a => a.name == "Artful Dodger") != null) {
    abilityBonus *= 2;
   }
    if (dataset.roll) {
      let roll = new Roll("d20+" + abilityBonus);
      let label = dataset.label ? `Rolling Dodge` : '';
      roll.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label
      });
      let roll2 = new Roll(dataset.roll, this.actor.data.data);
      let label2 = dataset.label ? `Rolling ${dataset.label} Die` : '';
      roll2.roll().toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label2
      });
    }
  }


  _onRollWeapon(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    var abilityBonus = 0;
    if (dataset.type == "Light") {
      let d = Dialog.prompt({
        title: "Choose Attribute:",
        content: `
        <form>
          <div class="form-group">
            <label>Select Attribute:</label>
            <select name="attribute-select" id="attribute-select">
              <option value="Physique">Physique</option>
              <option value="Agility">Agility</option>

            </select>
          </div>
        </form>`,
        label: "OK",
        callback: (html) => {
          abilityBonus = this.actor.data.data.abilities[html.find('[id=attribute-select]')[0].value].value;
          if (dataset.roll) {
            let roll = new Roll("d20+" + abilityBonus + "+" + this.actor.data.data.attackBonus.value, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label} Attack` : '';
            roll.roll().toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: label
            });
            let roll2 = new Roll(dataset.roll, this.actor.data.data);
            let label2 = dataset.label ? `Rolling ${dataset.label} Damage` : '';
            roll2.roll().toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: label2
            });
          }
        }
      });
    } else {
      abilityBonus = this.actor.data.data.abilities.Physique.value;
      if (dataset.roll) {
        let roll = new Roll("d20+" + abilityBonus + "+" + this.actor.data.data.attackBonus.value, this.actor.data.data);
        let label = dataset.label ? `Rolling ${dataset.label} Attack` : '';
        roll.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label
        });
        let roll2 = new Roll(dataset.roll, this.actor.data.data);
        let label2 = dataset.label ? `Rolling ${dataset.label} Damage` : '';
        roll2.roll().toMessage({
          speaker: ChatMessage.getSpeaker({ actor: this.actor }),
          flavor: label2
        });
      }
    }
  }
}
