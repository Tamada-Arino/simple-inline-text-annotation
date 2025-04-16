# frozen_string_literal: true

require_relative "denotation_validator"
require_relative "generator_error"

class SimpleInlineTextAnnotation
  class Denotation
    attr_reader :begin_pos, :end_pos, :obj, :id

    def initialize(begin_pos, end_pos, obj, id = nil)
      @begin_pos = begin_pos
      @end_pos = end_pos
      @obj = obj
      @id = id
    end

    def span
      { begin: @begin_pos, end: @end_pos }
    end

    def to_h
      { id: @id, span: span, obj: @obj }.compact
    end

    def nested_within?(other)
      other.begin_pos <= @begin_pos && @end_pos <= other.end_pos
    end

    def position_not_integer?
      !(@begin_pos.is_a?(Integer) && @end_pos.is_a?(Integer))
    end

    def position_negative?
      @begin_pos.negative? || @end_pos.negative?
    end

    def position_invalid?
      @begin_pos > @end_pos
    end

    def out_of_bounds?(text_length)
      @begin_pos >= text_length || @end_pos > text_length
    end

    def boundary_crossing?(other)
      starts_inside_other = @begin_pos > other.begin_pos && @begin_pos < other.end_pos
      ends_inside_other = @end_pos > other.begin_pos && @end_pos < other.end_pos

      starts_inside_other || ends_inside_other
    end
  end
end
