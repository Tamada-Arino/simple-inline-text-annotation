const DenotationValidator = {
  validate(denotations, textLength) {
    let result = this.removeDuplicatesFrom(denotations);
    result = this.removeNonIntegerPositionsFrom(result);
    result = this.removeNegativePositionsFrom(result);
    result = this.removeInvalidPositionsFrom(result);
    result = this.removeOutOfBoundPositionsFrom(result, textLength);
    result = this.removeNestsFrom(result);
    return this.removeBoundaryCrossesFrom(result);
  },

  removeDuplicatesFrom(denotations) {
    const seen = new Set();
    return denotations.filter((denotation) => {
      const span = JSON.stringify(denotation.span());
      if (seen.has(span)) {
        return false;
      }
      seen.add(span);
      return true;
    });
  },

  removeNonIntegerPositionsFrom(denotations) {
    return denotations.filter((denotation) => !denotation.positionNotInteger());
  },

  removeNegativePositionsFrom(denotations) {
    return denotations.filter((denotation) => !denotation.positionNegative());
  },

  removeInvalidPositionsFrom(denotations) {
    return denotations.filter((denotation) => !denotation.positionInvalid());
  },

  removeOutOfBoundPositionsFrom(denotations, textLength) {
    return denotations.filter((denotation) => !denotation.outOfBounds(textLength));
  },

  removeNestsFrom(denotations) {
    // Sort by begin_pos in ascending order. If begin_pos is the same, sort by end_pos in descending order.
    const sortedDenotations = denotations.sort((a, b) => {
      if (a.beginPos === b.beginPos) {
        return b.endPos - a.endPos;
      }
      return a.beginPos - b.beginPos;
    });

    const result = [];
    sortedDenotations.forEach((denotation) => {
      if (!result.some((outer) => denotation.nestedWithin(outer))) {
        result.push(denotation);
      }
    });

    return result;
  },

  removeBoundaryCrossesFrom(denotations) {
    return denotations.filter((denotation) => {
      return !denotations.some((existing) => denotation !== existing && denotation.boundaryCrossing(existing));
    });
  },
};

export default DenotationValidator;
