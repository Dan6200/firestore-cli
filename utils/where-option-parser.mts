export default (arg: string, prevArgs: any[] = []) => {
  // Handle string array args...
  const prevArg = prevArgs[prevArgs.length - 1];
  if (
    prevArg === "in" ||
    prevArg === "not-in" ||
    prevArg === "array-contains-any"
  )
    return prevArgs.concat([JSON.parse(arg)]);
  // Handle string numerals and nested string numerals...
  return prevArgs.concat([
    !isNaN(Number(arg))
      ? Number(arg)
      : arg[0] === '"' &&
        arg[arg.length - 1] === arg[0] &&
        !isNaN(Number(arg.slice(1, arg.length - 1)))
      ? arg.slice(1, arg.length - 1)
      : arg,
  ]);
};
