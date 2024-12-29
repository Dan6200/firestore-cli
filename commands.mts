import { Command } from "commander";
import get from "./get.mjs";
const program = new Command();

program
  .name("firestore-cli")
  .description("CLI tool to query google cloud firebase firestore database")
  .version("1.0.0")
  .option(
    "--secret-key <VALUE>",
    "Filepath to the secret-key for authentication.\nMust provide the file path as an argument to the option '--secret-key' or include a directory named 'secret-key' with the secret key file in it."
  )
  .option("--database-id <VALUE>", "Specifies the database Id");

program
  .command("get <collection>")
  .option(
    "-w, --where [value...]",
    "Filters according to the field, operator and value"
  )
  .option(
    "-ws, --white-space <VALUE>",
    "Determines the amount of whitespace and indentation the documents should be printed with",
    parseInt
  )
  .option("-j, --json", "Output should be in JSON format")
  .description("Fetch documents from a collection")
  .action(get.bind(null, program.opts()));

export { program };
