//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";

export default async (collection: string, data: string, options: Options) => {
  let customId: string | undefined, customIds: string[] | undefined;
  if (options.customId) ({ customId } = options);
  if (options.customIds)
    if (!options.bulk)
      throw new Error(
        "The --custom-ids flag can only be used in conjunction with the --bulk flag",
      );
    else ({ customIds } = options);
  if (!options.file && !data)
    throw new Error(
      "Must provide new document data as an argument or a file containing the data using the --file flag.",
    );
  const spinner = ora("Adding document(s) to " + collection + "\n").start();
  try {
    const db = await authenticateFirestore(options);
    let parsedData: object | null = null;
    if (options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          "Invalid file path for the --file option: " + inputFile,
        );
      }
      if (!options.fileType || options.fileType.toUpperCase() === "JSON")
        ({ default: parsedData } = await import(resolve(inputFile), {
          with: { type: "json" },
        }));
      else {
        /*TODO: ...Add Support for YAML and CSV filetypes*/
      }
    } else {
      try {
        parsedData = JSON.parse(data);
      } catch (e) {
        throw new Error(
          "Parsing error. Ensure your JSON is formatted properly: " + e,
        );
      }
    }
    if (options.bulk) {
      if (!Array.isArray(parsedData))
        throw new Error(
          "Invalid data format: The data provided with the --bulk flag must be in array format for JSON/YAML or tabular format for CSV. Ensure your input is properly structured.",
        );
      const bulkData = parsedData;
      const batch = db.batch();
      if (customIds && bulkData.length !== customIds.length)
        throw new Error(
          "Number of custom IDs must match the number of documents to be added",
        );
      bulkData.map((newData, index) => {
        // TODO: see if you can optimize this by moving this out of the loop...
        const col = db.collection(collection);
        const ref = customIds ? col.doc(customIds[index]) : col.doc();
        batch.set(ref, newData);
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e.message);
      }
    } else {
      const col = db.collection(collection);
      const doc = customId ? col.doc(customId) : col.doc();
      if (Array.isArray(parsedData)) {
        throw new Error(
          "Invalid data format: For add operations without the --bulk flag, the data must be a single object, not an array.",
        );
      }
      await doc.set(parsedData);
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to add document(s)!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
