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

      while (match = DENOTATION_PATTERN.match(full_text, pos))
        result = process_single_denotation(match, full_text)
        pos = result == :processed ? match.begin(0) + match[1].length : match.end(0)
      end
    end

    def process_single_denotation(match, full_text)
      target_text = match[1]
      begin_pos = match.begin(0)
      end_pos = begin_pos + target_text.length
      annotations = match[2].split(", ")

      return :skipped unless process_annotation_by_size(annotations, begin_pos, end_pos)

      full_text[match.begin(0)...match.end(0)] = target_text
      :processed
    end

    def process_annotation_by_size(annotations, begin_pos, end_pos)
      case annotations.size
      when 1
        process_single_annotation(begin_pos, end_pos, annotations[0])
      when 2
        process_double_annotation(begin_pos, end_pos, annotations)
      when 4
        process_quadruple_annotation(begin_pos, end_pos, annotations)
      end
    end

    def process_single_annotation(begin_pos, end_pos, label)
      obj = get_obj_for(label)
      @denotations << Denotation.new(begin_pos, end_pos, obj)
    end

    def process_double_annotation(begin_pos, end_pos, annotations)
      id, label = annotations
      obj = get_obj_for(label)
      @denotations << Denotation.new(begin_pos, end_pos, obj, id)
    end

    def process_quadruple_annotation(begin_pos, end_pos, annotations)
      subj, label, pred, obj2 = annotations
      obj = get_obj_for(label)
      @denotations << Denotation.new(begin_pos, end_pos, obj, subj)
      @relations << { pred: pred, subj: subj, obj: obj2 }
    end
  end
end
