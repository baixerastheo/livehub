import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/*.test.[jt]s?(x)"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    // Non-testables en unit : infrastructure framework
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/**/*.mock.ts",
    "!src/**/*.types.ts",
    "!src/app/**",
    // Composants UI : testés via E2E (Playwright), pas en unit
    "!src/**/*.tsx",
    // Hooks realtime : dépendent de socket.io — testés en intégration
    "!src/**/*Realtime*.{ts,tsx}",
    "!src/**/*realtime*.{ts,tsx}",
    // Hooks React Query : wrappent l'API, testés via E2E
    "!src/**/*.hooks.ts",
    // Hooks React avec dépendances navigateur ou infrastructure
    "!src/core/store/auth/useAuth.ts",
    "!src/features/notifications/useOsNotifications.ts",
    "!src/features/friends/hooks/**",
    // Fichier store placeholder
    "!src/lib/store.ts",
    // Infrastructure réseau et auth
    "!src/lib/apiClient.ts",
    "!src/lib/auth-client.ts",
    "!src/lib/realtime/**",
    "!src/i18n/**",
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
};

export default createJestConfig(config);
