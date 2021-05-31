/**
 * Extend the base Actor entity by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class ShazHackActor extends Actor {

  /**
   * Augment the basic actor data with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    const actorData = this.data;
    const items = this.items;
    const data = actorData.data;
    const flags = actorData.flags;

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    if (actorData.type === 'character') this._prepareCharacterData(actorData, items);

    if (actorData.type === 'npc') this._prepareNPCData(actorData);

    if (actorData.type === 'hirelings') this._prepareNPCData(actorData);

  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData, items) {
    const data = actorData.data;

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(data.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value));
    }
    var totalEnc = 0;
    var allItem = items.filter(word => word.type == "weapon" || word.type == "armour" || word.type == "equipment");
    allItem.forEach(a => totalEnc += parseInt(a.data.data.encumbrance));
    data.encumbrance.value = totalEnc;
    var feats = items.filter(word => word.type == "feat");
    data.numFeats.value = 0;
    feats.forEach(function (a) {
      data.numFeats.value += a.data.data.level;
    });
    var attackFlag = 0;
    
    if (feats.find(a => a.data.name === "Warrior").data.data.level == 1) {
      attackFlag = 1;
    } else if (feats.find(a => a.data.name === "Warrior").data.data.level == 2) {
      attackFlag = 2;
    }

    console.log(attackFlag);
    if (data.numFeats.value >= 5) {
      data.hitDice.max = 1 + Math.floor((data.numFeats.value - 5) / 2);
      data.attackBonus.value = Math.floor((data.numFeats.value - 5) / 4);
      if (attackFlag == 1) {
        data.attackBonus.value = Math.floor((data.numFeats.value - 5) / 2);
      } else if (attackFlag == 2) {
        console.log(data.numFeats.value-5);
        data.attackBonus.value = Math.floor((data.numFeats.value - 5));
      }
    } else {
      data.hitDice.max = 1;
      data.attackBonus.value = 0;
    }
    if (data.hitDice.value > data.hitDice.max) {
      data.hitDice.value = data.hitDice.max;
    }

    data.encumbrance.max = 12 + (data.abilities.Physique.value * 2);
    if (feats.find(a => a.data.name === "Div Ancestry")) {
      data.encumbrance.max = Math.floor(data.encumbrance.max * 1.5);
    }
  }

  _prepareNPCData(actorData) {
    const data = actorData.data;



  }

}