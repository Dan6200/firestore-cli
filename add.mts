//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { authenticateFirestore } from "./auth-1.js";
import { handleSecretKey, printDocuments } from "./utils.mjs";
import { DocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";
import { initializePager } from "./init-pager.mjs";
import { existsSync } from "fs";
import { resolve } from "path";

const chalk = new Chalk({ level: 3 });

export default async (
  globalOptions: Options,
  collection: string,
  data: string,
  options: Options
) => {
  let pager = null,
    failedToStartPager = null;
  if (collection) ({ pager, failedToStartPager } = initializePager());
  const spinner = ora("Adding document(s) to " + collection + "\n").start();
  try {
    const secretKey = handleSecretKey(globalOptions.secretKey);
    const db = await authenticateFirestore(secretKey, globalOptions.databaseId);
    let parsedData: object | null = null;
    if (options.file) {
      const inputFile = options.file;
      console.log(inputFile);
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
    let stdOutput: string | null = null;
    let snapshot: DocumentSnapshot | QuerySnapshot;
    if (options.bulk) {
      if (!Array.isArray(parsedData))
        throw new Error("Data for bulk add operations must be in list form");
      const bulkData = parsedData;
      const batch = db.batch();
      bulkData.map((newData) => {
        const ref = db.collection(collection).doc();
        batch.set(ref, newData);
      });
      try {
        await batch.commit();
        snapshot = await db.collection(collection).get();
      } catch (e) {
        throw new Error("Failed to add new documents: " + e);
      }
    } else {
      const doc = db.collection(collection).doc();
      if (Array.isArray(parsedData))
        throw new Error("Data for add operations must be an object");
      await doc.set(parsedData);
      snapshot = await doc.get();
    }
    stdOutput = await printSnapshot(snapshot, options, failedToStartPager);
    if (!failedToStartPager) {
      spinner.succeed("Done!");
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!failedToStartPager) pager.stdin.write(stdOutput);
  } catch (e) {
    spinner.fail("Failed to fetch documents!");
    console.error(e);
  } finally {
    if (!failedToStartPager) pager.stdin.end();
  }
};

const printSnapshot = async (
  snapshot: DocumentSnapshot | QuerySnapshot,
  { json, whiteSpace }: Options,
  failedToStartPager = false,
  stdOutput = ""
) => {
  let printableSnapshot: any;

  // Handle json print option...
  if (json) {
    // Handle different types of snapshots...
    // ...Make printing JSONs its own function/method
    if (snapshot instanceof DocumentSnapshot) {
      if (!snapshot.exists) throw new Error("Document does not exist");

      printableSnapshot = {
        id: snapshot.id,
        createTime: snapshot.createTime.seconds,
        data: snapshot.data(),
      };
    } else {
      if (snapshot.empty) throw new Error("Query returned no documents");
      printableSnapshot = [];
      snapshot.forEach((doc) =>
        printableSnapshot.push({ [doc.id]: doc.data() })
      );
    }
    stdOutput = JSON.stringify(printableSnapshot, null, whiteSpace ?? 2);
    if (failedToStartPager) process.stdout.write(stdOutput);
  } else {
    // Regular printing...
    stdOutput += printDocuments(
      snapshot,
      chalk,
      failedToStartPager,
      whiteSpace
    );
  }
  return stdOutput;
};
