import { ChalkInstance } from "chalk";

export function printObj(
  obj: object,
  level = 1,
  char: string,
  chalk: ChalkInstance
) {
  let result = "{\n";
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === "number")
      result += `${char.repeat(level + 1)}${key}: ${chalk.blue(`${value}`)}\n`;
    if (typeof value === "string")
      result += `${char.repeat(level + 1)}${key}: ${chalk.green(
        `'${value}'`
      )}\n`;
    if (
      value !== null &&
      typeof value === "object" &&
      Object.keys(value).length
    )
      printObj(value, level + 1, char, chalk);
  });
  result += char.repeat(level) + "}";
  return result;
}
