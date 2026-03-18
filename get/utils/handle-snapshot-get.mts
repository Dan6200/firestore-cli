import {
  DocumentReference,
  Query,
  DocumentSnapshot,
  QuerySnapshot,
} from "@google-cloud/firestore";
import chalk from "chalk";
import { Options } from "commander";
import { Ora } from "ora";
import { CLI_LOG } from "../../utils/logging.mjs";
import { formatDocument } from "../../utils/print/format-document.mjs";
import { printJSON } from "../../utils/print/json.mjs";
import { printDocsInBulk } from "./print-docs-in-bulk.mjs";
import { initializePager } from "../../pager/init.mjs";

export async function handleSnapshotGet(
  ref: DocumentReference | Query,
  options: Options,
  spinner: Ora,
) {
  let error = false;
  let pagerInstance: any = null;
  let failedToStartPager = false;

  try {
    spinner.text = "Fetching snapshot from Firestore...";
    const snapshot = await ref.get();

    const successMsg = failedToStartPager ? "Done!" : "Done! Piping to pager.";
    spinner.succeed(chalk.green(successMsg));

    const pagerData = initializePager(options);
    pagerInstance = pagerData.pager;
    failedToStartPager = pagerData.failedToStartPager;

    const destination = failedToStartPager
      ? process.stdout
      : pagerInstance.stdin;

    // Handle EPIPE
    destination.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EPIPE") process.exit(0);
    });

    // 4. DATA PROCESSING
    if (options.json) {
      destination.write(printJSON(snapshot, options));
    } else {
      if (snapshot instanceof DocumentSnapshot) {
        if (snapshot.exists) {
          destination.write(
            formatDocument(snapshot, chalk, options.whiteSpace, {
              isArrayElement: false,
            }),
          );
        } else {
          destination.write(chalk.yellow("Document does not exist."));
        }
      } else if (snapshot instanceof QuerySnapshot) {
        if (snapshot.empty) {
          destination.write("[]");
        } else {
          printDocsInBulk(snapshot.docs, options, chalk, destination);
        }
      }
    }

    // 5. CLEANUP & HANDOFF
    if (!failedToStartPager) {
      pagerInstance.stdin.end();
      // Wait for pager to close so the process doesn't exit prematurely
      await new Promise<void>((resolve) => {
        pagerInstance.on("close", resolve);
      });
    }
  } catch (e) {
    CLI_LOG(e, "error");
    error = true;
  } finally {
    if (error) process.exitCode = 1;
  }
}
