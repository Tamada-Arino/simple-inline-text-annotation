import Generator from './generator.mjs';
import Parser from './parser.mjs';

const ESCAPE_PATTERN = /\\(?=\[[^\]]+\]\[[^\]]+\])/;

class SimpleInlineTextAnnotation {
  constructor(text, denotations, entityTypeCollection) {
    this.text = text;
    this.denotations = denotations;
    this.entityTypeCollection = entityTypeCollection;
  }

  static parse(source) {
    const parser = new Parser(source);
    const result = parser.parse().toObject();

    return result;
  }

  static generate(source) {
    const generator = new Generator(source);
    return generator.generate();
  }

  toObject() {
    const result = {
      text: this.#formatText(this.text),
      denotations: this.denotations.map((d) => d.toObject()),
    };

    const config = this.#config();
    if (config && Object.keys(config).length > 0 && !Object.values(config).every((v) => v == null || (Array.isArray(v) && v.length === 0))) {
      result.config = config;
    }

    return result;
  }

  #formatText(text) {
    let result = this.#removeEscapeBackslashFrom(text);
    return this.#reduceConsecutiveNewlinesFrom(result);
  }

  #removeEscapeBackslashFrom(text) {
    return text.replace(ESCAPE_PATTERN, '');
  }

  #reduceConsecutiveNewlinesFrom(text) {
    return text.replace(/\n{2,}/g, '\n\n');
  }

  #config() {
    if (!this.entityTypeCollection || this.entityTypeCollection.length === 0) {
      return null;
    }
    return { 'entity types': this.entityTypeCollection.config };
  }
}

export default SimpleInlineTextAnnotation;
