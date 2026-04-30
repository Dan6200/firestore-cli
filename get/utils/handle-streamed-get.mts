import {
  BulkWriterError,
  Query,
  QueryDocumentSnapshot,
} from "@google-cloud/firestore";
import chalk from "chalk";
import { Options } from "commander";
import { Ora } from "ora";
import { CLI_LOG } from "../../utils/logging.mjs";
import { formatDocument } from "../../utils/print/format-document.mjs";
import { initializePager } from "../../pager/init.mjs";
import { permissionDeniedError } from "../../utils/error-handling.mjs";

export async function handleStreamedGet(
  ref: Query,
  options: Options,
  spinner: Ora,
) {
  // 1. Relinquish TTY control before starting the pager
  spinner.succeed(chalk.green("Streaming from Firestore..."));

  // 2. Initialize Pager (Now has exclusive TTY access)
  const { pager, failedToStartPager } = initializePager(options);
  const destination = failedToStartPager ? process.stdout : pager.stdin;

  // Handle EPIPE (User quits 'less' while Firestore is still streaming)
  destination.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EPIPE") process.exit(0);
  });

  const firestoreStream = ref.stream() as AsyncIterable<QueryDocumentSnapshot>;
  let isFirst = true;
  const NEWLINE_AMOUNT = Math.max(
    1,
    Math.floor(Math.log2(options.whiteSpace || 2)),
  );

  try {
    // Using 'for await' for better back-pressure management
    for await (const doc of firestoreStream) {
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
        await new Promise((r) => pager.stdin.once("drain", r));
      }

      isFirst = false;
    }

    destination.write("]");
  } catch (err: any) {
    if (!failedToStartPager) {
      destination.write("] -- Stream Interrupted. Press q to exit Pager.");
      pager.stdin.end();
    }
    if ((err as BulkWriterError).code === 7) {
      permissionDeniedError(err);
    } else CLI_LOG(err.message.replace(/(\d+|Error) /, ""), "error");
    process.exitCode = 1;
  } finally {
    // 6. Finalize Pager
    if (!failedToStartPager) {
      pager.stdin.end();
      await new Promise<void>((resolve) => {
        pager.on("close", resolve);
      });
    }
    process.stdout.write("", () => {
      process.exit(process.exitCode || 0);
    });
    process.stdout.end();
  }
}
