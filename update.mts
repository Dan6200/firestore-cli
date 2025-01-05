//cspell:disable
import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "./auth-1.mjs";
import { handleSecretKey } from "./utils/auth.mjs";
import { existsSync } from "fs";
import { resolve } from "path";

// TODO: Must support the JSON file option with contains both the new data and doc ids.
export default async (
  globalOptions: Options,
  collection: string,
  data: string,
  ids: string,
  options: Options
) => {
  if (ids.length > 1 && !options.bulk)
    throw new Error(
      "Multiple IDs should only be provided in conjunction with the --bulk flag"
    );
  if (options.file && ids)
    throw new Error("Must provide IDs or a file containing a list of IDs");
  const spinner = ora("Adding document(s) to " + collection + "\n").start();
  try {
    const serviceAccount = handleSecretKey(globalOptions.serviceAccount);
    const db = await authenticateFirestore(
      serviceAccount,
      globalOptions.databaseId
    );
    if (options.file) {
      const inputFile = options.file;
      if (!existsSync(inputFile)) {
        throw new Error(
          "Invalid file path for the --file option: " + inputFile
        );
      }
      if (!options.fileType || options.fileType.toUpperCase() === "JSON")
        ({ default: ids } = await import(resolve(inputFile), {
          assert: { type: "json" },
        }));
      else {
        /*TODO: ...Add Support for YAML and CSV filetypes*/
      }
    }
    if (options.bulk) {
      const batch = db.batch();
      ids.map((id, index) => {
        const ref = db.collection(collection).doc(id);
        batch.set(ref, newData);
      });
      try {
        await batch.commit();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e);
      }
    } else {
      const col = db.collection(collection);
      const doc = customId ? col.doc(customId) : col.doc();
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
