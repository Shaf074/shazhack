/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ShazHackActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.



  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.shazhack || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {

    if (actorData.type !== 'Character') return;

    // Make modifications to data here. For example:
    const data = actorData.data;


    var totalEnc = 0;
    
    var allItem = actorData.items.filter(word => word.type == "Weapon" || word.type == "Armour" || word.type == "Equipment");
    allItem.forEach(a => totalEnc += parseInt(a.data.data.encumbrance));
    data.encumbrance.value = totalEnc;
    var feats = actorData.items.filter(word => word.type == "Feat");

    var numFeats = 0;
    feats.forEach(function(a) {
      numFeats += a.data.data.level;
    });

    var attackFlag = 0;
    if (feats.find(a => a.data.name === "Warrior") != null) {
      if (feats.find(a => a.data.name == "Warrior").data.data.level == 1) {
        attackFlag = 1;
      } else if (feats.find(a => a.data.name == "Warrior").data.data.level == 2) {
        attackFlag = 2;
      }
    }

    //Determine Hit Dice and Attack Bonus
    if (numFeats >= 5) {
      data.hitDice.max = 1 + Math.floor((numFeats - 5) / 2);
      data.combat.attack.value = Math.floor((numFeats - 5) / 4);
      if (attackFlag == 1) {
        data.combat.attack.value = Math.floor((numFeats - 5) / 2);
      } else if (attackFlag == 2) {
        data.combat.attack.value = Math.floor((numFeats - 5));
      }
    } else {
      data.hitDice.max = 1;
      data.combat.attack.value = 0;
    }

    //Determine Dodge value
    data.combat.dodge.value = data.attributes.Agility.value;
    if (feats.find(a => a.data.name === "Warrior") != null) {
      if (feats.find(a => a.data.name === "Artful Dodger").data.data.level == 1) {
        data.combat.dodge.value = Math.floor(data.combat.dodge.value * 2);
      } else if (feats.find(a => a.data.name === "Artful Dodger").data.data.level == 2) {
       data.combat.dodge.value = Math.floor(data.combat.dodge.value * 3);
      }
    }

    if (data.hitDice.value > data.hitDice.max) {
      data.hitDice.value = data.hitDice.max;
    }

    data.encumbrance.max = 10 + (data.attributes.Physique.value * 2);
    if (feats.find(a => a.data.name === "Div Ancestry")) {
      data.encumbrance.max = Math.floor(data.encumbrance.max * 1.5);
    }

    //determine cost reduction
    var costReduct = Math.max(data.attributes.Intuition.value, data.attributes.Presence.value);
    
    
    actorData.items.filter(a => a.data.type === "Sphere").forEach(function(b) {
      if(b.data.data.level == 1) {
        b.data.data.costReduction = -1 * Math.ceil(costReduct/2);
      } else if(b.data.data.level == 2) {
        b.data.data.costReduction = -1 * costReduct;
      } else if(b.data.data.level == 3) {
      b.data.data.costReduction = -1 * (Math.ceil(costReduct*1.5));
      }
    })
  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type == 'npc'){
      actorData.type = 'NPC';
      return;
    } 
    if (actorData.type !== 'NPC') return;

    // Make modifications to data here. For example:
    const data = actorData.data;
    data.xp = (data.cr * data.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== 'npc') return;

    // Process additional NPC data here.
  }

}