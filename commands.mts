import { Command } from "commander";
import add from "./add.mjs";
import get from "./get.mjs";
import update from "./update.mjs";
import deleteDoc from "./delete.mjs";
import whereOptionParser from "./utils/where-option-parser.mjs";
import { init } from "./init.mjs";
import { resetEnv } from "./reset.mjs";
import { CLI_LOG } from "./utils/logging.mjs";
const program = new Command();

try {
  program
    .name("firestore-cli")
    .description("CLI tool to query the google cloud firestore database")
    .version("1.0.7");

  program
    .command("add <collection> [new-document-data]")
    .description("Add document to a collection")
    .option(
      "-c, --credentials <VALUE>",
      `File path to the OAuth2 credentials JSON file. If this option is not provided, the program looks for the file in the \`${CREDENTIALS}\` directory`,
    )
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication.`,
    )
    .option("-b, --bulk", "Perform bulk add operations")
    .option(
      "-f --file <VALUE>",
      "Read input from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format",
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag",
    )
    .option(
      "--custom-id <VALUE>",
      "Allows the customization of the document id for the addition of a single document.",
    )
    .option(
      "--custom-ids [VALUE...]",
      "Allows the customization of the document id for bulk addition of documents. Must be used in conjunction with the --bulk flag or an error occurs",
    )
    .action(add);

  program
    .command("get <collection>")
    .description("Fetch documents from a collection")
    .option(
      "-c, --credentials <VALUE>",
      `File path to the OAuth2 credentials JSON file. If this option is not provided, the program looks for the file in the \`${CREDENTIALS}\` directory`,
    )
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication.`,
    )
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option(
      "-w, --where [VALUE...]",
      "Specify filtering conditions for querying documents. Provide a space-separated list of arguments in the format:\n`<field> <operator> <value>`. Supported operators include: `==`, `!=`, `<`, `<=`, `>`, `>=`, `array-contains`,\n`array-contains-any`, `in`, and `not-in`. If specifying a numeric value as a string, enclose it in nested quotes.\nExample: `-w id '==' '\"22\"' and age '>' 18  or status '==' active`. When using query modifiers, such as --where, --asc, --start, --limit... order matters, learn more: https://firebase.google.com/docs/firestore/query-data/get-data",
      whereOptionParser,
    )
    // TODO: complete....
    .option(
      "-a, --asc <field>",
      "Order results in an ascending order. To be implemented soon.",
    )
    .option(
      "-d, --desc <field>",
      "Order results in an descending order. To be implemented soon.",
    )
    .option(
      "-s, --start <VALUES...>",
      "Place cursor at a list of values.\nEach value must correspond to the number of --asc/--desc flags used.\nExample: `-w id '==' 'AyuiI9=' -a age -a number_of_hobbies -s 18 2`. To be implemented soon.",
    )
    .option(
      "-e, --end <VALUES...>",
      "Place ending cursor at a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-sb, --start-before <VALUES...>",
      "Place cursor before a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-eb, --end-before <VALUES...>",
      "Place ending cursor before a list of values. See --start",
    )
    .option(
      "-sa, --start-after <VALUES...>",
      "Place cursor after a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-ea, --end-after <VALUES...>",
      "Place ending cursor after a list of values. See --start. To be implemented soon.",
    )
    .option(
      "-l, --limit <VALUE>",
      "Limit results to `VALUE` count documents. To be implemented soon.",
    )
    .option(
      "-ws, --white-space <VALUE>",
      "Numerical value that determines the amount of whitespace and indentation the documents should be printed with. Maximum value is 8",
      parseInt,
    )
    .option("-j, --json", "Format output in JSON format")
    .option("-np, --no-pager", "The option to print results without a pager.")
    .option(
      "--pager <VALUE>",
      "Customizes which pager should be used to read output. The default is 'less'",
      "less",
    )
    .option(
      "--pager-args [ARGS...]",
      "The arguments which should be passed to the pager",
    )
    .action(get);

  program
    .command("update <collection> [data] [document-id...]")
    .description("Update document(s) in a collection")
    .option(
      "-c, --credentials <VALUE>",
      `File path to the OAuth2 credentials JSON file. If this option is not provided, the program looks for the file in the \`${CREDENTIALS}\` directory`,
    )
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication.`,
    )
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option("-b, --bulk", "Perform bulk update operations")
    .option(
      "-f --file <VALUE>",
      "Read input from a file.\nData is in the form of an object with the keys being the document IDs of the document(s) to be updated and the value being the new data.\nUnless the --file-type flag is set, the file is assumed to be in JSON format",
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag",
    )
    .option(
      "-o, --overwrite",
      "Update the document by replace its existing data. A merge is done instead if this option is not set.",
    )
    .action(update);

  program
    .command("delete <collection> [document-ids...]")
    .description("Delete document(s) from a collection")
    .option(
      "-k, --service-account-key <VALUE>",
      `Filepath to the service account key file for authentication.`,
    )
    .option(
      "--database-id <VALUE>",
      "Specifies the database Id. If not specified `(default)` is used.",
    )
    .option("-b, --bulk", "Perform bulk add operations")
    .option(
      "-f --file <VALUE>",
      "Read documentIds from a file. Unless the --file-type flag is set, the file is assumed to be in JSON format",
    )
    .option(
      "--file-type <VALUE>",
      "Specify the file type of the input file. To be used in conjunction with the --file flag",
    )
    .action(deleteDoc);
} catch (error) {
  CLI_LOG(error, "error");
}
export { program };
