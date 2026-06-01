import { escapeDefinitionDescriptions, escapeMdxBraces } from './escape-mdx';

describe('escapeMdxBraces', () => {
  it('escapes object-literal examples in prose', () => {
    expect(
      escapeMdxBraces('For example { preserveDrawingBuffer: true }')
    ).toBe('For example \\{ preserveDrawingBuffer: true \\}');
  });

  it('leaves text without braces untouched', () => {
    expect(escapeMdxBraces('A plain description.')).toBe('A plain description.');
  });

  it('does not escape braces inside inline code spans', () => {
    expect(escapeMdxBraces('Pass `{ a: 1 }` to enable it')).toBe(
      'Pass `{ a: 1 }` to enable it'
    );
  });

  it('does not escape braces inside fenced code spans', () => {
    const input = '```\nconst x = { a: 1 }\n```';
    expect(escapeMdxBraces(input)).toBe(input);
  });

  it('escapes braces outside code while preserving those inside', () => {
    expect(escapeMdxBraces('use {x} or `{y}`')).toBe('use \\{x\\} or `{y}`');
  });
});

describe('escapeDefinitionDescriptions', () => {
  it('escapes braces in entry descriptions and the description tag', () => {
    const result = escapeDefinitionDescriptions({
      name: 'GraphCanvas',
      entries: [
        {
          name: 'glOptions',
          type: 'object',
          description: 'For example { preserveDrawingBuffer: true }'
        },
        {
          name: 'deprecatedProp',
          type: 'string',
          tags: { deprecated: 'use {newProp} instead', default: '{}' }
        }
      ]
    });

    expect(result.entries[0]!.description).toBe(
      'For example \\{ preserveDrawingBuffer: true \\}'
    );
    // `deprecated` is rendered as markdown → escaped;
    // `default` is emitted as code → left untouched.
    expect(result.entries[1]!.tags).toEqual({
      deprecated: 'use \\{newProp\\} instead',
      default: '{}'
    });
  });

  it('escapes function signature param and return descriptions', () => {
    const result = escapeDefinitionDescriptions({
      name: 'doThing',
      signatures: [
        {
          params: [
            { name: 'opts', type: 'object', description: 'shape { a: 1 }' }
          ],
          returns: [{ name: 'result', type: 'object', description: 'a {b}' }]
        }
      ]
    });

    expect(result.signatures[0]!.params[0]!.description).toBe('shape \\{ a: 1 \\}');
    expect(result.signatures[0]!.returns[0]!.description).toBe('a \\{b\\}');
  });

  it('does not mutate the input definition', () => {
    const input = {
      name: 'X',
      entries: [{ name: 'a', type: 'object', description: '{x}' }]
    };
    escapeDefinitionDescriptions(input);
    expect(input.entries[0]!.description).toBe('{x}');
  });
});
