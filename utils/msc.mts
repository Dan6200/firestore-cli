import fs from "fs";
import path from "path";
import { SERVICE_ACCOUNT_KEY } from "../auth/file-paths.mjs";
import { CLI_LOG } from "./logging.mjs";

export function saveKeyToFile(
  privateKeyData: string,
  date: string,
  oldKeyFile?: string,
) {
  const key = Buffer.from(privateKeyData, "base64").toString("utf-8");
  const keyFile =
    oldKeyFile ??
    path.resolve(
      SERVICE_ACCOUNT_KEY,
      `service-account-key-${date.replace(":", "-")}.json`,
    );
  fs.writeFileSync(keyFile, key, "utf-8");
  CLI_LOG(`Service account key saved to ${keyFile}`);
}
