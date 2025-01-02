import { ChalkInstance } from "chalk";
import {
  CollectionReference,
  DocumentSnapshot,
  Filter,
  Query,
  QuerySnapshot,
} from "firebase-admin/firestore";
import { existsSync, readdirSync } from "fs";
import { MockChalk } from "./types-and-interfaces.js";
import { Options, WhereCondition } from "commander";
import { initializePager } from "./init-pager.mjs";

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

export function handleSecretKey(secretKey: string | null) {
  if (!secretKey) {
    if (!existsSync("./service-account"))
      throw new Error(
        "Must Provide A Service-account Key File To Authenticate!\n       Either provide the file path as an argument to the option '--service-account' or include a directory named 'service-account' with the secret key file in it."
      );
    const secretKeyDir = readdirSync("./service-account");
    const file = secretKeyDir.find((file) => file.endsWith(".json"));
    if (!file)
      throw new Error(
        "Your service-account directory does not contain the JSON key file!\n       Either provide the file path as an argument to the option '--service-account' or include a directory named 'service-account' with the secret key file in it."
      );
    return "./service-account/" + file;
  }
  if (!existsSync(secretKey))
    throw new Error("Secret-key file path does not exist!");
  return secretKey;
}

export function handleWhereClause(
  ref: CollectionReference | Query,
  where: Options["where"]
) {
  if (!where || !where.length)
    throw new Error(
      "Must contain where clause if the --where flag is used or an 'OR' query is being used"
    );
  let whereFilters = [];
  if ("or" in where || "OR" in where) {
    let orClause = where;
    while ("or" in orClause || "OR" in orClause) {
      const firstClause = where.slice(0, where.indexOf("or"));
      orClause = orClause.slice(
        orClause.indexOf("or") + 1,
        orClause.length
      ) as any;
      for (let i = 0; i + 3 < firstClause.length; i += 3)
        whereFilters.push(
          Filter.where(firstClause[i], firstClause[i + 1], firstClause[i + 2])
        );
    }
    ref = ref.where(Filter.or(...whereFilters));
  } else {
    for (let i = 0; i + 3 < where.length; i += 3)
      ref = ref.where(where[i], where[i + 1], where[i + 2]);
  }
  return ref;
}

export function printDocuments(
  snapshot: QuerySnapshot | DocumentSnapshot,
  chalk: ChalkInstance,
  failedToStartPager = true,
  whiteSpace = 2,
  stdOutput = ""
) {
  const INDENT = " ".repeat(whiteSpace);
  const NEWLINE_AMOUNT = Math.floor(Math.max(1, Math.log2(whiteSpace)));
  let output: string;
  if (snapshot instanceof DocumentSnapshot) {
    output =
      `${snapshot.id} => ${printObj(snapshot.data(), 0, INDENT, chalk)}` +
      "\n".repeat(NEWLINE_AMOUNT);
    if (failedToStartPager) process.stdout.write(output);
    else return output;
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
