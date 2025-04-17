# frozen_string_literal: true

require_relative "entity_type_collection"
require_relative "denotation"

class SimpleInlineTextAnnotation
  class Parser
    # DENOTATION_PATTERN matches two consecutive pairs of square brackets.
    # Example: [Annotated Text][Label]
    DENOTATION_PATTERN = /(?<!\\)\[([^\[]+?)\]\[([^\]]+?)\]/

    def initialize(source)
      @source = source.dup.freeze
      @entity_type_collection = EntityTypeCollection.new(source)
    end

    def parse
      @denotations = []
      @relations = []
      full_text = source_without_references

      process_denotations(full_text)

      SimpleInlineTextAnnotation.new(
        full_text,
        @denotations,
        @relations.empty? ? nil : @relations,
        @entity_type_collection
      )
    end

    private

    # Remove references from the source.
    def source_without_references
      @source.gsub(ENTITY_TYPE_BLOCK_PATTERN) do |block|
        block.start_with?("\n\n") ? "\n\n" : ""
      end.strip
    end

    def get_obj_for(label)
      @entity_type_collection.get(label) || label
    end

    def process_denotations(full_text)
      pos = 0

      while match = DENOTATION_PATTERN.match(full_text, pos)
        result = process_single_denotation(match, full_text)
        pos = result == :processed ? match.begin(0) + match[1].length : match.end(0)
      end
    end

    def process_single_denotation(match, full_text)
      target_text = match[1]
      begin_pos = match.begin(0)
      end_pos = begin_pos + target_text.length
      annotations = match[2].split(", ")

      case annotations.size
      when 1
        label = match[2]
        obj = get_obj_for(label)

        @denotations << Denotation.new(begin_pos, end_pos, obj)

        # Replace the processed annotation with its text content
        full_text[match.begin(0)...match.end(0)] = target_text
        :processed
      when 2
        obj = annotations[1]
        id = annotations[0]

        @denotations << Denotation.new(begin_pos, end_pos, obj, id)

        full_text[match.begin(0)...match.end(0)] = target_text
        :processed
      when 4
        @denotations << Denotation.new(begin_pos, end_pos, annotations[1], annotations[0])
        @relations << { pred: annotations[2], subj: annotations[0], obj: annotations[3] }

        full_text[match.begin(0)...match.end(0)] = target_text
        :processed
      else
        :skipped
      end
    end
  end
end
