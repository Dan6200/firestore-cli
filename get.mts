//cspell:disable
import { Chalk } from "chalk";
import ora, { Ora } from "ora";
import { Options } from "commander";
import {
  DocumentReference,
  DocumentSnapshot,
  Query,
  QuerySnapshot,
} from "@google-cloud/firestore";
import { initializePager } from "./init-pager.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
import { authenticateFirestore } from "./auth/authenticate-firestore.mjs";
import { getFirestoreReference } from "./utils/get-firestore-reference.mjs";
import { printJSON } from "./utils/print/json.mjs";
import { formatDocument } from "./utils/print/format-document.mjs";
import { ChildProcess } from "child_process";
const chalk = new Chalk({ level: 3 });

async function handleSnapshotGet(
  ref: DocumentReference | Query,
  options: Options,
  spinner: Ora,
  pager: ChildProcess,
  failedToStartPager: boolean,
) {
  let error = false;
  try {
    const snapshot = await ref.get();
    if (options.json) {
      const stdOutput = printJSON(snapshot, options);
      const destination = failedToStartPager ? process.stdout : pager.stdin;
      if (failedToStartPager) spinner.succeed("Done!");
      else spinner.succeed("Done! Piping to pager.");
      destination.write(stdOutput);
    } else {
      const destination = failedToStartPager ? process.stdout : pager.stdin;
      if (failedToStartPager) spinner.succeed("Done!");
      else spinner.succeed("Done! Piping to pager.");

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
          for (const doc of snapshot.docs) {
            docCount++;
            const isLast = docCount === snapshot.size;
            destination.write(
              formatDocument(doc, chalk, options.whiteSpace, {
                isLastInArray: isLast,
                isArrayElement: true,
              }),
            );
          }
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
}

async function handleStreamedGet(
  ref: Query,
  options: Options,
  spinner: Ora,
  pager: ChildProcess,
  failedToStartPager: boolean,
) {
  const destination = failedToStartPager ? process.stdout : pager.stdin;
  spinner.succeed("Streaming from Firestore...");

  const firestoreStream = ref.stream();
  let isFirst = true;
  const NEWLINE_AMOUNT = Math.floor(
    Math.max(1, Math.log2(options.whiteSpace || 2)),
  );

  destination.write("[" + "\n".repeat(NEWLINE_AMOUNT));

  firestoreStream.on("data", (doc) => {
    if (!isFirst) {
      destination.write("," + "\n".repeat(NEWLINE_AMOUNT));
    }
    destination.write(
      formatDocument(doc, chalk, options.whiteSpace, {
        isLastInArray: false, // Not easily known in a stream
        isArrayElement: true,
      }),
    );
    isFirst = false;
  });

  firestoreStream.on("end", () => {
    destination.write("\n" + "]");
    if (!failedToStartPager) {
      pager.stdin.end();
    }
  });

  firestoreStream.on("error", (err) => {
    spinner.fail("Firestore stream error!");
    CLI_LOG(err.message, "error", pager);
    process.exitCode = 1;
    if (!failedToStartPager) pager.stdin.end();
  });
}

export default async (path: string, options: Options) => {
  let spinner: Ora;
  try {
    spinner = ora("Authenticating Firestore DB").start();
    const db = await authenticateFirestore(options);
    spinner.succeed("Successfully authenticated!");

    const { pager, failedToStartPager } = initializePager(options);

    if (!failedToStartPager) {
      pager.stdin.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code !== "EPIPE") {
          throw err;
        }
      });
    }

    const pagerClosed = failedToStartPager
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
          pager.on("close", () => resolve());
        });

    const ref = getFirestoreReference(db, path);
    spinner = ora("Fetching documents from " + path + "\n").start();

    if (options.stream && !(ref instanceof DocumentReference)) {
      await handleStreamedGet(ref, options, spinner, pager, failedToStartPager);
    } else {
      await handleSnapshotGet(ref, options, spinner, pager, failedToStartPager);
    }

    await pagerClosed;
  } catch (error) {
    if (spinner) spinner.fail("An unexpected error occurred.");
    CLI_LOG(error.toString(), "error");
    process.exitCode = 1;
    return;
  }
};