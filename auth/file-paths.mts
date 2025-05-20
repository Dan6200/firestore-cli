import path from "path";
import os from "os";

export const PLATFORM = os.platform();

export const APP_CONFIG_DIR = path.resolve(
  ...(PLATFORM === "win32"
    ? [process.env.APPDATA || "", "firestore-cli"]
    : [process.env.HOME || "", ".config", "firestore-cli"]),
);

export const TOKEN_PATH = path.resolve(
  ...(PLATFORM === "win32"
    ? [process.env.APPDATA || "", "firestore-cli", "token.json"]
    : [process.env.HOME || "", ".config", "firestore-cli", "token.json"]),
);

export const SERVICE_ACCOUNT_KEY = path.resolve(
  ...(PLATFORM === "win32"
    ? [process.env.APPDATA || "", "firestore-cli", "service-account"]
    : [process.env.HOME || "", ".config", "firestore-cli", "service-account"]),
);

export const CREDENTIALS = path.resolve(
  ...(PLATFORM === "win32"
    ? [process.env.APPDATA || "", "firestore-cli", "credentials"]
    : [process.env.HOME || "", ".config", "firestore-cli", "credentials"]),
);

export const ENV_INFO = path.resolve(
  ...(PLATFORM === "win32"
    ? [process.env.APPDATA || "", "firestore-cli", "env-info.json"]
    : [process.env.HOME || "", ".config", "firestore-cli", "env-info.json"]),
);
