/**
 * A reducer to parse CLI arguments for Firestore filters.
 * Logic:
 * 1. If prev arg is an array operator -> Try JSON, fallback to CSV.
 * 2. If arg is "true"/"false" -> Boolean.
 * 3. If arg is numeric-looking -> Number.
 * 4. If arg is quoted-numeric -> String (escaped number).
 */
export default (arg: string, prevArgs: any[] = []): any[] => {
  const prevArg = prevArgs[prevArgs.length - 1];
  const arrayOps = ["in", "not-in", "array-contains-any"];

  // --- 1. HANDLE ARRAY-BASED OPERATORS ---
  if (arrayOps.includes(prevArg)) {
    let parsedValue: any[];

    // Attempt JSON (for complex objects/explicit arrays)
    if (arg.startsWith("[") && arg.endsWith("]")) {
      try {
        parsedValue = JSON.parse(arg);
        if (Array.isArray(parsedValue)) return prevArgs.concat([parsedValue]);
      } catch (e) {
        // Fail silently and fall through to CSV parsing
      }
    }

    // Fallback: CSV parsing
    parsedValue = arg
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return prevArgs.concat([parsedValue]);
  }

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
