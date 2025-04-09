export const ENTITY_TYPE_PATTERN = /^\s*\[([^\]]+)\]:\s+(\S+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*$/;
export const ENTITY_TYPE_BLOCK_PATTERN = new RegExp(`(?:\\A|\\n\\s*\\n)((?:${ENTITY_TYPE_PATTERN.source}(?:\\n|$))+)`, 'gm');
export const ESCAPE_PATTERN = /\\(?=\[[^\]]+\]\[[^\]]+\])/;
export const DENOTATION_PATTERN = /(?<!\\)\[([^\[]+?)\]\[([^\]]+?)\]/;
