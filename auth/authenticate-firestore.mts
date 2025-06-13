import { Firestore } from "@google-cloud/firestore";
import { Options } from "commander";
import { CLI_LOG } from "../utils/logging.mjs";
import { resolve } from "path";

export async function authenticateFirestore({
  serviceAccountKey: keyFile,
  databaseId,
  debug,
  emulator,
}: Options) {
  if (!keyFile && !process.env.SERVICE_ACCOUNT_KEY && !emulator)
    throw new Error(
      "Must provide Service Account key to authenticate Firestore Database",
    );
  if (!keyFile && process.env.SERVICE_ACCOUNT_KEY)
    keyFile = process.env.SERVICE_ACCOUNT_KEY;
  debug &&
    CLI_LOG(
      `Service Account Key: ${keyFile}\nDatabase Id: ${databaseId || "(default)"}`,
      "debug",
    );
  //
  let projectId: string | undefined;
  if (emulator)
    ({
      default: { project_id: projectId },
    } = await import(resolve(keyFile), {
      with: { type: "json" },
    }));

  return new Firestore({ projectId, keyFile, databaseId });
}
