export default (arg: string, prevArgs: any[] = []): any[] => {
  // Boolean Check
  if (arg.toLowerCase() === "true") return prevArgs.concat([true]);
  if (arg.toLowerCase() === "false") return prevArgs.concat([false]);
  if (arg.toLowerCase() === "null") return prevArgs.concat([null]);

  // Explicitly Quoted Numbers (e.g. "123" -> "123" as string)
  const isQuoted =
    (arg.startsWith('"') && arg.endsWith('"')) ||
    (arg.startsWith("'") && arg.endsWith("'"));

  if (isQuoted) {
    const unquoted = arg.slice(1, -1);
    // If it's a number inside quotes, treat it as a string
    return prevArgs.concat([unquoted]);
  }

  // Pure Numbers (e.g. 123 -> 123 as number)
  const numericValue = Number(arg);
  if (!isNaN(numericValue) && arg.trim() !== "") {
    return prevArgs.concat([numericValue]);
  }

  // Default: Return as raw string
  return prevArgs.concat([arg]);
};
