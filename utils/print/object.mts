import { ChalkInstance } from "chalk";

export function printObj(
  obj: object,
  level = 1,
  char: string,
  chalk: ChalkInstance,
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
        chalk,
      )}`;
    }
    // add a comma on all fields or items except the last
    result += index === Object.keys(obj).length ? "\n" : ",\n";
    index++;
  }

  result += char.repeat(level) + "}";
  return result;
}
