/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|js|mts|mjs)$": ["ts-jest", { useESM: true }], // Enable ESM for ts-jest
  },
  testMatch: [
    "**/*.test.?(m)[tj]s?(x)", // Match test files with .test.ts, .test.js etc.
    "**/test.?(m)[tj]s?(x)", // Match a single test file like test.ts, test.js
  ],
  moduleFileExtensions: ["ts", "mts", "js", "mjs"],
  extensionsToTreatAsEsm: [".ts", ".mts"], // Tell Jest that these extensions should be treated as ESM
  resolver: "esm-jest-ts-webcompat-resolver",
  testTimeout: 50_000,
};
