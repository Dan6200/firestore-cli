import chalk from "chalk";
import { Options } from "commander";
import { Ora } from "ora";
import { CLI_LOG } from "../../utils/logging.mjs";
import { printJSON } from "../../utils/print/json.mjs";
import { printDocsInBulk } from "./print-docs-in-bulk.mjs";
import { initializePager } from "../../pager/init.mjs";
import { formatDocument } from "../../utils/print/format-document.mjs";
import {
  isDocSnapshot,
  isQuerySnapshot,
} from "../../utils/firestore/type-guards.mjs";
import { getDocStream } from "./get-doc-stream.mjs";

export async function handleGetFromInput(
  paths: string[],
  db: FirebaseFirestore.Firestore,
  options: Options,
  spinner: Ora,
) {
  let error = false;
  let pagerInstance: any = null;
  let failedToStartPager = false;

  try {
    // 1. Initial State: Spinner owns the TTY
    spinner.text = `Fetching ${paths.length} document(s)...`;

    // 2. STOP THE SPINNER (Crucial: Relinquish TTY control before pager starts)
    // This fixed a year long bug...Thanks to AI!!!
    spinner.succeed(chalk.green(`Ready to view ${paths.length} records.`));

    // 3. INITIALIZE PAGER (Now it has exclusive TTY access)
    const pagerData = initializePager(options);
    pagerInstance = pagerData.pager;
    failedToStartPager = pagerData.failedToStartPager;

    const destination = failedToStartPager
      ? process.stdout
      : pagerInstance.stdin;

    // Handle EPIPE (e.g., user closes 'less' while we are still writing)
    destination.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EPIPE") process.exit(0);
    });

    if (options.stream) {
      let isFirst = true;
      for await (const doc of getDocStream(db, paths)) {
        const NEWLINE_AMOUNT = Math.max(
          1,
          Math.floor(Math.log2(options.whiteSpace || 2)),
        );

        if (doc.exists) {
          if (options.json) {
            // printJSON usually expects an array, so we wrap the single doc
            const output = printJSON(doc, options);
            const canWrite = destination.write(output + "\n");
            if (!canWrite && !failedToStartPager) {
              await new Promise((r) => pagerInstance.stdin.once("drain", r));
            }
          } else {
            // Pass the destination stream directly to your bulk printer
            if (isFirst) {
              destination.write("[" + "\n".repeat(NEWLINE_AMOUNT));
            }

            const output = formatDocument(doc, chalk, options.whiteSpace, {
              isLastInArray: false,
              isArrayElement: true,
            });

            // Back-pressure check for the pager
            const canWrite = destination.write(output);
            if (!canWrite && !failedToStartPager) {
              await new Promise((r) => destination.once("drain", r));
            }

            isFirst = false;
          }
        }
      }
      if (!isFirst) {
        // Don't print if no documents have been printed yet
        destination.write("]");
      }
    } else {
      const docRefs = paths.filter(Boolean).map((p) => db.doc(p));
      const snapshot = await db.getAll(...docRefs);
      if (options.json) {
        destination.write(printJSON(snapshot, options));
      } else {
        if (isDocSnapshot(snapshot)) {
          if (snapshot.exists) {
            destination.write(
              formatDocument(snapshot, chalk, options.whiteSpace, {
                isArrayElement: false,
              }),
            );
          } else {
            destination.write(chalk.yellow("Document does not exist."));
          }
        } else if (isQuerySnapshot(snapshot)) {
          if (snapshot.empty) {
            destination.write("[]");
          } else {
            printDocsInBulk(snapshot.docs, options, chalk, destination);
          }
        }
      }
    }

    // 5. WAIT FOR USER
    if (!failedToStartPager) {
      pagerInstance.stdin.end();
      await new Promise<void>((resolve) => {
        pagerInstance.on("close", resolve);
      });
    }
  } catch (e) {
    // If the spinner was already stopped by .succeed(), we use CLI_LOG
    CLI_LOG(e, "error");
    error = true;
  } finally {
    if (error) process.exitCode = 1;
    // Optional: await db.terminate() here if you experience "hanging" exits
  }
}
