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
      exclude: [
        "./src/validations/**",
        "./src/constants.ts",
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
