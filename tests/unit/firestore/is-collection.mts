import { isCollection } from "../../../utils/firestore-utils.mjs";

describe("isCollection Type Guard", () => {
  it("should return true for a valid collection reference", () => {
    const mockCollection = { type: "collection", id: "users" };
    expect(isCollection(mockCollection)).toBe(true);
  });

  it("should return false for a document reference", () => {
    const mockDoc = { type: "document", id: "user_123" };
    expect(isCollection(mockDoc)).toBe(false);
  });

  it("should return false for null or undefined", () => {
    expect(isCollection(null)).toBe(false);
    expect(isCollection(undefined)).toBe(false);
  });
});
