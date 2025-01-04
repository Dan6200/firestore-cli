import { ChalkInstance } from "chalk";
import { DocumentSnapshot, QuerySnapshot } from "firebase-admin/firestore";
import { MockChalk } from "../types-and-interfaces.mjs";

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
    if (failedToStartPager) process.stdout.write("[]");
    else return "[]";
    return;
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
