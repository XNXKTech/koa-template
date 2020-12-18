module.exports = {
  preset: 'ts-jest',
  coverageDirectory: 'coverage',
  clearMocks: true,
  moduleFileExtensions: ['js', 'ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  verbose: true,
  testTimeout: 10000
};
