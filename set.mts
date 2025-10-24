//cspell:disable
import ora, { Ora } from "ora";
import { Options } from "commander";
import { createReadStream, existsSync } from "fs";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { createInterface } from "readline";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";

// --- Helper for streaming JSONL bulk writes ---
async function streamBulkSet(
  inputStream: NodeJS.ReadableStream,
  db: FirebaseFirestore.Firestore,
  options: Options,
  path: string,
) {
  const bulkWriter = db.bulkWriter({
    throttling: options.rateLimit
      ? { maxOpsPerSecond: options.rateLimit }
      : false,
  });

  const rl = createInterface({ input: inputStream, crlfDelay: Infinity });
  let lineCount = 0;
  const spinner = ora("Processing streamed data...").start();

  rl.on("line", (line) => {
    if (line.trim() === "") return;
    lineCount++;
    spinner.text = `Processed ${lineCount} lines...`;
    try {
      const item = JSON.parse(line);
      const { docRef, docData } = getDocRefAndData(item, path, db);
      bulkWriter.set(docRef, docData, { merge: options.merge });
    } catch (e) {
      rl.close();
      bulkWriter.close();
      spinner.fail(`Error on line ${lineCount}: ${e.message}`);
      process.exitCode = 1;
    }
  });

  await new Promise<void>((resolve, reject) => {
    rl.on("close", resolve);
    rl.on("error", reject);
  });

  if (process.exitCode === 1) return; // Stop if line parsing failed

  spinner.text = "Finalizing writes...";
  await bulkWriter.close();
  spinner.succeed(`Successfully processed ${lineCount} documents.`);
}

// --- Helper for standard JSON array bulk writes ---
async function fullBulkSet(
  parsedData: any[],
  db: FirebaseFirestore.Firestore,
  options: Options,
  path: string,
) {
  const spinner = ora(`Processing ${parsedData.length} documents...`).start();
  const bulkWriter = db.bulkWriter({
    throttling: options.rateLimit
      ? { maxOpsPerSecond: options.rateLimit }
      : false,
  });

  parsedData.forEach((item: any) => {
    const { docRef, docData } = getDocRefAndData(item, path, db);
    bulkWriter.set(docRef, docData, { merge: options.merge });
  });

  await bulkWriter.close();
  spinner.succeed(`Successfully processed ${parsedData.length} documents.`);
}

// --- Shared helper for "Smart Path" logic ---
function getDocRefAndData(
  item: any,
  path: string,
  db: FirebaseFirestore.Firestore,
): { docRef: DocumentReference; docData: any } {
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
    if (!path) throw new Error("Base path is required for items with 'id'.");
    docRef = db.collection(path).doc(item.id);
  } else {
    if (!path) throw new Error("Base path is required for auto-generating IDs.");
    docRef = db.collection(path).doc();
  }
  return { docRef, docData };
}

// --- Helper to read from stdin ---
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });
}

// --- Main Command ---
export default async (path: string, data: string, options: Options) => {
  const spinner = ora("Initializing...").start();
  try {
    const db = await authenticateFirestore(options);
    spinner.succeed("Authentication successful.");

    // --- Bulk Operations ---
    if (options.bulk) {
      if (options.jsonl) {
        let inputStream: NodeJS.ReadableStream;
        spinner.text = "Processing as JSONL stream...";
        if (options.file) {
          const inputFile = options.file;
          if (!existsSync(inputFile)) throw new Error(`File not found: ${inputFile}`);
          inputStream = createReadStream(resolve(inputFile));
        } else if (!process.stdin.isTTY) {
          inputStream = process.stdin;
        } else {
          throw new Error("For --jsonl, data must be from --file or stdin.");
        }
        await streamBulkSet(inputStream, db, options, path);
      } else {
        let parsedData: any;
        spinner.text = "Reading data...";
        if (options.file) {
          const inputFile = options.file;
          if (!existsSync(inputFile)) throw new Error(`File not found: ${inputFile}`);
          parsedData = JSON.parse(await readFile(resolve(inputFile), "utf8"));
        } else if (!process.stdin.isTTY) {
          const stdinData = await readStdin();
          parsedData = JSON.parse(stdinData);
        } else {
          throw new Error("For bulk ops, data must be from --file or stdin.");
        }

        if (!Array.isArray(parsedData)) {
          throw new Error("Data for bulk operation must be a JSON array.");
        }
        await fullBulkSet(parsedData, db, options, path);
      }
      return;
    }

    // --- Single Document from argument ---
    if (data) {
      spinner.text = "Processing single document...";
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData)) {
        throw new Error("Data for a single set must be a single object.");
      }

      const { docRef, docData } = getDocRefAndData(parsedData, path, db);
      await docRef.set(docData, { merge: options.merge });
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