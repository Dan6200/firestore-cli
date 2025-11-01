import { printObj } from "../../../utils/print/object.mjs";
import { chalk } from "../__mocks__/chalk.mjs";

describe("`printObj` function", () => {
  it("should properly format a simple object", () => {
    const obj = { name: "Alice", age: 30 };
    const output = printObj(obj, 0, "    ", chalk as any);
    expect(chalk.green).toHaveBeenCalledWith("'Alice'");
    expect(chalk.blue).toHaveBeenCalledWith("30");
    expect(output).toBe(
      `
{
    name: 'Alice',
    age: 30
}`.trim(),
    );
  });
  it("should correctly handle nested objects", () => {
    const obj = { name: "Alice", address: { city: "Wonderland", zip: 1234 } };
    const output = printObj(obj, 0, "    ", chalk as any);
    expect(chalk.green).toHaveBeenCalledWith("'Alice'");
    expect(chalk.green).toHaveBeenCalledWith("'Wonderland'");
    expect(chalk.blue).toHaveBeenCalledWith("1234");
    expect(output).toBe(
      `
{
    name: 'Alice',
    address: {
        city: 'Wonderland',
        zip: 1234
    }
}`.trim(),
    );
  });
  it("should correctly handle array objects", () => {
    const obj = {
      name: "Alice",
      address: { city: "Wonderland", zip: 1234 },
      friends: ["Dinah the cat", "The white rabbit", "The mad hatter"],
    };
    const output = printObj(obj, 0, "    ", chalk as any);
    expect(chalk.green).toHaveBeenCalledWith("'Alice'");
    expect(chalk.green).toHaveBeenCalledWith("'Wonderland'");
    expect(chalk.blue).toHaveBeenCalledWith("1234");
    expect(output).toBe(
      `
{
    name: 'Alice',
    address: {
        city: 'Wonderland',
        zip: 1234
    },
    friends: [
        "Dinah the cat",
        "The white rabbit",
        "The mad hatter"
    ]
}`.trim(),
    );
  });
});
