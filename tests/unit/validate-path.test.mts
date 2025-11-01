import { jest } from "@jest/globals";
import { getFirestoreReference } from "../../utils/get-firestore-reference.mjs";
import mockDb from "./__mocks__/db.mjs";

describe("getFirestoreReference", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("valid document paths", () => {
    it("should return doc reference for simple document", () => {
      const path = "users/user1";
      getFirestoreReference(mockDb as any, path);
      expect(mockDb.doc).toHaveBeenCalledWith(path);
    });

    it("should return doc reference for nested document", () => {
      const path = "projects/proj1/documents/doc1";
      getFirestoreReference(mockDb as any, path);
      expect(mockDb.doc).toHaveBeenCalledWith(path);
    });

    it("should allow special characters in path", () => {
      const paths = [
        "users/user@domain.com",
        "projects/project-1",
        "data/field($value)",
        "items/item+plus",
      ];

      paths.forEach((path) => {
        getFirestoreReference(mockDb as any, path);
        expect(mockDb.doc).toHaveBeenCalledWith(path);
        jest.clearAllMocks();
      });
    });
  });

  describe("valid collection paths", () => {
    it("should return collection reference for root collection", () => {
      const path = "users";
      getFirestoreReference(mockDb as any, path);
      expect(mockDb.collection).toHaveBeenCalledWith(path);
    });

    it("should return collection reference for nested collection", () => {
      const path = "users/user1/orders";
      getFirestoreReference(mockDb as any, path);
      expect(mockDb.collection).toHaveBeenCalledWith(path);
    });

    it("should return collection reference for deeply nested collection", () => {
      const path = "users/user1/orders/order1/items";
      getFirestoreReference(mockDb as any, path);
      expect(mockDb.collection).toHaveBeenCalledWith(path);
    });
  });

  describe("invalid paths", () => {
    it("should throw error for empty path", () => {
      expect(() => getFirestoreReference(mockDb as any, "")).toThrow(
        "Path must be a non-empty string. Got :",
      );
    });

    it("should throw error for trailing slash", () => {
      expect(() => getFirestoreReference(mockDb as any, "users/")).toThrow(
        "Malformed paths",
      );
    });

    it("should throw error for consecutive slashes", () => {
      expect(() =>
        getFirestoreReference(mockDb as any, "users//user1"),
      ).toThrow("Malformed paths");
    });

    it("should throw error for spaces in path", () => {
      expect(() =>
        getFirestoreReference(mockDb as any, "users/user 1"),
      ).toThrow("Malformed paths");
    });

    it("should throw error for special characters not allowed", () => {
      expect(() =>
        getFirestoreReference(mockDb as any, "users/user#1"),
      ).toThrow("Malformed paths");
    });
  });
});
