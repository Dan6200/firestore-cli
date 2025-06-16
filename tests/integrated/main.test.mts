import handleWhereClause from "../../utils/handle-where-clause.mjs";
import { printDocuments } from "../../utils/print/documents.mjs";
import { CollectionReference, Firestore } from "@google-cloud/firestore";
import { authenticateFirestore } from "../../auth/authenticate-firestore.mjs";
import { chalk } from "./../unit/__mocks__/chalk.mjs";
import { assert } from "console";
import { readFile } from "fs/promises";
import { resolve } from "path";

describe("`handleWhereClause` function", () => {
  let ref: CollectionReference | null = null;
  let db: Firestore | null = null;
  beforeAll(async () => {
    assert(process.env.serviceAccountKey);
    const serviceAccountKey = await readFile(
      resolve(process.env.serviceAccountKey!),
      "utf8",
    );
    db = await authenticateFirestore(serviceAccountKey); // Mock first...
    assert(db);
    ref = db!.collection("users");
    const batch = db!.batch();
    batch.set(ref.doc("document_1"), { name: "Dan", age: 24, eye: "brown" });
    batch.set(ref.doc("document_2"), { name: "Mary", age: 23, eye: "brown" });
    batch.set(ref.doc("document_3"), { name: "Dave", age: 22, eye: "black" });
    await batch.commit();
  });

  it("should be able to handle a simple where clause query", async () => {
    const whereClause = ["name", "==", "Dan"];
    const snap = await handleWhereClause(ref!, whereClause as any).get();
    const output = printDocuments(snap, chalk as any, false, 4);
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
    const snap = await handleWhereClause(ref!, whereClause as any).get();
    const output = printDocuments(snap, chalk as any, false, 4);
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
    const snap = await handleWhereClause(ref!, whereClause as any).get();
    const output = printDocuments(snap, chalk as any, false, 4);
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
    const snap = await handleWhereClause(ref!, whereClause as any).get();
    const output = printDocuments(snap, chalk as any, false, 4);
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
    const snap = await ref!.get();
    if (snap.empty) return;
    const batch = db!.batch();
    snap.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  });
});
