export function validateFileInput(fileData: unknown) {
  if (
    !Array.isArray(fileData) ||
    fileData?.length <= 0 ||
    !fileData?.[0].data
  ) {
    throw new Error(
      "Input data must be an Array with entries for `id` and `data`.",
    );
  }
  return true;
}
