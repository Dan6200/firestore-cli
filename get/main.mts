//cspell:disable
import ora, { Ora } from "ora";
import { Options } from "commander";
import { DocumentReference } from "@google-cloud/firestore";
import { CLI_LOG } from "../utils/logging.mjs";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";
import { getFirestoreReference } from "../utils/get-firestore-reference.mjs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { existsSync } from "fs";
import { readStdin } from "./utils/read-stdin.mjs";
import { handleGetFromInput } from "./utils/handle-input-get.mjs";
import { handleStreamedGet } from "./utils/handle-streamed-get.mjs";
import { handleSnapshotGet } from "./utils/handle-snapshot-get.mjs";

export default async (path: string, options: Options) => {
  let spinner: Ora = null;
  let db: FirebaseFirestore.Firestore = null;
  try {
    spinner = ora("Authenticating Firestore DB").start();
    const db = await authenticateFirestore(options);
    spinner.succeed("Successfully authenticated!");

    let pathsToGet: string[] = [];
    let isFromInput = false;

    if (!process.stdin.isTTY) {
      isFromInput = true;
      spinner.text = "Reading document paths from stdin...";
      const stdinData = await readStdin();
      if (stdinData) {
        pathsToGet = stdinData.split("\n").filter((p) => p.trim());
      }
    } else if (options.file) {
      isFromInput = true;
      spinner.text = `Reading document paths from file: ${options.file}...`;
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(`Invalid file path for --file option: ${inputFile}`);
      }
      const fileContent = await readFile(resolve(inputFile), "utf8");
      if (fileContent) {
        pathsToGet = fileContent.split("\n").filter((p) => p.trim());
      }
    }

    if (isFromInput) {
      await handleGetFromInput(pathsToGet, db, options, spinner);
    } else {
      if (!path) {
        throw new Error(
          "A path is required when not reading from stdin or a file.",
        );
      }
      const ref = getFirestoreReference(db, path);
      spinner = ora("Fetching documents from " + path + "\n").start();
      spinner.succeed;

      if (options.stream && !(ref instanceof DocumentReference)) {
        await handleStreamedGet(ref, options, spinner);
      } else {
        await handleSnapshotGet(ref, options, spinner);
      }
    }
  } catch (error) {
    if (spinner) spinner.fail("An unexpected error occurred.");
    CLI_LOG(error.toString(), "error");
    process.exitCode = 1;
    return;
  } finally {
    await db?.terminate();
    process.stdout.write("", () => {
      process.exit(process.exitCode || 0);
    });
    process.stdout.end();
  }
};
