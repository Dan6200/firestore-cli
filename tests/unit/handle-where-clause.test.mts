// handleWhereClause.test.ts
import { jest } from "@jest/globals";
import { Condition } from "commander";

// 1. Mock the "Leaf" (FieldFilter)
// Firestore uses 'field', 'operator', and 'value'
const mockWhere = jest.fn((field, operator, value) => ({
  field,
  operator,
  value,
}));

// 2. Mock the "Branches" (CompositeFilter)
// Firestore uses 'filters' (array) and 'operator' (uppercase string)
const mockAnd = jest.fn((...args) => ({
  filters: args.flat(),
  operator: "AND",
}));

const mockOr = jest.fn((...args) => ({
  filters: args.flat(),
  operator: "OR",
}));

// 3. The Module Mock
jest.unstable_mockModule("@google-cloud/firestore", () => ({
  Filter: {
    where: mockWhere,
    and: mockAnd,
    or: mockOr,
  },
  // Ensure these exist for type checking/instanceof
  Query: class {
    where = jest.fn().mockReturnThis();
  },
  CollectionReference: class {
    where = jest.fn().mockReturnThis();
  },
}));
const { Filter } = await import("@google-cloud/firestore");
const { default: handleWhereClause } = await import(
  "../../query/utils/where-clause-parsing.mjs"
);

