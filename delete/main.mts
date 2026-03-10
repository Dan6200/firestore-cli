//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { CLI_LOG } from "../utils/logging.mjs";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { existsSync } from "fs";
import { getDocumentReference } from "../utils/get-firestore-reference.mjs";
import { BlockingQueue } from "../utils/algorithms/blocking-queues.js";
import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { processQueue } from "./utils.mjs";

// Helper function to read from stdin
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

export default async (path: string, options: Options) => {
  const spinner = ora("Deleting document(s)...").start();
  try {
    const db = await authenticateFirestore(options);
    let docsToDelete: BlockingQueue<CollectionReference | DocumentReference>;

    // 1. Check stdin
    if (!process.stdin.isTTY) {
      spinner.text = "Reading document paths from stdin...";
      const stdinData = await readStdin();
      if (stdinData) {
        docsToDelete = new BlockingQueue(
          stdinData
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => getDocumentReference(db, p)),
        );
      }
    }
    // 2. Check --file
    else if (options.file) {
      spinner.text = `Reading document paths from file: ${options.file}...`;
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          `Invalid file path for the --file option: ${inputFile}`,
        );
      }
      const fileContent = await readFile(resolve(inputFile), "utf8");
      if (fileContent) {
        docsToDelete = new BlockingQueue(
          fileContent
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => getDocumentReference(db, p)),
        );
      }
    }
    // 3. Fallback to path argument
    else {
      if (path) {
        docsToDelete.enqueue(getDocumentReference(db, path));
      } else {
        throw new Error(
          "A document path or file is required when not reading from stdin.",
        );
      }
    }

    if (docsToDelete.size === 0) {
      spinner.succeed("No documents to delete.");
      return;
    }

    spinner.text = `Deleting ${docsToDelete.size} document(s)...`;

    const bulkWriterOptions: {
      throttling?: { maxOpsPerSecond: number };
    } = {};
    if (options.rateLimit) {
      bulkWriterOptions.throttling = {
        maxOpsPerSecond: options.rateLimit,
      };
    }
    const bulkWriter = db.bulkWriter(bulkWriterOptions);

    await processQueue(docsToDelete, options.recurse, bulkWriter.delete);

    await bulkWriter.close();

    // spinner.succeed(
    //   `Successfully deleted ${docsToDelete.length} document(s).`,
    // );
  } catch (e) {
    spinner.fail("Failed to delete document(s)!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
