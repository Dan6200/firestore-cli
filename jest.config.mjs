import { pathsToModuleNameMapper } from "ts-jest";
import { readFileSync } from "fs";

const { compilerOptions } = JSON.parse(readFileSync("./tsconfig.json"));

/** @type {import('ts-jest').JestConfigWithTsJest} **/

// Add any custom config to be passed to Jest
const config = {
  coverageProvider: "v8",
  testEnvironment: "node",
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  preset: "ts-jest",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.mts"], // Optional: for setup files
  testPathIgnorePatterns: ["<rootDir>/node_modules/"],
  transform: {
    "^.+\\.(ts|js|mts|mjs)$": [
      "ts-jest",
      { tsconfig: "tsconfig.json", useESM: true },
    ], // Enable ESM for ts-jest
  },
  moduleFileExtensions: ["ts", "mts", "js", "mjs"], // Must include to make jest "see" what filetypes are tests
  extensionsToTreatAsEsm: [".ts", ".mts"], // Tell Jest that these extensions should be treated as ESM
  testMatch: [
    "<rootDir>/tests/*.?(m)[tj]s?(x)", // Must match directory structure
    "<rootDir>/tests/**/*.test.?(m)[tj]s?(x)", // Match test files with .test.ts, .test.js etc.
    "<rootDir>/tests/**/test.?(m)[tj]s?(x)", // Match a single test file like test.ts, test.js
  ],
  resolver: "jest-ts-webcompat-resolver",
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>/",
  }),
};

export default config;
