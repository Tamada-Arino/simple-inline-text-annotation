import EntityTypeCollection from './entity_type_collection.mjs';
import Denotation from './denotation.mjs';
import SimpleInlineTextAnnotation from './index.mjs';

const ENTITY_TYPE_PATTERN = /^\s*\[([^\]]+)\]:\s+(\S+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*$/;
const ENTITY_TYPE_BLOCK_PATTERN = new RegExp(`(?:\\A|\\n\\s*\\n)((?:${ENTITY_TYPE_PATTERN.source}(?:\\n|$))+)`, 'gm');
const DENOTATION_PATTERN = /(?<!\\)\[([^\[]+?)\]\[([^\]]+?)\]/;

class Parser {
  #source;
  #denotations;
  #entityTypeCollection;

  constructor(source) {
    this.#source = source;
    this.#entityTypeCollection = new EntityTypeCollection(source);
  }

  parse() {
    this.#denotations = [];
    let fullText = this.#sourceWithoutReferences();

    fullText = this.#processDenotations(fullText);

    return new SimpleInlineTextAnnotation(
      fullText,
      this.#denotations,
      this.#entityTypeCollection
    );
  }

  // Remove references from the source.
  #sourceWithoutReferences() {
    return this.#source
      .replace(ENTITY_TYPE_BLOCK_PATTERN, (block) =>
        block.startsWith('\n\n') ? '\n\n' : ''
      )
      .trim();
  }

  #getObjFor(label) {
    return this.#entityTypeCollection.get(label) || label;
  }

  #processDenotations(fullText) {
    const regex = new RegExp(DENOTATION_PATTERN, 'g');
    let match;

    while ((match = regex.exec(fullText)) !== null) {
      const targetText = match[1];
      const label = match[2];

      const beginPos = match.index;
      const endPos = beginPos + targetText.length;

      const obj = this.#getObjFor(label);

      this.#denotations.push(new Denotation(beginPos, endPos, obj));

      fullText = fullText.slice(0, match.index) + targetText + fullText.slice(match.index + match[0].length);
    }

    return fullText;
  }
}

export default Parser;
