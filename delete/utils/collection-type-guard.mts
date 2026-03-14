import { CollectionReference } from "@google-cloud/firestore";

export function isCollection(ref: any): ref is CollectionReference {
  return ref.type === "collection";
}
