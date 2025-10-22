//cspell:disable
import { Chalk } from "chalk";
import ora from "ora";
import { Options } from "commander";
import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { initializePager } from "./init-pager.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";
import { printJSON } from "./utils/print/json.mjs";
import { formatDocument } from "./utils/print/format-document.mjs";
const chalk = new Chalk({ level: 3 });

export default async (path: string, options: Options) => {
  let error = false;
  let spinner;
  let db: FirebaseFirestore.Firestore;
  try {
    spinner = ora("Authenticating Firestore DB").start();
    db = await authenticateFirestore(options);
    spinner.succeed("Successfully authenticated!");
  } catch (error) {
    spinner.fail("Failed to authenticate to Firestore DB.");
    CLI_LOG(error.toString(), "error");
    process.exitCode = 1;
    return;
  }

  const { pager, failedToStartPager } = initializePager(options);
  const pagerClosed = failedToStartPager
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        pager.on("close", () => resolve());
      });

  let snapshot: null | QuerySnapshot | DocumentSnapshot = null;
  try {
    spinner = ora("Fetching documents from " + path + "\n").start();
    const ref = getFirestoreReference(db, path);
    snapshot = await ref.get();
  } catch (error) {
    if (pager) pager.kill();
    spinner.fail("Failed to fetch document path.");
    if (error.message.includes("not found"))
      CLI_LOG(`Cannot find the resource at the given path ${path}`, "error");
    else CLI_LOG(error.toString(), "error");
    process.exitCode = 1;
    return;
  }

  try {
    if (options.json) {
      const stdOutput = printJSON(snapshot, options);
      const destination = failedToStartPager ? process.stdout : pager.stdin;
      if (failedToStartPager) spinner.succeed("Done!");
      else spinner.succeed("Done!\nPiping to pager.");
      destination.write(stdOutput);
    } else {
      const destination = failedToStartPager ? process.stdout : pager.stdin;
      if (failedToStartPager) spinner.succeed("Done!");
      else spinner.succeed("Done!\nPiping to pager.");

      if (snapshot instanceof DocumentSnapshot) {
        if (snapshot.exists) {
          destination.write(
            formatDocument(snapshot, chalk, options.whiteSpace, {
              isArrayElement: false,
            }),
          );
        } else {
          destination.write("[]");
        }
      } else if (snapshot instanceof QuerySnapshot) {
        if (snapshot.empty) {
          destination.write("[]");
        } else {
          const NEWLINE_AMOUNT = Math.floor(
            Math.max(1, Math.log2(options.whiteSpace || 2)),
          );
          destination.write("[" + "\n".repeat(NEWLINE_AMOUNT));
          let docCount = 0;
          snapshot.forEach((doc) => {
            docCount++;
            const isLast = docCount === snapshot.size;
            destination.write(
              formatDocument(doc, chalk, options.whiteSpace, {
                isLastInArray: isLast,
                isArrayElement: true,
              }),
            );
          });
          destination.write("]");
        }
      }
    }
  } catch (e) {
    spinner.fail("Failed to process documents!");
    CLI_LOG(e, "error", pager);
    error = true;
  } finally {
    if (!failedToStartPager) pager.stdin.end();
    if (error) process.exitCode = 1;
  }

  await pagerClosed;
};

