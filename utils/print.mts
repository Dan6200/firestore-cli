import { Chalk } from "chalk";
import { ChalkInstance } from "chalk";
import { Options } from "commander";
import { DocumentSnapshot, QuerySnapshot } from "@google-cloud/firestore";
import { MockChalk } from "../types-and-interfaces.mjs";
const chalk = new Chalk({ level: 3 });

export function printDocuments(
  snapshot: QuerySnapshot | DocumentSnapshot,
  chalk: ChalkInstance | MockChalk,
  failedToStartPager = true,
  whiteSpace = 2,
  stdOutput = ""
) {
  const INDENT = " ".repeat(whiteSpace);
  const NEWLINE_AMOUNT = Math.floor(Math.max(1, Math.log2(whiteSpace)));
  let output: string;
  if (snapshot instanceof DocumentSnapshot) {
    if (!snapshot.exists) {
      if (failedToStartPager) process.stdout.write("[]");
      else return "[]";
      return;
    }
    output =
      `${snapshot.id} => ${printObj(snapshot.data(), 0, INDENT, chalk)}` +
      "\n".repeat(NEWLINE_AMOUNT);
    if (failedToStartPager) process.stdout.write(output);
    else return output;
    return;
  }
  if (snapshot.empty) {
    if (failedToStartPager) {
      process.stdout.write("[]");
      return;
    } else return "[]";
  }
  output = "[" + "\n".repeat(NEWLINE_AMOUNT);
  if (failedToStartPager) process.stdout.write(output);
  else stdOutput += output;
  let docCount = 1;
  snapshot.forEach((doc) => {
    if (docCount !== snapshot.size) {
      output =
        `${INDENT + doc.id} => ${printObj(
          doc.data(),
          undefined,
          INDENT,
          chalk
        )},` + "\n".repeat(NEWLINE_AMOUNT);
    } else {
      output =
        `${INDENT + doc.id} => ${printObj(
          doc.data(),
          undefined,
          INDENT,
          chalk
        )}` + "\n".repeat(NEWLINE_AMOUNT);
    }
    if (!output) throw new Error("Error fetching documents!");
    if (failedToStartPager) process.stdout.write(output);
    else stdOutput += output;
    docCount++;
  });
  output = "]";
  if (failedToStartPager) process.stdout.write(output);
  else stdOutput += output;
  return stdOutput;
}

export function printObj(
  obj: object,
  level = 1,
  char: string,
  chalk: ChalkInstance | MockChalk
): string {
  let result = "{\n";
  let index = 1;
  for (const [key, value] of Object.entries(obj)) {
    const indentation = char.repeat(level + 1);
    if (typeof value === "number") {
      result += `${indentation}${key}: ${chalk.blue(`${value}`)}`;
    } else if (typeof value === "string") {
      result += `${indentation}${key}: ${chalk.green(`'${value}'`)}`;
    } else if (value === null) {
      result += `${indentation}${key}: ${chalk.gray("null")}`;
    } else if (Array.isArray(value)) {
      const arrayString = JSON.stringify(value, null, char.length)
        .split("\n")
        .map((line, index) => (index > 0 ? indentation + line : line))
        .join("\n");
      result += `${indentation}${key}: ${chalk.yellow(arrayString)}`;
    } else if (typeof value === "object" && Object.keys(value).length) {
      result += `${indentation}${key}: ${printObj(
        value,
        level + 1,
        char,
        chalk
      )}`;
    }
    // add a comma on all fields or items except the last
    result += index === Object.keys(obj).length ? "\n" : ",\n";
    index++;
  }

  result += char.repeat(level) + "}";
  return result;
}

export const printSnapshot = async (
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
