import { Command } from "commander";
import add from "./add.mjs";
import get from "./get.mjs";
import update from "./update.mjs";
import deleteDoc from "./delete.mjs";
import whereOptionParser from "./utils/where-option-parser.mjs";
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
    "--pager-args [ARGS...]",
    "The arguments which should be passed to the pager"
  );

program
  .command("update <collection> [data] [document-id...]")
  .option("-b, --bulk", "Perform bulk update operations")
  .option(
    "-f --file <VALUE>",
    "Read input from a file.\nData is in the form of an object with the keys being the document IDs of the document(s) to be updated and the value being the new data.\nUnless the --file-type flag is set, the file is assumed to be in JSON format"
  )
  .option(
    "--file-type <VALUE>",
    "Specify the file type of the input file. To be used in conjunction with the --file flag"
  )
  .option("-o, --overwrite", "Update the document by replace its existing data")
  .description("Update document in a collection")
  .action(update.bind(null, program.opts()));

program
  .command("delete <collection> [document-ids...]")
  .option("-b, --bulk", "Perform bulk add operations")
  .option(
    "-f --file <VALUE>",
    "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format"
  )
  .option(
    "--file-type <VALUE>",
    "Specify the file type of the input file. To be used in conjunction with the --file flag"
  )
  .description("Delete document(s) from a collection")
  .action(deleteDoc.bind(null, program.opts()));

program
  .command("add <collection> [new-document-data]")
  .option("-b, --bulk", "Perform bulk add operations")
  .option(
    "-f --file <VALUE>",
    "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format"
  )
  .option(
    "--file-type <VALUE>",
    "Specify the file type of the input file. To be used in conjunction with the --file flag"
  )
  .option(
    "--custom-id <VALUE>",
    "Allows the customization of the document id for the addition of a single document."
  )
  .option(
    "--custom-ids [VALUE...]",
    "Allows the customization of the document id for bulk addition of documents. Must be used in conjunction with the --bulk flag or an error occurs"
  )
  .description("Add document to a collection")
  .action(add.bind(null, program.opts()));

program
  .command("get <collection>")
  .option(
    "-w, --where [VALUE...]",
    "Specify filtering conditions for querying documents. Provide a space-separated list of arguments in the format:\n`<field> <operator> <value>`. Supported operators include: `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`,\n`array-contains-any`, `in`, and `not-in`. If specifying a numeric value as a string, enclose it in nested quotes.\nExample: `-w id '==' '\"22\"' and age '>' 18  or status '==' active`",
    whereOptionParser
  )
  .option(
    "-ws, --white-space <VALUE>",
    "Numerical value that determines the amount of whitespace and indentation the documents should be printed with. Maximum value is 8",
    parseInt
  )
  .option("-j, --json", "Format output in JSON format")
  .description("Fetch documents from a collection")
  .action(get.bind(null, program.opts()));

export { program };
