export function formatData(
  parsedData: any,
  ids: string[],
  dataToUpdate: any = {},
) {
  if (!Array.isArray(parsedData))
    throw new Error(
      "Invalid data format: The data provided with the --bulk flag must be in array format for JSON/YAML or tabular format for CSV. Ensure your input is properly structured.",
    );
  for (const [index, eachData] of Object.entries(parsedData))
    dataToUpdate[ids[parseInt(index)]] = eachData;
  return dataToUpdate;
}
