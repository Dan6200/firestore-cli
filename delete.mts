//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "./auth-1.mjs";
import { handleSecretKey } from "./utils/auth.mjs";
import { existsSync } from "fs";
import { resolve } from "path";

export default async (
  globalOptions: Options,
  collection: string,
  documentIds: string | string[],
  options: Options
) => {
  if (documentIds && Array)
    if (!options.bulk)
      throw new Error(
        "The --custom-ids flag can only be used in conjunction with the --bulk flag"
      );
    else ({ documentIds } = options);
  const spinner = ora("Adding document(s) to " + collection + "\n").start();
  try {
    const serviceAccount = handleSecretKey(globalOptions.serviceAccount);
    const db = await authenticateFirestore(
      serviceAccount,
      globalOptions.databaseId
    );
    let parsedData: object | null = null;
    if (options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          "Invalid file path for the --file option: " + inputFile
        );
      }
      if (!options.fileType || options.fileType.toUpperCase() === "JSON")
        ({ default: parsedData } = await import(resolve(inputFile), {
          assert: { type: "json" },
        }));
      else {
        /*TODO: ...Add Support for YAML and CSV filetypes*/
      }
    } else {
      if (!data) {
        throw new Error(
          "Missing data input: Please provide the new data either as command-line arguments or by specifying a file with the -f flag."
        );
      }
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        throw new Error(
          "Parsing error. Ensure your JSON is formatted properly: " + e
        );
      }
    }
    if (options.bulk) {
      if (!Array.isArray(parsedData))
        throw new Error("Data for bulk add operations must be in list form");
      const bulkData = parsedData;
      const batch = db.batch();
      if (bulkData.length !== documentIds.length)
        throw new Error(
          "Number of custom IDs must match the number of documents to be added"
        );
      bulkData.map((newData, index) => {
        const col = db.collection(collection);
        const ref = documentIds ? col.doc(documentIds[index]) : col.doc();
        batch.set(ref, newData);
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e);
      }
    } else {
      const col = db.collection(collection);
      const doc = documentId ? col.doc(documentId) : col.doc();
      if (Array.isArray(parsedData))
        throw new Error("Data for add operations must be an object");
      await doc.set(parsedData);
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    console.error(e);
  }
};
