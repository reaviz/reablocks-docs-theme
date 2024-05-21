import { defineConfig } from 'tsup'

export default defineConfig({
  name: 'reablocks-docs-theme',
  entry: ['src/index.tsx'],
  format: 'esm',
  dts: true,
  external: ['nextra'],
  outExtension: () => ({ js: '.js' })
})
