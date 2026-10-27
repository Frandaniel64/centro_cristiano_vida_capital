import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Todos los archivos usan la misma base de desarrollo: de a uno para que no se pisen.
    fileParallelism: false,
  },
});
