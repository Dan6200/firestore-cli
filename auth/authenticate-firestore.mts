import { Firestore } from "@google-cloud/firestore";
import { Options } from "commander";
import { CLI_LOG } from "../utils/logging.mjs";
import { resolve } from "path";
import { readFile } from "fs/promises";

export async function authenticateFirestore({
  serviceAccountKey: keyFile,
  databaseId,
  debug,
  emulator,
}: Options) {
  if (
    !keyFile &&
    !process.env.SERVICE_ACCOUNT_KEY &&
    !process.env.GOOGLE_APPLICATION_CREDENTIALS &&
    !emulator
  )
    throw new Error(
      "Must provide Service Account key to authenticate Firestore Database",
    );
  debug &&
    CLI_LOG(
      `Service Account Key: ${keyFile}\nDatabase Id: ${databaseId || "(default)"}`,
      "debug",
    );
  //
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return new Firestore();

  let projectId: string | undefined;
  if (emulator)
    // Use a dummy key file that only contains the project ID.
    projectId = await readFile(resolve(keyFile), "utf8");

  let firestore;
  if (process.env.SERVICE_ACCOUNT_KEY) {
    const {
      project_id: projectId,
      client_email,
      private_key,
    } = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
    const credentials = {
      client_email,
      private_key: private_key.replace(/\\n/g, "\n"),
    };
    firestore = new Firestore({
      projectId,
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      databaseId,
    });
    return firestore;
  }
  firestore = new Firestore({ keyFile, databaseId });
  return firestore;
}
