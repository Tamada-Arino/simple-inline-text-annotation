import SimpleInlineTextAnnotation from '../src/index.js';

describe('SimpleInlineTextAnnotation.parse', () => {
  test('should parse as denotation when source has annotation structure', () => {
    const source = "[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].";
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" },
        { span: { begin: 29, end: 41 }, obj: "Organization" }
      ]
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should parse as entity types and apply id to denotation obj when source has reference structure', () => {
    const source = `[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

[Person]: https://example.com/Person
[Organization]: https://example.com/Organization`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should not parse as annotation when source has metacharacter escape', () => {
    const source = '\\[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].';
    const expected = JSON.stringify({
      text: "[Elon Musk][Person] is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 40, end: 52 }, obj: "Organization" }
      ]
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should not use as references when reference definitions do not have a blank line above', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.
[Person]: https://example.com/Person`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.\n[Person]: https://example.com/Person",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" }
      ]
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should use definitions as references when reference definitions have a blank line above', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.

[Person]: https://example.com/Person`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" }
        ]
      }
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should parse as reference link when reference contains additional text enclosed with quotation', () => {
    const source = `[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

[Person]: https://example.com/Person "text"
[Organization]: https://example.com/Organization 'text'`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should not parse as reference link when reference contains additional text not enclosed with quotation', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.

[Person]: https://example.com/Person text`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.\n\n[Person]: https://example.com/Person text",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" }
      ]
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should parse as expected format when text is written below the reference definition', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.

[Person]: https://example.com/Person
hello`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.\n\nhello",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" }
        ]
      }
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should use first defined id in priority when reference id is duplicated', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.

[Person]: https://example.com/Person
[Person]: https://example.com/Organization`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" }
        ]
      }
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should not create config when reference label and id are the same', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.

[Person]: Person`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" }
      ]
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should parse as single newline when consecutive newlines in source', () => {
    const source = `[Elon Musk][Person] is a member of the PayPal Mafia.


Elon Musk is a member of the PayPal Mafia.`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.\n\nElon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "Person" }
      ]
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });

  test('should parse as entity types with ignoring white spaces before reference definition', () => {
    const source = `  [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

  [Person]: https://example.com/Person
  [Organization]: https://example.com/Organization`;
    const expected = JSON.stringify({
      text: "Elon Musk is a member of the PayPal Mafia.",
      denotations: [
        { span: { begin: 0, end: 9 }, obj: "https://example.com/Person" },
        { span: { begin: 29, end: 41 }, obj: "https://example.com/Organization" }
      ],
      config: {
        "entity types": [
          { id: "https://example.com/Person", label: "Person" },
          { id: "https://example.com/Organization", label: "Organization" }
        ]
      }
    });
    expect(SimpleInlineTextAnnotation.parse(source)).toBe(expected);
  });
});
