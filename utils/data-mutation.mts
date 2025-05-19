export function validateFileInput(fileData: unknown) {
  if (
    typeof fileData !== "object" ||
    fileData === null ||
    Array.isArray(fileData)
  ) {
    throw new Error("Input data must be an object with document IDs as keys.");
  }

  for (const [docId, updateData] of Object.entries(fileData)) {
    // Check that document IDs are strings
    if (typeof docId !== "string" || docId.trim() === "") {
      throw new Error(
        `Invalid document ID: "${docId}". Document IDs must be non-empty strings.`
      );
    }

    if (
      typeof updateData !== "object" ||
      updateData === null ||
      Array.isArray(updateData)
    ) {
      throw new Error(
        `Invalid update data for document ID "${docId}". Update data must be an object.`
      );
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error(
        `Update data for document ID "${docId}" must include at least one field to update.`
      );
    }
  }

  return true;
}

export function formatData(
  parsedData: any,
  ids: string[],
  dataToUpdate: any = {}
) {
  if (!Array.isArray(parsedData))
    throw new Error(
      "Invalid data format: The data provided with the --bulk flag must be in array format for JSON/YAML or tabular format for CSV. Ensure your input is properly structured."
    );
  for (const [index, eachData] of Object.entries(parsedData))
    dataToUpdate[ids[parseInt(index)]] = eachData;
  return dataToUpdate;
}
