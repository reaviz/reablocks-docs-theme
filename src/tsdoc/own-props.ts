import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
  skipAddingFilesFromTsConfig: true,
  compilerOptions: {
    exactOptionalPropertyTypes: true,
    strictNullChecks: true
  }
});

const VIRTUAL_FILENAME = '$tsdoc-props.ts';

export interface GetOwnPropertyNamesArgs {
  code: string;
  pathPattern: RegExp;
  exportName?: string;
}

// A prop is considered "own" only if at least one of its declarations lives
// inside the configured package. Positive allowlist instead of a blocklist —
// ts-morph in the Next.js build context sometimes returns no declarations at
// all for deeply inherited symbols (React HTMLAttributes, lib.dom, etc.), and
// a blocklist would let those pass through.
export function getOwnPropertyNames({
  code,
  pathPattern,
  exportName = 'default'
}: GetOwnPropertyNamesArgs): Set<string> {
  const sourceFile = project.createSourceFile(VIRTUAL_FILENAME, code, {
    overwrite: true
  });

  const declaration = sourceFile.getExportedDeclarations().get(exportName)?.[0];
  if (!declaration) {
    throw new Error(
      `Can't find "${exportName}" declaration while resolving own props`
    );
  }

  const own = new Set<string>();
  for (const prop of declaration.getType().getProperties()) {
    const decls = prop.getDeclarations();
    if (decls.length === 0) continue;
    const hasOwnDecl = decls.some(d =>
      pathPattern.test(d.getSourceFile().getFilePath())
    );
    if (hasOwnDecl) {
      own.add(prop.getName());
    }
  }

  return own;
}
