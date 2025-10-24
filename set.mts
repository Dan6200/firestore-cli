//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { createReadStream, existsSync } from "fs";
import { resolve } from "path";
import { createInterface } from "readline";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";

// --- Helper for streaming bulk writes from a file or stdin ---
async function streamBulkSet(
  inputStream: NodeJS.ReadableStream,
  db: FirebaseFirestore.Firestore,
  options: Options,
  path: string, // Base path from CLI
) {
  const bulkWriter = db.bulkWriter({
    throttling: options.rateLimit
      ? { maxOpsPerSecond: options.rateLimit }
      : false,
  });

  const rl = createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  });

  let lineCount = 0;
  const spinner = ora("Processing stream...").start();

  rl.on("line", (line) => {
    if (line.trim() === "") return;
    lineCount++;
    spinner.text = `Processed ${lineCount} lines...`;

    try {
      const item = JSON.parse(line);
      let docRef: DocumentReference;
      let docData: any;

      if (typeof item.data === "object" && item.data !== null) {
        docData = item.data;
      } else {
        const { id, path, data, ...rest } = item;
        docData = rest;
      }

      if (typeof item.path === "string") {
        const finalPath = path ? `${path}/${item.path}` : item.path;
        docRef = db.doc(finalPath);
      } else if (typeof item.id === "string") {
        if (!path) {
          throw new Error(
            "A base collection path is required when using 'id' fields.",
          );
        }
        docRef = db.collection(path).doc(item.id);
      } else {
        if (!path) {
          throw new Error(
            "A base collection path is required for items with no 'path' or 'id' field.",
          );
        }
        docRef = db.collection(path).doc();
      }

      bulkWriter.set(docRef, docData, { merge: options.merge });
    } catch (e) {
      rl.close(); // Stop reading on error
      bulkWriter.close(); // Attempt to close writer
      spinner.fail(`Error on line ${lineCount}: ${e.message}`);
      process.exitCode = 1;
    }
  });

  await new Promise<void>((resolve, reject) => {
    rl.on("close", () => {
      spinner.text = "File stream closed. Finalizing writes...";
      resolve();
    });
    rl.on("error", reject);
  });

  if (process.exitCode === 1) return; // Don't proceed if line parsing failed

  await bulkWriter.close();
  spinner.succeed(`Successfully processed ${lineCount} documents.`);
}

// --- Main Command ---
export default async (path: string, data: string, options: Options) => {
  const spinner = ora("Initializing...").start();
  try {
    const db = await authenticateFirestore(options);
    spinner.succeed("Authentication successful.");

    // --- Input Source Determination ---

    // 1. Bulk from File (JSONL)
    if (options.bulk && options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(`Invalid file path for --file option: ${inputFile}`);
      }
      const fileStream = createReadStream(resolve(inputFile));
      await streamBulkSet(fileStream, db, options, path);
      return;
    }

    // 2. Bulk from stdin (JSONL)
    if (options.bulk && !process.stdin.isTTY) {
      await streamBulkSet(process.stdin, db, options, path);
      return;
    }

    // 3. Single document from argument
    if (data) {
      spinner.text = "Processing single document...";
      const parsedData = JSON.parse(data);

      if (Array.isArray(parsedData)) {
        throw new Error(
          "Invalid data format: For a single set, data must be a single object, not an array.",
        );
      }

      let docId: string | undefined;
      let docData: any;
      const hasId = "id" in parsedData;
      const hasData = "data" in parsedData;

      if (hasId && hasData) {
        docId = parsedData.id;
        docData = parsedData.data;
      } else if (hasId || hasData) {
        throw new Error(
          "Invalid data format: When 'id' or 'data' are present, both fields are required.",
        );
      } else {
        docData = parsedData;
      }

      if (docId) {
        path += `/${docId}`;
      }

      if (!path) {
        throw new Error(
          "A document path is required for a single set operation.",
        );
      }

      const ref = getFirestoreReference(db, path);
      if (ref instanceof CollectionReference) {
        await ref.add(docData);
      } else {
        await ref.set(docData, { merge: options.merge });
      }
      spinner.succeed("Done!");
      return;
    }

    throw new Error("No data provided. Use --file, stdin, or a data argument.");
  } catch (e) {
    spinner.fail(`An error occurred: ${e.message}`);
    CLI_LOG(e.stack, "error");
    process.exitCode = 1;
  }
};
