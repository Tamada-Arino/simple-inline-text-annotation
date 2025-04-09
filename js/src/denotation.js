class Denotation {
  constructor(beginPos, endPos, obj) {
    this.beginPos = beginPos;
    this.endPos = endPos;
    this.obj = obj;
  }

  span() {
    return { begin: this.beginPos, end: this.endPos };
  }

  toObject() {
    return { span: this.span(), obj: this.obj };
  }

  nestedWithin(other) {
    return other.beginPos <= this.beginPos && this.endPos <= other.endPos;
  }

  positionNotInteger() {
    return !(Number.isInteger(this.beginPos) && Number.isInteger(this.endPos));
  }

  positionNegative() {
    return this.beginPos < 0 || this.endPos < 0;
  }

  positionInvalid() {
    return this.beginPos > this.endPos;
  }

  outOfBounds(textLength) {
    return this.beginPos >= textLength || this.endPos > textLength;
  }

  boundaryCrossing(other) {
    const startsInsideOther =
      this.beginPos > other.beginPos && this.beginPos < other.endPos;
    const endsInsideOther =
      this.endPos > other.beginPos && this.endPos < other.endPos;

    return startsInsideOther || endsInsideOther;
  }

  static validateDenotations(denotations, textLength) {
    const validator = new DenotationValidator();
    return validator.validate(denotations, textLength);
  }
}

export default Denotation;
