import { ChalkInstance } from "chalk";
import { DocumentSnapshot } from "@google-cloud/firestore";
import { printObj } from "./object.mjs";

export function formatDocument(
  doc: DocumentSnapshot,
  chalk: ChalkInstance,
  whiteSpace = 2,
  options: { isLastInArray?: boolean; isArrayElement?: boolean } = {},
) {
  const { isLastInArray = true, isArrayElement = false } = options;
  const INDENT = " ".repeat(whiteSpace);
  const NEWLINE_AMOUNT = Math.floor(Math.max(1, Math.log2(whiteSpace)));

  let output = "";
  if (isArrayElement) {
    output += INDENT;
  }

  output += `${doc.id} => ${printObj(
    doc.data(),
    isArrayElement ? undefined : 0,
    INDENT,
    chalk,
  )}`;

  if (isArrayElement && !isLastInArray) {
    output += ",";
  }

  output += "\n".repeat(NEWLINE_AMOUNT);

  return output;
}
