import { ENTITY_TYPE_BLOCK_PATTERN, DENOTATION_PATTERN } from './constants.js';
import EntityTypeCollection from './entity_type_collection.js';
import Denotation from './denotation.js';
import SimpleInlineTextAnnotation from './index.js';

class Parser {
  constructor(source) {
    this.source = source;
    this.denotations = [];
    this.entityTypeCollection = new EntityTypeCollection(source);
  }

  parse() {
    let fullText = this.sourceWithoutReferences();

    fullText = this.processDenotations(fullText);

    return new SimpleInlineTextAnnotation(
      fullText,
      this.denotations,
      this.entityTypeCollection
    );
  }

  // Remove references from the source.
  sourceWithoutReferences() {
    return this.source
      .replace(ENTITY_TYPE_BLOCK_PATTERN, (block) =>
        block.startsWith('\n\n') ? '\n\n' : ''
      )
      .trim();
  }

  getObjFor(label) {
    return this.entityTypeCollection.get(label) || label;
  }

  processDenotations(fullText) {
    const regex = new RegExp(DENOTATION_PATTERN, 'g');
    let match;

    while ((match = regex.exec(fullText)) !== null) {
      const targetText = match[1];
      const label = match[2];

      const beginPos = match.index;
      const endPos = beginPos + targetText.length;

      const obj = this.getObjFor(label);

      this.denotations.push(new Denotation(beginPos, endPos, obj));

      fullText = fullText.slice(0, match.index) + targetText + fullText.slice(match.index + match[0].length);
    }

    return fullText;
  }
}

export default Parser;
