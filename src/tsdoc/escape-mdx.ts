import type { GeneratedDefinition, Tags, TypeField } from 'nextra/tsdoc';

/**
 * Nextra's `TSDoc` renders every description (props, params, returns) through
 * the MDX compiler, so a bare `{` in a TSDoc comment is parsed as a JSX
 * expression. Upstream descriptions sometimes include object-literal examples
 * such as `{ preserveDrawingBuffer: true }`, which aren't valid expressions and
 * crash the build with "Could not parse expression with acorn".
 *
 * Escape `{`/`}` that sit in prose while leaving code spans — inline (`` `…` ``)
 * and fenced (```` ``` ````) — untouched, since MDX already treats those
 * literally and escaping inside them would surface the backslash.
 */
export const escapeMdxBraces = (text: string): string =>
  text.replace(/(`+)[\s\S]*?\1|[{}]/g, match =>
    match[0] === '`' ? match : `\\${match}`
  );

const sanitizeTags = (tags: Tags | undefined): Tags | undefined => {
  if (!tags) {
    return tags;
  }
  const next: Tags = { ...tags };
  // Only `description` and `deprecated` are rendered as markdown; other tags
  // (e.g. `default`) are emitted as plain code and must not be escaped.
  for (const key of ['description', 'deprecated'] as const) {
    if (typeof next[key] === 'string') {
      next[key] = escapeMdxBraces(next[key]);
    }
  }
  return next;
};

const sanitizeTypeField = (field: TypeField): TypeField => ({
  ...field,
  description:
    typeof field.description === 'string'
      ? escapeMdxBraces(field.description)
      : field.description,
  tags: sanitizeTags(field.tags)
});

/**
 * Return a copy of a generated definition with every markdown-rendered
 * description escaped so the MDX compiler treats stray braces literally.
 */
export const escapeDefinitionDescriptions = <T extends GeneratedDefinition>(
  definition: T
): T => {
  const next = { ...definition } as T & {
    description?: string;
    tags?: Tags;
    entries?: TypeField[];
    signatures?: {
      params: TypeField[];
      returns: TypeField[] | { type: string };
    }[];
  };

  if (typeof next.description === 'string') {
    next.description = escapeMdxBraces(next.description);
  }
  if (next.tags) {
    next.tags = sanitizeTags(next.tags);
  }
  if (Array.isArray(next.entries)) {
    next.entries = next.entries.map(sanitizeTypeField);
  }
  if (Array.isArray(next.signatures)) {
    next.signatures = next.signatures.map(signature => ({
      ...signature,
      params: signature.params.map(sanitizeTypeField),
      returns: Array.isArray(signature.returns)
        ? signature.returns.map(sanitizeTypeField)
        : signature.returns
    }));
  }

  return next;
};
