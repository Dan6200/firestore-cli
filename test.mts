import { handleAuthFile } from "./utils/auth.mjs";
import handleWhereClause from "./utils/handle-where-clause.mjs";
import { printDocuments, printObj } from "./utils/print.mjs";
import { jest } from "@jest/globals";
import { MockChalk } from "./types-and-interfaces.mjs";
import { CollectionReference, Firestore } from "@google-cloud/firestore";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";

const chalk: MockChalk = {
  green: jest.fn((text: string) => text),
  blue: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  gray: jest.fn((text: string) => text),
};

describe("`printObj` function", () => {
  it("should properly format a simple object", () => {
    const obj = { name: "Alice", age: 30 };
    const output = printObj(obj, 0, "    ", chalk as any);
    expect(chalk.green).toHaveBeenCalledWith("'Alice'");
    expect(chalk.blue).toHaveBeenCalledWith("30");
    expect(output).toBe(
      `
{
    name: 'Alice',
    age: 30
}`.trim(),
    );
  });
  it("should correctly handle nested objects", () => {
    const obj = { name: "Alice", address: { city: "Wonderland", zip: 1234 } };
    const output = printObj(obj, 0, "    ", chalk as any);
    expect(chalk.green).toHaveBeenCalledWith("'Alice'");
    expect(chalk.green).toHaveBeenCalledWith("'Wonderland'");
    expect(chalk.blue).toHaveBeenCalledWith("1234");
    expect(output).toBe(
      `
{
    name: 'Alice',
    address: {
        city: 'Wonderland',
        zip: 1234
    }
}`.trim(),
    );
  });
  it("should correctly handle array objects", () => {
    const obj = {
      name: "Alice",
      address: { city: "Wonderland", zip: 1234 },
      friends: ["Dinah the cat", "The white rabbit", "The mad hatter"],
    };
    const output = printObj(obj, 0, "    ", chalk as any);
    expect(chalk.green).toHaveBeenCalledWith("'Alice'");
    expect(chalk.green).toHaveBeenCalledWith("'Wonderland'");
    expect(chalk.blue).toHaveBeenCalledWith("1234");
    expect(output).toBe(
      `
{
    name: 'Alice',
    address: {
        city: 'Wonderland',
        zip: 1234
    },
    friends: [
        "Dinah the cat",
        "The white rabbit",
        "The mad hatter"
    ]
}`.trim(),
    );
  });
});

describe("`handleWhereClause` function", () => {
  let ref: CollectionReference | null = null;
  let db: Firestore | null = null;
  beforeAll(async () => {
    const serviceAccountKey = handleAuthFile(null);
    db = await authenticateFirestore(serviceAccountKey, false);
    ref = db.collection("users");
    const batch = db.batch();
    batch.set(ref.doc("document_1"), { name: "Dan", age: 24, eye: "brown" });
    batch.set(ref.doc("document_2"), { name: "Mary", age: 23, eye: "brown" });
    batch.set(ref.doc("document_3"), { name: "Dave", age: 22, eye: "black" });
    await batch.commit();
  });

  it("should be able to handle a simple where clause query", async () => {
    const whereClause = ["name", "==", "Dan"];
    const snap = await handleWhereClause(ref, whereClause as any).get();
    const output = printDocuments(snap, chalk, false, 4);
    expect(output).toBe(
      `
[

    document_1 => {
        name: 'Dan',
        age: 24,
        eye: 'brown'
    }

]`.trim(),
    );
  });

  it("should be able to handle a disjunct pair of clauses", async () => {
    const whereClause = ["name", "==", "Dave", "or", "name", "==", "Mary"];
    const snap = await handleWhereClause(ref, whereClause as any).get();
    const output = printDocuments(snap, chalk, false, 4);
    expect(output).toBe(
      `
[

    document_2 => {
        name: 'Mary',
        age: 23,
        eye: 'brown'
    },

    document_3 => {
        name: 'Dave',
        age: 22,
        eye: 'black'
    }

]`.trim(),
    );
  });

  it("should be able to handle a combination of fields, operators and values as well as AND and OR operators", async () => {
    const whereClause = [
      "name",
      "==",
      "Dan",
      "and",
      "age",
      "!=",
      24,
      "or",
      "name",
      "==",
      "Dave",
      "and",
      "age",
      "!=",
      24,
    ];
    const snap = await handleWhereClause(ref, whereClause as any).get();
    const output = printDocuments(snap, chalk, false, 4);
    expect(output).toBe(
      `
[

    document_3 => {
        name: 'Dave',
        age: 22,
        eye: 'black'
    }

]`.trim(),
    );
  });

  it("should be able to handle a combination of fields, operators and values as well as AND and OR operators 2", async () => {
    const whereClause = [
      "eye",
      "==",
      "black",
      "and",
      "age",
      "!=",
      24,
      "or",
      "eye",
      "==",
      "brown",
      "and",
      "age",
      "!=",
      24,
    ];
    const snap = await handleWhereClause(ref, whereClause as any).get();
    const output = printDocuments(snap, chalk, false, 4);
    expect(output).toBe(
      `
[

    document_2 => {
        name: 'Mary',
        age: 23,
        eye: 'brown'
    }

]`.trim(),
    );
  });
  afterAll(async () => {
    const snap = await ref.get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });
});
