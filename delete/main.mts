//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { CLI_LOG } from "../utils/logging.mjs";
import { authenticateFirestore } from "../auth/authenticate-firestore.mjs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { existsSync } from "fs";
import { getFirestoreReference } from "../utils/get-firestore-reference.mjs";
import { BlockingQueue } from "../utils/algorithms/blocking-queues.js";
import {
  BulkWriterError,
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { workerPool } from "../utils/worker-pool/main.mjs";
import { discoverPaths } from "../utils/firestore/path-discoverer.mjs";
import { permissionDeniedError } from "../utils/error-handling.mjs";

// Helper function to read from stdin
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

export default async (path: string, options: Options) => {
  const spinner = ora("Authenticating...").start();
  try {
    const db = await authenticateFirestore(options);
    spinner.succeed("Authentication successful.");
    spinner.start("Initializing deletion...");
    let docsToDelete: BlockingQueue<CollectionReference | DocumentReference>;

    // 1. Check stdin
    if (!process.stdin.isTTY) {
      spinner.text = "Reading document paths from stdin...";
      const stdinData = await readStdin();
      if (stdinData) {
        docsToDelete = new BlockingQueue({
          initialItems: stdinData
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => getFirestoreReference(db, p)),
        });
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
        docsToDelete = new BlockingQueue({
          initialItems: fileContent
            .split("\n")
            .filter((p) => p.trim())
            .map((p) => getFirestoreReference(db, p)),
        });
      }
    }
    // 3. Fallback to path argument
    else {
      if (path) {
        docsToDelete = new BlockingQueue({
          initialItems: [getFirestoreReference(db, path)],
        });
        // console.log(docsToDelete);
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

    const bulkWriterOptions: {
      throttling?: { maxOpsPerSecond: number };
    } = {};
    if (options.rateLimit) {
      bulkWriterOptions.throttling = {
        maxOpsPerSecond: options.rateLimit,
      };
    }
    const bulkWriter = db.bulkWriter(bulkWriterOptions);

    let deletedCount = 0;
    bulkWriter.onWriteResult(() => {
      deletedCount++;
      spinner.text = `Processing deletions: ${deletedCount}`;
    });

    bulkWriter.onWriteError((error) => {
      if (error.code === 4) {
        // 4 is DEADLINE_EXCEEDED
        CLI_LOG(
          `Deadline exceeded for ${error.documentRef.path}. Retrying...`,
          "warn",
        );
        return true; // Return true to retry the operation
      }
      return false; // Fail for other errors
    });

    let deleteFailed = false;

    await workerPool(
      docsToDelete,
      (ref) => bulkWriter.delete(ref),
      (ref, error) => {
        if ((error as BulkWriterError).code === 7) {
          permissionDeniedError(error);
        }
        deleteFailed = true;
        if (ref instanceof DocumentReference)
          spinner.fail(`Failed to delete document: ${ref.path}`);
        spinner.fail(`Failed to delete collection: ${ref.path}`);
      },
      (text, level) =>
        level === "info"
          ? (spinner.text = `${text}\n`)
          : level !== "debug"
            ? CLI_LOG(text, level)
            : options.debug
              ? CLI_LOG(text, level)
              : false,
      {
        recursive: options.recurse,
        discoverer: (queue, ref, signal) => discoverPaths(queue, ref, signal),
      },
    );

    await bulkWriter.close();

    !deleteFailed &&
      spinner.succeed(`Successfully deleted ${deletedCount} document(s).`);
  } catch (e) {
    spinner.fail("Failed to delete document(s)!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
