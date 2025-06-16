import { jest } from "@jest/globals";

// Mock Firestore instance
export default {
  doc: jest.fn(),
  collection: jest.fn(),
};
