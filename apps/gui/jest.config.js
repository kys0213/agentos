/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  // Use jsdom so TSX/React tests run with a DOM-like environment
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.tests.json' }],
  },
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.tsx',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx',
  ],
  moduleNameMapper: {
    '^electron-store$': '<rootDir>/__mocks__/electron-store.ts',
    '^@modelcontextprotocol/sdk/.*$': '<rootDir>/__mocks__/empty-module.js',
    '^pkce-challenge$': '<rootDir>/__mocks__/empty-module.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/dist/'],
  // ts-jest globals config deprecated; using transform options above
};
