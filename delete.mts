//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { readFile } from "fs/promises";

export default async (
  collection: string,
  documentIds: string | string[],
  options: Options,
) => {
  const spinner = ora("Deleting document(s) in " + collection + "\n").start();
  if ((!documentIds || documentIds?.length === 0) && !options.file) {
    throw new Error(
      "Missing document IDs: Please provide the document IDs either as command-line arguments or by specifying a file with the -f flag in JSON format.",
    );
  }
  try {
    const db = await authenticateFirestore(options);
    if (options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          "Invalid file path for the --file option: " + inputFile,
        );
      }
      if (!options.fileType || options.fileType.toUpperCase() === "JSON")
        documentIds = await readFile(resolve(inputFile), "utf8");
      else {
        /*TODO: ...Add Support for YAML and CSV filetypes*/
      }
    }
    if (options.bulk) {
      if (!Array.isArray(documentIds))
        throw new Error(
          "The document IDs to delete must be in array or list format",
        );
      const batch = db.batch();
      documentIds.map((ids) => {
        const ref = db.collection(collection).doc(ids);
        batch.delete(ref);
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e);
      }
    } else {
      if (documentIds.length > 1)
        throw new Error(
          "Number of IDs provided must be one or use the --bulk flag.",
        );
      await db.collection(collection).doc(documentIds[0]).delete();
    }
    spinner.succeed("Done!");
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    CLI_LOG(e.message, "error");
    process.exitCode = 1;
  }
};
