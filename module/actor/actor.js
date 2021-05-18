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
    if (actorData.type === 'character') this._prepareCharacterData(actorData,items);

    if (actorData.type === 'character') this._prepareNPCData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData,items) {
    const data = actorData.data;

    // Make modifications to data here. For example:

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(data.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.mod = Math.floor((ability.value));
    }
    data.numFeats.value = items.filter(word => word.type == "feat").length;
    if (data.numFeats.value >= 5) {
      data.hitDice.max = 1 + Math.floor((data.numFeats.value-5)/2);
      data.attackBonus.value = Math.floor((data.numFeats.value-5)/4);
    } else {
      data.hitDice.max = 1;
      data.attackBonus.value = 0;
    }
    
    data.encumbrance.max = 10 + (data.abilities.Physique.value * 3);
  }

  _prepareNPCData(actorData) {
    const data = actorData.data;


    
  }

}