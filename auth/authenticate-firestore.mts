import { Firestore } from "@google-cloud/firestore";
import { Options } from "commander";
import { CLI_LOG } from "../utils/logging.mjs";

export async function authenticateFirestore({
  serviceAccountKey: keyFile,
  databaseId,
  debug,
}: Options) {
  if (!keyFile)
    throw new Error(
      "Must provide Service Account key to authenticate Firestore Database",
    );
  debug &&
    CLI_LOG(
      `Service Account Key: ${keyFile}\nDatabase Id: ${databaseId || "(default)"}`,
      "debug",
    );
  //
  return new Firestore({ keyFile, databaseId });
}
