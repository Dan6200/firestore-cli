import { Command } from "commander";
import add from "./add.mjs";
import get from "./get.mjs";
const program = new Command();

program
  .name("firestore-cli")
  .description("CLI tool to query google cloud firebase firestore database")
  .version("1.0.0")
  .option(
    "--service-account <VALUE>",
    "Filepath to the service account JSON key file for authentication.\nMust provide the file path as an argument to the option '--service-account' or include a directory named 'service-account' with the JSON key file in it."
  )
  .option("--database-id <VALUE>", "Specifies the database Id")
  .option(
    "--pager <VALUE>",
    "Customizes which pager should be used to read output. The default is 'less'"
  )
  .option(
    "--custom-id <VALUE>",
    "Allows the customization of the document id for the addition of a single document."
  )
  .option(
    "--custom-ids [VALUE...]",
    "Allows the customization of the document id for bulk addition of documents. Must be used in conjunction with the --bulk flag or an error occurs"
  )
  .option(
    "--pager-args [ARGS...]",
    "The arguments which should be passed to the pager"
  );

program
  .command("add <collection> [new-document-data]")
  .option(
    "-ws, --white-space <VALUE>",
    "Determines the amount of whitespace and indentation the documents should be printed with",
    parseInt
  )
  .option("-j, --json", "Output should be in JSON format")
  .option("-b, --bulk", "Perform bulk add operations")
  .option(
    "-f --file <VALUE>",
    "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format"
  )
  .description("Add document to a collection")
  .action(add.bind(null, program.opts()));

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
