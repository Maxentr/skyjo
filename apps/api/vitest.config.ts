// vitest.config.ts
import tsconfigPaths from "vite-tsconfig-paths"
import { coverageConfigDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: "./tests/setup.ts",
    coverage: {
      reporter: ["text", "html", "json-summary", "json"],
      reportOnFailure: true,
      provider: "istanbul",
      reportsDirectory: "tests/coverage",
      include: ["src/socketio/**/**"],
      exclude: [
        // global
        "src/**/routers/*.ts",
        "src/**/index.ts",
        "src/**/**/__tests__/constants-test.ts",
        "src/**/**/__tests__/_mock.ts",
        "tests/*.ts",

        // socketio
        "src/socketio/utils/socketErrorWrapper.ts",
        "src/socketio/utils/rateLimiter.ts",

        // default
        ...coverageConfigDefaults.exclude,
      ],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
})
