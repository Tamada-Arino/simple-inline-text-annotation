# frozen_string_literal: true

require_relative "lib/simple_inline_text_annotation/version"

Gem::Specification.new do |s|
  s.name = "simple_inline_text_annotation"
  s.version = SimpleInlineTextAnnotation::VERSION
  s.authors = ["xaiBUh29wX"]
  s.email = ["arino.tamada@luxiar.com"]

  s.summary = "A Ruby gem for inline text annotation with denotations and entity types."
  s.description = "This gem provides inline text annotation functionality, extracted from PubAnnotation, " \
                  "with support for denotations, entity types, and nested spans."
  s.homepage = "https://github.com/Tamada-Arino/simple-inline-text-annotation"
  s.license = "MIT"
  s.required_ruby_version = ">= 3.1.0"

  s.metadata["homepage_uri"] = s.homepage
  s.metadata["changelog_uri"] = "https://github.com/Tamada-Arino/simple-inline-text-annotation/blob/master/CHANGELOG.md"
  s.metadata["rubygems_uri"] = "https://rubygems.org/gems/simple_inline_text_annotation"

  gemspec = File.basename(__FILE__)
  s.files = IO.popen(%w[git ls-files -z], chdir: __dir__, err: IO::NULL) do |ls|
    ls.readlines("\x0", chomp: true).reject do |f|
      (f == gemspec) ||
        f.start_with?(*%w[bin/ spec/ .git .github Gemfile])
    end
  end
  s.bindir = "exe"
  s.executables = s.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  s.require_paths = ["lib"]
end
