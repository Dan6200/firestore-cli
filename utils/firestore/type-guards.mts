import { CollectionReference } from "@google-cloud/firestore";
import {
  DocumentSnapshot,
  QuerySnapshot,
  QueryDocumentSnapshot,
} from "@google-cloud/firestore";

export function isCollection(ref: any): ref is CollectionReference {
  return ref?.type === "collection";
}

/** Checks if the object has a .data() method and an .id property */
export function isDocSnapshot(
  snap: any,
): snap is DocumentSnapshot | QueryDocumentSnapshot {
  return snap && typeof snap.data === "function" && "id" in snap;
}

/** Checks if it's a QuerySnapshot (has .docs and .forEach) */
export function isQuerySnapshot(snap: any): snap is QuerySnapshot {
  return snap && typeof snap.forEach === "function" && Array.isArray(snap.docs);
}
