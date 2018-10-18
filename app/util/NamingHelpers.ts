// Helper functions for naming things

export default {

  // Used for suggesting a name based on a starting name
  // and a function that determines if it is already taken.
  suggestName(name: string, isTaken: (name: string) => any): string {
    if (isTaken(name)) {
      const match = name.match(/.*\(([0-9]+)\)$/);

      if (match) {
        const num = parseInt(match[1], 10);

        return this.suggestName(name.replace(/(.*\()([0-9]+)(\))$/, '$1' + (num + 1) + '$3'), isTaken);
      }

      return this.suggestName(name + ' (1)', isTaken);
    }

    return name;
  }

};
