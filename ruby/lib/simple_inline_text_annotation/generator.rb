# frozen_string_literal: true

require_relative "denotation"

class SimpleInlineTextAnnotation
  class Generator
    include DenotationValidator

    def initialize(source)
      @source = source.dup.freeze
      @denotations = build_denotations(source["denotations"] || [])
      @config = @source["config"]
    end

    def generate
      text = @source["text"]
      raise SimpleInlineTextAnnotation::GeneratorError, 'The "text" key is missing.' if text.nil?

      denotations = validate(@denotations, text.length)

      annotated_text = annotate_text(text, denotations)
      label_definitions = build_label_definitions

      [annotated_text, label_definitions].compact.join("\n\n")
    end

    private

    def build_denotations(denotations)
      denotations.map { |d| Denotation.new(d["span"]["begin"], d["span"]["end"], d["obj"], d["id"]) }
    end

    def annotate_text(text, denotations)
      # Annotate text from the end to ensure position calculation.
      denotations.sort_by(&:begin_pos).reverse_each do |denotation|
        begin_pos = denotation.begin_pos
        end_pos = denotation.end_pos
        annotations = get_annotations(denotation.obj, denotation.id)

        annotated_text = "[#{text[begin_pos...end_pos]}][#{annotations}]"
        text = text[0...begin_pos] + annotated_text + text[end_pos..]
      end

      text
    end

    def labeled_entity_types
      return nil unless @config

      @config["entity types"]&.select { |entity_type| entity_type.key?("label") }
    end

    def get_annotations(obj, id)
      relations = @source["relations"]
      relation = relations&.find { |rel| rel["subj"] == id }
      annotations = [id, obj, relation&.dig("pred"), relation&.dig("obj")]

      return annotations.compact.join(", ") unless labeled_entity_types

      entity = labeled_entity_types.find { |entity_type| entity_type["id"] == obj }
      annotations[1] = entity["label"] if entity

      annotations.compact.join(", ")
    end

    def build_label_definitions
      return nil if labeled_entity_types.nil? || labeled_entity_types.empty?

      labeled_entity_types.map do |entity|
        "[#{entity["label"]}]: #{entity["id"]}"
      end.join("\n")
    end
  end
end
