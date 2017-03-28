// Helper functions for naming things

export default {

  // Used for suggesting a name based on a starting name
  // and a function that determines if it is already taken.
  suggestName(name, isTaken) {
    if (isTaken(name)) {
      let match = name.match(/.*\(([0-9]+)\)$/);

      if (match) {
        let num = parseInt(match[1]);

        return this.suggestName(name.replace(/(.*\()([0-9]+)(\))$/, '$1' + (num + 1) + '$3'), isTaken);
      } else {
        return this.suggestName(name + ' (1)', isTaken);
      }
    } else {
      return name;
    }
  }

};
