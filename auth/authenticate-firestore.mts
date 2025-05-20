import { Firestore } from "@google-cloud/firestore";
import { resolve } from "path";
import { ENV_INFO } from "./file-paths.mjs";

export async function authenticateFirestore(
  keyFile: string,
  useServiceAccount: boolean,
  databaseId?: string,
) {
  const {
    default: { projectId },
  } = await import(resolve(useServiceAccount ? keyFile : ENV_INFO), {
    with: { type: "json" },
  });
  //
  return new Firestore({ projectId, keyFile, databaseId });
}
