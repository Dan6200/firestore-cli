import { DocumentSnapshot } from "@google-cloud/firestore";
import { ChalkInstance } from "chalk";
import { Options } from "commander";
import { formatDocument } from "../../utils/print/format-document.mjs";

// Helper to print an array of documents in a streaming fashion
export function printDocsInBulk(
  docs: DocumentSnapshot[],
  options: Options,
  chalk: ChalkInstance,
  destination: NodeJS.WritableStream,
) {
  const NEWLINE_AMOUNT = Math.floor(
    Math.max(1, Math.log2(options.whiteSpace || 2)),
  );
  destination.write("[" + "\n".repeat(NEWLINE_AMOUNT));
  let docCount = 0;
  for (const doc of docs) {
    docCount++;
    const isLast = docCount === docs.length;
    destination.write(
      formatDocument(doc, chalk, options.whiteSpace, {
        isLastInArray: isLast,
        isArrayElement: true,
      }),
    );
  }
  destination.write("]");
}
