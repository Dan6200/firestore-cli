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
    let parsedData: { id?: string; data: any }[] | null = null;
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
      parsedData.map(({ id, data }) => {
        const docRef = ref.doc(id);
        batch.set(docRef, data, { merge: options.merge });
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e.message);
      }
    } else {
      if (Array.isArray(parsedData))
        throw new Error(
          "Invalid data format: For add operations without the --bulk flag, the data must be a single object with a `data` field and optionally an `id` field.",
        );
      const { id, data } = parsedData;
      if (id) path += `/${id}`; // if defined append to path to force a document reference
      // error probably occurs here
      options.debug && CLI_LOG("Document path: " + path, "debug");
      const ref = getFirestoreReference(db, path);
      if (ref instanceof CollectionReference) {
        await ref.doc(id).set(data);
      } else await ref.set(data);
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to set document(s)!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
