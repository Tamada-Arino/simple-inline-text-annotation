# frozen_string_literal: true

require "spec_helper"

RSpec.describe SimpleInlineTextAnnotation::Parser, type: :model do
  describe "#parse" do
    subject { SimpleInlineTextAnnotation.parse(source) }

    context "when source has annotation structure" do
      let(:source) { "[Elon Musk][Person] is a member of the [PayPal Mafia][Organization]." }
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "Person" },
            { "span": { "begin": 29, "end": 41 }, "obj": "Organization" }
          ]
        }
      end

      it "parse as denotation" do
        is_expected.to eq(expected_format)
      end
    end

    context "when surce has reference structure" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

          [Person]: https://example.com/Person
          [Organization]: https://example.com/Organization
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" },
            { "span": { "begin": 29, "end": 41 }, "obj": "https://example.com/Organization" }
          ],
          "config": {
            "entity types": [
              { "id": "https://example.com/Person", "label": "Person" },
              { "id": "https://example.com/Organization", "label": "Organization" }
            ]
          }
        }
      end

      it "parse as entity types and apply id to denotation obj" do
        is_expected.to eq(expected_format)
      end
    end

    context "when source has metacharacter escape" do
      let(:source) { '\[Elon Musk][Person] is a member of the [PayPal Mafia][Organization].' }
      let(:expected_format) do
        {
          "text": "[Elon Musk][Person] is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 40, "end": 52 }, "obj": "Organization" }
          ]
        }
      end

      it "is not parsed as annotation" do
        is_expected.to eq(expected_format)
      end
    end

    context "when reference definitions do not have a blank line above" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the PayPal Mafia.
          [Person]: https://example.com/Person
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.\n[Person]: https://example.com/Person",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "Person" }
          ]
        }
      end

      it "does not use as references" do
        is_expected.to eq(expected_format)
      end
    end

    context "when reference definitions have a blank line above" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the PayPal Mafia.

          [Person]: https://example.com/Person
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" }
          ],
          "config": {
            "entity types": [
              { "id": "https://example.com/Person", "label": "Person" }
            ]
          }
        }
      end

      it "use definitions as references" do
        is_expected.to eq(expected_format)
      end
    end

    context "when reference contains additional text after url" do
      context "when text is enclosed with quotation" do
        let(:source) do
          <<~MD2
            [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

            [Person]: https://example.com/Person "text"
            [Organization]: https://example.com/Organization 'text'
          MD2
        end
        let(:expected_format) do
          {
            "text": "Elon Musk is a member of the PayPal Mafia.",
            "denotations": [
              { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" },
              { "span": { "begin": 29, "end": 41 }, "obj": "https://example.com/Organization" }
            ],
            "config": {
              "entity types": [
                { "id": "https://example.com/Person", "label": "Person" },
                { "id": "https://example.com/Organization", "label": "Organization" }
              ]
            }
          }
        end

        it "parsed as reference link" do
          is_expected.to eq(expected_format)
        end
      end

      context "when text is not enclosed with quotation" do
        let(:source) do
          <<~MD2
            [Elon Musk][Person] is a member of the PayPal Mafia.

            [Person]: https://example.com/Person text
          MD2
        end
        let(:expected_format) do
          {
            "text": "Elon Musk is a member of the PayPal Mafia.\n\n[Person]: https://example.com/Person text",
            "denotations": [
              { "span": { "begin": 0, "end": 9 }, "obj": "Person" }
            ]
          }
        end

        it "does not parse as reference link" do
          is_expected.to eq(expected_format)
        end
      end
    end

    context "when text is written below the reference definition" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the PayPal Mafia.

          [Person]: https://example.com/Person
          hello
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.\n\nhello",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" }
          ],
          "config": {
            "entity types": [
              { "id": "https://example.com/Person", "label": "Person" }
            ]
          }
        }
      end

      it "parse as expected format" do
        is_expected.to eq(expected_format)
      end
    end

    context "when reference id is duplicated" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the PayPal Mafia.

          [Person]: https://example.com/Person
          [Person]: https://example.com/Organization
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" }
          ],
          "config": {
            "entity types": [
              { "id": "https://example.com/Person", "label": "Person" }
            ]
          }
        }
      end

      it "use first defined id in priority" do
        is_expected.to eq(expected_format)
      end
    end

    context "when reference label and id is same" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the PayPal Mafia.

          [Person]: Person
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "Person" }
          ]
        }
      end

      it "is do not create config" do
        is_expected.to eq(expected_format)
      end
    end

    context "when consecutive newlines in source" do
      let(:source) do
        <<~MD2
          [Elon Musk][Person] is a member of the PayPal Mafia.


          Elon Musk is a member of the PayPal Mafia.
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.\n\nElon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "Person" }
          ]
        }
      end

      it "is parsed as single newline" do
        is_expected.to eq(expected_format)
      end
    end

    context "when white spaces before reference definition" do
      let(:source) do
        # Using <<- to create white spaces
        <<-MD2
          [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

          [Person]: https://example.com/Person
          [Organization]: https://example.com/Organization
        MD2
      end
      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" },
            { "span": { "begin": 29, "end": 41 }, "obj": "https://example.com/Organization" }
          ],
          "config": {
            "entity types": [
              { "id": "https://example.com/Person", "label": "Person" },
              { "id": "https://example.com/Organization", "label": "Organization" }
            ]
          }
        }
      end

      it "parse as entity types with ignoring white spaces" do
        is_expected.to eq(expected_format)
      end
    end

    context "when parse is called multiple times" do
      let(:source) do
        <<~MD
          [Elon Musk][Person] is a member of the [PayPal Mafia][Organization].

          [Person]: https://example.com/Person
          [Organization]: https://example.com/Organization
        MD
      end

      let(:expected_format) do
        {
          "text": "Elon Musk is a member of the PayPal Mafia.",
          "denotations": [
            { "span": { "begin": 0, "end": 9 }, "obj": "https://example.com/Person" },
            { "span": { "begin": 29, "end": 41 }, "obj": "https://example.com/Organization" }
          ]
        }
      end

      it "does not accumulate denotations when parse is called multiple times" do
        parser = SimpleInlineTextAnnotation::Parser.new(source)
        parser.parse
        result = parser.parse.to_h

        expect(result[:denotations]).to eq(expected_format[:denotations])
      end
    end
  end
end
