import { generateDefinition, TSDoc } from 'nextra/tsdoc';
import type { FC } from 'react';
import { getOwnPropertyNames } from './own-props';

export { getOwnPropertyNames } from './own-props';
export type { GetOwnPropertyNamesArgs } from './own-props';

export interface CreateTSDocPropsOptions {
  /**
   * Name of the source package to resolve types from (e.g. `'reablocks'`,
   * `'reaviz'`). Used both as the module specifier in the generated TS code
   * and to recognize which prop declarations are "own" vs inherited.
   */
  packageName: string;
  /**
   * Regex matched against each prop declaration's file path to identify
   * properties declared by the source package (vs inherited from React,
   * lib.dom, etc.). Defaults to `/\/${packageName}\/dist\//`.
   */
  ownPathPattern?: RegExp;
}

export interface TSDocPropsProps {
  /**
   * Component name. By default, resolves the `${name}Props` type re-exported
   * from the configured package. When that lookup fails, automatically falls
   * back to `React.ComponentProps<typeof name>` (unless `typeName` or
   * `fromComponent` is set explicitly).
   */
  name: string;
  /**
   * Override the resolved type name. Defaults to `${name}Props`. Setting this
   * disables the auto-fallback.
   */
  typeName?: string;
  /**
   * Resolve props via `React.ComponentProps<typeof name>` instead of the
   * `${name}Props` re-export. Use for components whose props interface is
   * declared but not exported from the package. Setting this disables the
   * auto-fallback.
   */
  fromComponent?: boolean;
  /**
   * Include properties inherited from base types such as
   * `React.HTMLAttributes`. Defaults to `false`.
   */
  includeInherited?: boolean;
}

/**
 * Create a TSDocProps component bound to a specific source package. Each
 * consumer site builds its own component:
 *
 * ```ts
 * export const TSDocProps = createTSDocProps({ packageName: 'reablocks' });
 * ```
 *
 * Renders a `<TSDoc>` props table wrapped in `<div className="tsdoc-props">`
 * so the theme's CSS overrides apply.
 *
 * Server Component only — uses `ts-morph` and the TypeScript Compiler API.
 */
export const createTSDocProps = ({
  packageName,
  ownPathPattern
}: CreateTSDocPropsOptions): FC<TSDocPropsProps> => {
  const pathPattern = ownPathPattern ?? new RegExp(`/${packageName}/dist/`);

  const namedExportCode = (name: string, typeName?: string) =>
    `export { ${typeName ?? `${name}Props`} as default } from '${packageName}'`;

  const componentPropsCode = (name: string) =>
    `import { ${name} } from '${packageName}';
import type { ComponentProps } from 'react';
type _ResolvedProps = ComponentProps<typeof ${name}>;
export { _ResolvedProps as default };`;

  return function TSDocProps({
    name,
    typeName,
    fromComponent = false,
    includeInherited = false
  }) {
    let code = fromComponent
      ? componentPropsCode(name)
      : namedExportCode(name, typeName);
    let definition;
    try {
      definition = generateDefinition({ code });
    } catch (err) {
      // Some packages declare `${name}Props` internally but don't export
      // them (e.g. reaviz's `BrushProps`). Fall back to resolving via
      // `React.ComponentProps<typeof ${name}>` so call sites don't need
      // per-component `fromComponent`. Only kicks in when neither explicit
      // mode is set.
      if (fromComponent || typeName) throw err;
      code = componentPropsCode(name);
      definition = generateDefinition({ code });
    }

    let resolvedDefinition = definition;
    if (!includeInherited && 'entries' in definition) {
      const ownNames = getOwnPropertyNames({ code, pathPattern });
      resolvedDefinition = {
        ...definition,
        entries: definition.entries.filter(entry => ownNames.has(entry.name))
      };
    }

    return (
      <div className="tsdoc-props">
        <TSDoc definition={resolvedDefinition} typeLinkMap={SAFE_TYPE_LINK_MAP} />
      </div>
    );
  };
};

// Nextra's `linkify` does `typeLinkMap[chunk]` against a plain `{}`, so chunks
// matching `Object.prototype` methods (e.g. `toLocaleString`) resolve to a
// function and get passed as `<Link href>`, crashing RSC serialization.
const SAFE_TYPE_LINK_MAP = Object.create(null) as Record<string, string>;
