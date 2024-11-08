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
      exclude: [
        "env.ts",
        "src/constants.ts",
        "src/index.ts",
        "src/initializeSocketServer.ts",
        "src/**/__tests__/constants-test.ts",
        "src/**/__tests__/_mock.ts",
        "tests/*.ts",
        "src/service/*.ts",
        "src/utils/CError.ts",
        "src/utils/Logger.ts",
        "src/utils/socketErrorHandlerWrapper.ts",
        "src/utils/mailer.ts",
        "src/db/*.ts",
        "src/routers/*.ts",
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
