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
  snop: any,
): snop is DocumentSnapshot | QueryDocumentSnapshot {
  return snop && typeof snop.data === "function" && "id" in snop;
}

/** Checks if it's a QuerySnapshot (has .docs and .forEach) */
export function isQuerySnapshot(snop: any): snop is QuerySnapshot {
  return snop && typeof snop.forEach === "function" && Array.isArray(snop.docs);
}