describe("handleWhereClause", () => {
  let mockRef: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create a mock Query/CollectionReference
    mockRef = {
      where: jest.fn().mockReturnThis(),
    };
  });
  it("should handle a single where clause directly", () => {
    const clause = ["status", "==", "active"];
    handleWhereClause(mockRef, clause as any);

    expect(mockRef.where).toHaveBeenCalledWith({
      field: "status",
      operator: "==",
      value: "active",
    });
  });

  it("should handle AND for multiple clauses", () => {
    const clauses = ["age", ">", 21, "and", "status", "==", "active"];
    handleWhereClause(mockRef, clauses as any);

    expect(Filter.and).toHaveBeenCalled();
    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "AND" }),
    );
  });

  it("should handle explicit OR logic", () => {
    const clauses = ["role", "==", "admin", "or", "role", "==", "editor"];
    handleWhereClause(mockRef, clauses as any);

    expect(Filter.or).toHaveBeenCalled();
    const callArgs = (Filter.or as jest.Mock).mock.calls[0];
    expect(callArgs.length).toBe(2);
  });

  it("should handle complex nested conditions", () => {
    const complexQuery = [
      "category",
      "==",
      "tech",
      "or",
      "price",
      "<",
      100,
      "and",
      "onSale",
      "==",
      true,
    ];

    handleWhereClause(mockRef, complexQuery as any);

    expect(Filter.and).toHaveBeenCalled();
    expect(Filter.or).toHaveBeenCalled();
    // The top-level wrapper should be the OR
    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );
  });

  it("should handle some more complex nested conditions", () => {
    const complexQuery = [
      "category",
      "==",
      "tech",
      "or",
      "price",
      "<",
      100,
      "and",
      "onSale",
      "==",
      true,
    ];

    handleWhereClause(mockRef, complexQuery as any);

    expect(Filter.and).toHaveBeenCalled();
    expect(Filter.or).toHaveBeenCalled();
    // The top-level wrapper should be the OR
    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );
  });

  it("should return the original ref if the condition is empty", () => {
    const result = handleWhereClause(mockRef, [] as unknown as Condition);
    expect(result).toBe(mockRef);
    expect(mockRef.where).not.toHaveBeenCalled();
  });

  it("should throw an error for invalid structures", () => {
    const invalid = ["broken"];
    expect(() => handleWhereClause(mockRef, invalid as any)).toThrow();
  });

  it("should handle implicit AND (missing 'and' keyword)", () => {
    const clauses = ["age", ">", 21, "status", "==", "active"];

    handleWhereClause(mockRef, clauses as any);

    expect(mockAnd).toHaveBeenCalled();
    const callArgs = mockAnd.mock.calls[0];

    // It should have gathered two Filter.where results
    expect(callArgs.length).toBe(2);
    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "AND" }),
    );
  });

  it("should verify OR is the ancestor of AND (Standard Precedence)", () => {
    const clauses = [
      "status",
      "==",
      "active",
      "and",
      "role",
      "==",
      "admin",
      "or",
      "role",
      "==",
      "editor",
    ];

    handleWhereClause(mockRef, clauses as any);

    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );
    expect(mockAnd).toHaveBeenCalled();
  });

  it("should handle mixed implicit ANDs with an explicit OR", () => {
    // [A, B, or, C] => OR( AND(A, B), C )
    const clauses = [
      "deleted",
      "==",
      false, // A
      "active",
      "==",
      true, // B (Implicit AND with A)
      "or",
      "isAdmin",
      "==",
      true, // C
    ];

    handleWhereClause(mockRef, clauses as any);

    // Root should be OR
    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );

    // Should have a nested AND for the first two clauses
    expect(mockAnd).toHaveBeenCalled();
  });

  it("should group back-to-back triplets as an implicit AND", () => {
    // [A, B, C, D, E, F] -> Implicitly (A==B) AND (D==E)
    const clauses = ["status", "==", "active", "age", ">", 21];

    handleWhereClause(mockRef, clauses as any);

    // Success here means your recursion identified the second triplet
    // without needing the "and" string.
    expect(mockAnd).toHaveBeenCalled();

    // Verify the 'where' call on the ref happened with the 'and' filter
    expect(mockRef.where).toHaveBeenCalledWith(
      expect.objectContaining({ operator: "AND" }),
    );
  });
  it("should resolve AND first and then pipe it into the OR", () => {
    const clauses = [
      "status",
      "==",
      "active",
      "or",
      "role",
      "==",
      "admin",
      "and",
      "level",
      ">",
      5,
    ];

    handleWhereClause(mockRef, clauses as any);

    expect(mockAnd).toHaveBeenCalled();
    expect(mockOr).toHaveBeenCalled();
    expect(mockRef.where).toHaveBeenLastCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );
  });

  it("should throw an error if a triplet is incomplete", () => {
    const invalid = ["status", "==", "active", "and", "age", ">"];

    expect(() => handleWhereClause(mockRef, invalid as any)).toThrow();
  });
  it("should handle implicit AND by grouping sequential triplets", () => {
    const clauses = ["status", "==", "active", "deleted", "==", false];

    handleWhereClause(mockRef, clauses as any);

    expect(mockAnd).toHaveBeenCalled();
    const andArgs = (mockAnd as jest.Mock).mock.calls[0];
    // .flat() in the mock ensures these are the two FieldFilters
    expect(andArgs.length).toBe(2);
  });

  it("should reduce AND to a Filter and use it as an operand for OR", () => {
    const clauses = [
      "active",
      "==",
      true,
      "role",
      "==",
      "admin",
      "or",
      "tier",
      "==",
      "gold",
    ];

    handleWhereClause(mockRef, clauses as any);

    // Updated from 'f' to 'field'
    expect(mockAnd).toHaveBeenCalledWith(
      expect.objectContaining({ field: "active" }),
      expect.objectContaining({ field: "role" }),
    );

    expect(mockOr).toHaveBeenCalled();
    expect(mockRef.where).toHaveBeenLastCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );
  });

  it("should reduce AND to a Filter and use it as an operand for OR", () => {
    const clauses = [
      "active",
      "==",
      true,
      "or",
      "role",
      "==",
      "admin",
      "and",
      "tier",
      "==",
      "gold",
    ];

    handleWhereClause(mockRef, clauses as any);

    // Updated from 'f' to 'field'
    expect(mockAnd).toHaveBeenCalledWith(
      expect.objectContaining({ field: "role" }),
      expect.objectContaining({ field: "tier" }),
    );

    expect(mockOr).toHaveBeenCalled();
    expect(mockRef.where).toHaveBeenLastCalledWith(
      expect.objectContaining({ operator: "OR" }),
    );
  });
});
