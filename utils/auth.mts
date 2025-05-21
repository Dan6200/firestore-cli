import { existsSync, readdirSync, statSync } from "fs";
import { Options } from "commander";
import path from "path";
import { CREDENTIALS } from "../auth/file-paths.mjs";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";

/* TODO: fix this to do without hard coded SA key fp **/
export function handleAuthFile(authFilePath?: string) {
  const dirPath = CREDENTIALS;
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
        `No "OAuth Credentials JSON" file found. \nPlease ensure you have run \`firestore-cli init\` and follow the guide to get the credentials JSON file before running this command.\nOr use a Service Account key from Google Cloud.`,
      );
    if (files.length > 1)
      throw new Error(
        `Multiple "OAuth credentials.json files" found. There must be only one file available at the \`${dirPath}/\` directory`,
      );
    return path.join(dirPath, files[0]);
  }
  if (!existsSync(authFilePath) || !statSync(authFilePath).isFile())
    throw new Error(`Invalid Credentials file provided: ` + authFilePath);
  return authFilePath;
}

export const authenticateHelper = async ({
  serviceAccountKey: serviceAccountPath,
  databaseId,
}: Options) => {
  const serviceAccount = handleAuthFile(serviceAccountPath);
  return authenticateFirestore(
    serviceAccount,
    !!serviceAccountPath,
    databaseId,
  );
};
