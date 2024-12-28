import { ChalkInstance } from "chalk";
import { Firestore } from "firebase-admin/firestore";
import { existsSync, readdirSync } from "fs";
import { MockChalk } from "./types-and-interfaces.js";
import { Options } from "commander";

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
    if (!existsSync("./secret-key"))
      throw new Error(
        "Must Provide A Secret-key File To Authenticate!\n       Either provide the file path as an argument to the option '--secret-key' or include a directory named 'secret-key' with the secret key file in it."
      );
    const secretKeyDir = readdirSync("./secret-key");
    const file = secretKeyDir.find((file) => file.endsWith(".json"));
    if (!file)
      throw new Error(
        "Your secret-key directory does not contain the JSON key file!\n       Either provide the file path as an argument to the option '--secret-key' or include a directory named 'secret-key' with the secret key file in it."
      );
    return "./secret-key/" + file;
  }
  if (!existsSync(secretKey))
    throw new Error("Secret-key file path does not exist!");
  return secretKey;
}

export function handleWhereClause(
  database: Firestore,
  collection: string,
  where: Options["where"]
) {
  return database.collection(collection).where(where[0], where[1], where[2]);
}
