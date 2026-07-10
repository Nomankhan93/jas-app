import { defineConfig } from 'vitest/config'

const srcPath = new URL('./src', import.meta.url).pathname

export default defineConfig({
  resolve: {
    alias: {
      '#': srcPath,
      '@': srcPath,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    passWithNoTests: true,
  },
})
