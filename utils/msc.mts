import fs from "fs";
import path from "path";
import { CLI_LOG } from "./logging.mjs";
import { getInput } from "./interactive.mjs";

export async function saveKeyToFile(
  privateKeyData: string,
  date: string,
  oldKeyFile?: string,
) {
  const filePath = await getInput("File path for Service Account key file: ");
  const key = Buffer.from(privateKeyData, "base64").toString("utf-8");
  const keyFile =
    oldKeyFile ??
    path.resolve(
      filePath,
      `service-account-key-${date.replace(":", "-")}.json`,
    );
  fs.writeFileSync(keyFile, key, "utf-8");
  CLI_LOG(`Service account key saved to ${keyFile}`);
}
