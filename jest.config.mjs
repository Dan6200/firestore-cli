/** @type {import('jest').Config} */
const config = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/built/tests/**/*.mjs"],
  testPathIgnorePatterns: ["__mocks__"],
};

export default config;
