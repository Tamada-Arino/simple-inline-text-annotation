# SimpleInlineTextAnnotation

SimpleInlineTextAnnotation is a Ruby gem designed for working with inline text annotations. It allows you to parse and generate annotated text in a structured and efficient way.

## Installation

To use this gem in a Rails application, add the following line to your application's `Gemfile`:

```ruby
gem 'simple_inline_text_annotation'
```

Then, run the following command to install the gem:

```bash
bundle install
```

## Usage

The `SimpleInlineTextAnnotation` gem provides two main methods: `parse` and `generate`. These methods allow you to work with inline text annotations in a structured way.

### `parse` Method

The `parse` method takes a string with inline annotations and extracts structured information about the annotations, including the character positions and annotation types.

#### Example

```ruby
result = SimpleInlineTextAnnotation.parse('[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].')
puts result
# => {
#      text: "Elon Musk is a member of the PayPal Mafia.",
#      denotations: [
#        {span: {begin: 0, end: 9}, obj: "Person"},
#        {span: {begin: 29, end: 41}, obj: "Organization"}
#      ]
#    }
```

#### Explanation

- The input string `[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].` contains two annotations:
  1. `[Elon Musk][Person]`: The text `Elon Musk` is annotated as `Person`.
  2. `[PayPal Mafia][Organization]`: The text `PayPal Mafia` is annotated as `Organization`.

- The method returns a hash with:
  - `"text"`: The plain text without annotations.
  - `"denotations"`: An array of hashes, where each hash contains:
    - `"span"`: The character positions (`begin` and `end`) of the annotated text.
    - `"obj"`: The annotation type.

### `generate` Method

The `generate` method performs the reverse operation of `parse`. It takes a hash containing the plain text and its annotations, and generates a string with inline annotations.

#### Example

```ruby
result = SimpleInlineTextAnnotation.generate({
  "text" => "Elon Musk is a member of the PayPal Mafia.",
  "denotations" => [
    { "span" => { "begin" => 0, "end" => 9 }, "obj" => "Person" },
    { "span" => { "begin" => 29, "end" => 41 }, "obj" => "Organization" }
  ]
})
puts result
# => "[Elon Musk][Person] is a member of the [PayPal Mafia][Organization]."
```

#### Explanation

- The input hash contains:
  - `"text"`: The plain text ("Elon Musk is a member of the PayPal Mafia.").
  - `"denotations"`: An array of hashes, where each hash specifies:
    - `"span"`: The character positions (`begin` and `end`) of the annotated text.
    - `"obj"`: The annotation type.
- The method generates a string where:
  - The text specified in `"span"` is enclosed in square brackets `[]`.
  - The annotation type specified in `"obj"` is added in a second set of square brackets `[]`.
