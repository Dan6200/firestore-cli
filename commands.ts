//cspell:disable
import { Command } from "commander";
import { authenticateFirestore } from "./auth-1.js";
import { Chalk } from "chalk";
export const program = new Command();

const chalk = new Chalk({ level: 3 });

program
  .command("get <collection>")
  .option(
    "--print-depth=<VALUE>",
    "Control the depth of the results objects",
    parseInt,
    3
  )
  .description("Fetch documents from a collection")
  .action(async (collection) => {
    try {
      const db = await authenticateFirestore(
        "./secret-key/linkid-app-561d4-firebase-adminsdk-boiy2-a1b3f125aa.json"
      );
      const snapshot = await db.collection(collection).get();
      if (snapshot.empty) {
        console.log("[]");
        return;
      }
      const INDENT = "    ";
      console.log("[");
      function printObj(obj: object, level = 1, char = INDENT) {
        let result = "{\n";
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === "number")
            result += `${char.repeat(level + 1)}${key}: ${chalk.blue(
              `${value}`
            )}\n`;
          if (typeof value === "string")
            result += `${char.repeat(level + 1)}${key}: ${chalk.green(
              `'${value}'`
            )}\n`;
          if (
            value !== null &&
            typeof value === "object" &&
            Object.keys(value).length
          )
            printObj(value, level + 1);
        });
        result += char.repeat(level) + "}";
        return result;
      }
      let docCount = 1;
      snapshot.forEach((doc) => {
        if (docCount !== snapshot.size)
          console.log(`${INDENT + doc.id} => ${printObj(doc.data())},`);
        else console.log(`${INDENT + doc.id} => ${printObj(doc.data())}`);
        docCount++;
      });
      console.log("]");
    } catch (e) {
      console.error(e);
    }
  });
