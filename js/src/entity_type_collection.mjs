const ENTITY_TYPE_PATTERN = /^\s*\[([^\]]+)\]:\s+(\S+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*$/;
const ENTITY_TYPE_BLOCK_PATTERN = new RegExp(`(?:\\A|\\n\\s*\\n)((?:${ENTITY_TYPE_PATTERN.source}(?:\\n|$))+)`, 'gm');

class EntityTypeCollection {
  #source;
  #entityTypes = null;

  constructor(source) {
    this.#source = source;
  }

  /**
   * Retrieves the ID for the given entity type label.
   *
   * @param {string} label - The entity type label to look up
   * @returns {string|undefined} The ID associated with the label, or undefined if not found
   */
  get(label) {
    return this.#cachedEntityTypes[label];
  }

  /**
   * Converts the entity types into an array of objects.
   *
   * @returns {Array<Object>} An array of objects representing entity types.
   * Example:
   * [
   *   { id: "https://example.com/Person", label: "Person" },
   *   { id: "https://example.com/Organization", label: "Organization" }
   * ]
   */
  get config() {
    return Object.entries(this.#cachedEntityTypes).map(([label, id]) => ({
      id,
      label,
    }));
  }

  /**
   * Returns a hash where the keys are labels and the values are IDs.
   * If the entity types have not been read yet, it reads them from the source
   * and caches the result for future calls.
   *
   * @returns {Object} A hash structured with labels as keys and IDs as values.
   * Example:
   * {
   *   "Person": "https://example.com/Person",
   *   "Organization": "https://example.com/Organization"
   * }
   */
  get #cachedEntityTypes() {
    if (!this.#entityTypes) {
      this.#entityTypes = this.#readEntitiesFromSource();
    }
    return this.#entityTypes;
  }

  #readEntitiesFromSource() {
    const entityTypes = {};

    const matches = Array.from(this.#source.matchAll(ENTITY_TYPE_BLOCK_PATTERN));
    for (const match of matches) {
      this.#processEntityBlock(match, entityTypes);
    }

    return entityTypes;
  }

  #processEntityBlock(entityBlock, entityTypes) {
    const blockContent = entityBlock[0];
    const lines = blockContent.split('\n');

    for (const line of lines) {
      this.#processEntityLine(line, entityTypes);
    }
  }

  #processEntityLine(line, entityTypes) {
    const match = line.trim().match(ENTITY_TYPE_PATTERN);
    if (!match) return;

    const [_, label, id] = match;
    if (label === id) return; // Skip if label and id are the same.

    if (!entityTypes[label]) {
      entityTypes[label] = id; // Avoid overwriting existing label.
    }
  }
}

export default EntityTypeCollection;
