/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class ShazHackItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    super.prepareData();

    // Get the Item's data
    const itemData = this.data;
    const actorData = this.actor ? this.actor.data : {};
    const data = itemData.data;


    if (itemData.type == "sphere") {
      // console.log("Before: " + data.reduction);
      data.name = itemData.name;
      if (actorData.data.abilities.Intuition.value > actorData.data.abilities.Presence.value) {
        if (data.level == 1) {
          data.reduction = Math.ceil(actorData.data.abilities.Intuition.value / 2) * -1;
        } else if (data.level == 2) {
          data.reduction = actorData.data.abilities.Intuition.value * -1;
        } else if (data.level == 3) {
          data.reduction = (actorData.data.abilities.Intuition.value * -1) - 1;
        }
      } else {
        if (data.level == 1) {
          data.reduction = Math.ceil(actorData.data.abilities.Presence.value / 2) * -1;
        } else if (data.level == 2) {
          data.reduction = actorData.data.abilities.Presence.value * -1;
        } else if (data.level == 3) {
          data.reduction = (actorData.data.abilities.Presence.value * -1) - 1;
        }
      }
      itemData.data = data;
      // console.log("After: " + data.reduction);
      // data.reduction = 
    }
    this.update(itemData);
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    // Basic template rendering data
    const token = this.actor.token;
    const item = this.data;
    const actorData = this.actor ? this.actor.data.data : {};
    const itemData = item.data;

    let roll = new Roll('d20+@abilities.str.mod', actorData);
    let label = `Rolling ${item.name}`;
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label
    });
  }
}
