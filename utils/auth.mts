import { existsSync, readdirSync, statSync } from "fs";
import { Options } from "commander";
import path from "path";
import { CREDENTIALS, SERVICE_ACCOUNT_KEY } from "../auth/file-paths.mjs";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";

export function handleAuthFile(
  type: "Service Account Key" | "Credentials",
  authFilePath?: string,
) {
  const isCred = type === "Credentials";
  const dirPath = isCred ? CREDENTIALS : SERVICE_ACCOUNT_KEY;
  if (!authFilePath) {
    const directoryExists =
      existsSync(dirPath) && statSync(dirPath).isDirectory();
    if (!directoryExists)
      throw new Error(
        `${dirPath} directory not found.\nPlease ensure you have run \`firestore-cli init\` and follow the guide to get the credentials JSON file before running this command`,
      );
    const authFileDir = readdirSync(dirPath);
    const files = authFileDir.filter((file) => file.endsWith(".json"));
    if (files.length === 0)
      throw new Error(
        `No ${
          isCred ? "OAuth Credentials JSON" : "Service Account key"
        } file found. \nPlease ensure you have run \`firestore-cli init\` and follow the guide to get the credentials JSON file before running this command.\nOr use a Service Account key from Google Cloud.`,
      );
    if (files.length > 1)
      throw new Error(
        `Multiple ${
          isCred ? "OAuth credentials.json files" : "Service Account keys"
        } found. There must be only one file available at the \`${
          isCred ? CREDENTIALS : SERVICE_ACCOUNT_KEY
        }/\` directory`,
      );
    return path.join(dirPath, files[0]);
  }
  if (!existsSync(authFilePath) || !statSync(authFilePath).isFile())
    throw new Error(
      `Invalid ${type} ${isCred ? "file" : "key"} provided: ` + authFilePath,
    );
  return authFilePath;
}

export const authenticateHelper = async ({
  serviceAccountKey: serviceAccountPath,
  databaseId,
}: Options) => {
  const serviceAccount = handleAuthFile("Credentials", serviceAccountPath);
  return authenticateFirestore(
    serviceAccount,
    !!serviceAccountPath,
    databaseId,
  );
};
