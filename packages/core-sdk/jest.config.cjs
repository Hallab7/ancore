module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 75,
      lines: 70,
      statements: 70,
    },
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Exclude integration tests from default run (use `pnpm test:integration`)
  testPathIgnorePatterns: ['/node_modules/', 'integration\\.test\\.ts$'],
};
