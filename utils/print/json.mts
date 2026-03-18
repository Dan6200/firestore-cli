import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  QuerySnapshot,
} from "@google-cloud/firestore";
import { Options } from "commander";
import { isDocSnapshot, isQuerySnapshot } from "../firestore/type-guards.mjs";

export function printJSON(
  snapshot:
    | DocumentSnapshot
    | QuerySnapshot
    | DocumentSnapshot[]
    | QueryDocumentSnapshot[],
  options: Options,
) {
  const whiteSpace = options.whiteSpace ?? 2;

  // 1. Handle Array of Snapshots
  if (Array.isArray(snapshot)) {
    const snapArray = snapshot.map((doc) => ({
      id: doc.id,
      // We check for the method because of the potential 'Firestore2' issue
      data:
        typeof doc.data === "function" ? doc.data() : (doc as any)._fieldsProto,
    }));
    return JSON.stringify(snapArray, null, whiteSpace);
  }

  // 2. Handle QuerySnapshot
  if (isQuerySnapshot(snapshot)) {
    const snapArray: any[] = [];
    snapshot.forEach((doc) => snapArray.push({ id: doc.id, data: doc.data() }));
    return JSON.stringify(snapArray, null, whiteSpace);
  }

  // 3. Handle Single DocumentSnapshot
  if (isDocSnapshot(snapshot)) {
    return JSON.stringify(
      { id: snapshot.id, data: snapshot.data() },
      null,
      whiteSpace,
    );
  }

  throw new Error(
    "Provided input is not a recognized Firestore Snapshot type.",
  );
}
