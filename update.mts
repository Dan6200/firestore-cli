//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { formatData, validateFileInput } from "./utils/data-mutation.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";

export default async (
  collection: string,
  data: string,
  documentIds: string[],
  options: Options,
) => {
  if (documentIds.length > 1 && !options.bulk)
    throw new Error(
      "Multiple IDs should only be provided in conjunction with the --bulk flag",
    );
  if (!options.file && !data)
    throw new Error(
      "Must provide data or a file containing the data to update document.",
    );
  const spinner = ora("Updating document(s) in " + collection + "\n").start();
  let parsedData = null;
  try {
    const db = await authenticateFirestore(options);
    let dataToUpdate: any = null;
    if (options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          "Invalid file path for the --file option: " + inputFile,
        );
      }
      if (!options.fileType || options.fileType.toUpperCase() === "JSON") {
        ({ default: dataToUpdate } = await import(resolve(inputFile), {
          with: { type: "json" },
        }));
      } else {
        /*TODO: ...Add Support for YAML and CSV filetypes*/
      }
      if (!options.bulk && Object.keys(dataToUpdate).length > 1)
        throw new Error(
          "Invalid data format: For update operations without the --bulk flag, the data must be a single object, not an array.",
        );
      validateFileInput(dataToUpdate);
    } else {
      parsedData = JSON.parse(data);
      if (options.bulk) {
        if (!Array.isArray(parsedData))
          throw new Error(
            "Invalid data format: The data provided with the --bulk flag must be in array format for JSON/YAML or tabular format for CSV. Ensure your input is properly structured.",
          );
        dataToUpdate = formatData(parsedData, documentIds);
      }
    }
    if (options.bulk) {
      const batch = db.batch();
      for (const [documentId, data] of Object.entries(dataToUpdate)) {
        const ref = db.collection(collection).doc(documentId);
        batch.set(
          ref,
          data,
          options.overwrite ? { merge: false } : { merge: true },
        );
      }
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e);
      }
    } else {
      if (Array.isArray(parsedData)) {
        throw new Error(
          "Invalid data format: For update operations without the --bulk flag, the data must be a single object, not an array.",
        );
      }
      if (documentIds.length > 1)
        throw new Error(
          "Number of IDs provided must be one or use the --bulk flag.",
        );
      await db
        .collection(collection)
        .doc(documentIds[0])
        .set(
          parsedData,
          options.overwrite ? { merge: false } : { merge: true },
        );
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to update documents!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
