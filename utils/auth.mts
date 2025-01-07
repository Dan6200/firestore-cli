import { existsSync, readdirSync, statSync } from "fs";
import { Options } from "commander";
import path from "path";
import { SERVICE_ACCOUNT, CREDENTIALS } from "../auth/file-paths.mjs";
import { authenticateFirestore } from "../auth/service-account.mjs";

export function handleSecretKey(
  secretKey: string | null,
  secretType: "Service Account" | "Credentials"
) {
  const secret = secretType === "Credentials" ? CREDENTIALS : SERVICE_ACCOUNT;
  if (!secretKey) {
    const directoryExists =
      existsSync(secret) && statSync(secret).isDirectory();
    if (!directoryExists)
      throw new Error(
        `${
          secretType === "Service Account"
            ? "Service Account"
            : "OAuth2 credentials"
        } directory not found. Please ensure you have run \`firestore-cli init\` before running this command`
      );
    const secretKeyDir = readdirSync(secret);
    const files = secretKeyDir.filter((file) => file.endsWith(".json"));
    if (!files)
      throw new Error(
        `No ${
          secretType === "Credentials"
            ? "OAuth2 credentials JSON"
            : "Service Account key"
        } file found. Please place your JSON file in the \`~/.config/firestore-cli/${
          secretType === "Credentials" ? "credentials" : "service-account"
        }\` directory or provide a file path using the --service-account flag.`
      );
    if (files.length > 1)
      throw new Error(
        `Multiple ${
          secretType === "Credentials"
            ? "OAuth2 credentials files"
            : "Service Account keys"
        } found. There must be only one key file available at the \`~/.firestore-cli/${
          secretType === "Credentials" ? "credentials" : "service-account"
        }/\` directory`
      );
    return path.resolve(SERVICE_ACCOUNT, files[0]);
  }
  if (!existsSync(secretKey))
    throw new Error(
      "Invalid Service Account key file path provided: " + secretKey
    );
  return secretKey;
}

export function handleCredentials(credentials: string | null) {
  if (!credentials) {
    const directoryExists =
      existsSync(CREDENTIALS) && statSync(CREDENTIALS).isDirectory();
    if (!directoryExists)
      throw new Error(
        "OAuth2 credentials directory not found. Please ensure you have run `firestore-cli init` before running this command"
      );
    const credentialsDir = readdirSync(CREDENTIALS);
    const files = credentialsDir.filter((file) => file.endsWith(".json"));
    if (!files)
      throw new Error(
        "No OAuth2 credentials file found. Please place your credentials JSON file in the `~/.config/firestore-cli/credentials` directory or provide a file path using the --credentials flag."
      );
    if (files.length > 1)
      throw new Error(
        "Multiple OAuth2 credentials files found. There must be only one JSON file available at the `~/.firestore-cli/credentials/` directory"
      );
    return path.join(CREDENTIALS, files[0]);
  }
  if (!existsSync(credentials))
    throw new Error("Invalid credentials file path provided: " + credentials);
  return credentials;
}

export const authenticateHelper = async ({
  credentials,
  serviceAccount: serviceAccPath,
  databaseId,
  useServiceAcc,
}: Options) => {
  if (useServiceAcc) {
    const serviceAccount = handleSecretKey(serviceAccPath, "Service Account");
    return await authenticateFirestore(serviceAccount, databaseId);
  }
};
