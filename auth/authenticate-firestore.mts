import { Firestore } from "@google-cloud/firestore";
import { resolve } from "path";

export async function authenticateFirestore(
  keyFile: string,
  databaseId?: string,
) {
  const {
    default: { projectId },
  } = await import(resolve(keyFile), {
    with: { type: "json" },
  });
  //
  return new Firestore({ projectId, keyFile, databaseId });
}
