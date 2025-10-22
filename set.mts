//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";
import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { readFile } from "fs/promises";

export default async (path: string, data: string, options: Options) => {
  if (!options.file && !data)
    throw new Error(
      "Must provide new document data as an argument or a file containing the data using the --file flag.",
    );
  const spinner = ora("Adding document(s) to " + path + "\n").start();
  try {
    const db = await authenticateFirestore(options);
    let parsedData:
      | { id: string; data: any }
      | { id: string; data: any }[]
      | { [field: string]: any }
      | { [field: string]: any }[]
      | null = null;
    if (options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          "Invalid file path for the --file option: " + inputFile,
        );
      }
      if (!options.fileType || options.fileType.toUpperCase() === "JSON")
        parsedData = JSON.parse(await readFile(resolve(inputFile), "utf8"));
      else {
        /*TODO: ...Add Support for YAML and CSV filetypes*/
      }
    } else {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        throw new Error(
          "Parsing error.\nEnsure your JSON is formatted properly: " +
            e.message,
        );
      }
    }
    if (options.bulk) {
      if (!Array.isArray(parsedData))
        throw new Error(
          "Invalid data format: The data provided with the --bulk flag must be in array format for JSON/YAML or tabular format for CSV. Ensure your input is properly structured.",
        );
      const batch = db.batch();
      const ref = getFirestoreReference(db, path);
      if (ref instanceof DocumentReference)
        throw new Error(
          `Path must be to a collection for bulk operations: \`${path}\` has an odd number of segments, representing a document reference.`,
        );
      parsedData.forEach((item: any) => {
        let docId: string | undefined;
        let docData: any;
        const hasId = "id" in item;
        const hasData = "data" in item;
        if (hasId && hasData) {
          docId = item.id;
          docData = item.data;
        } else if (hasId || hasData) {
          throw new Error(
            `Invalid item in bulk data array: When 'id' or 'data' are present, both fields are required. Offending item: ${JSON.stringify(
              item,
            )}`,
          );
        } else {
          docData = item;
          docId = undefined;
        }
        const docRef = ref.doc(docId);
        batch.set(docRef, docData, { merge: options.merge });
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e.message);
      }
    } else {
      if (Array.isArray(parsedData))
        throw new Error(
          "Invalid data format: For add operations without the --bulk flag, the data must be a single object.",
        );
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
      options.debug && CLI_LOG("Document path: " + path, "debug");
      const ref = getFirestoreReference(db, path);
      if (ref instanceof CollectionReference) {
        await ref.add(docData);
      } else {
        await ref.set(docData, { merge: options.merge });
      }
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to set document(s)!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};

