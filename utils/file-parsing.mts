/****
 * const fs = require("fs");
const yaml = require("js-yaml");
const { parse } = require("csv-parse/sync");

function parseInput(filePath, fileType) {
  const content = fs.readFileSync(filePath, "utf8");

  switch (fileType.toLowerCase()) {
    case "json":
      return JSON.parse(content);
    case "yaml":
    case "yml":
      return yaml.load(content);
    case "csv":
      return parse(content, { columns: true });
    default:
      throw new Error("Unsupported file type. Use JSON, YAML, or CSV.");
  }
}
***************************/
