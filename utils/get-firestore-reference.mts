const DOCUMENT_PATH_REGEX = /^(\w+\/[-\w@$()+.]+)(?:\/(\w+\/[-\w@$()+.]+))*$/;
const COLLECTION_PATH_REGEX = /^(\w+)(?:\/(\w+\/[-\w@$()+.]+))*$/;

export function getFirestoreReference(
  db: FirebaseFirestore.Firestore,
  path: string,
) {
  if (path.match(DOCUMENT_PATH_REGEX)) return db.doc(path);
  if (path.match(COLLECTION_PATH_REGEX)) return db.collection(path);
  throw new Error(
    "Malformed paths:\nDocument paths must haave even number segments separated by a slash `\`.\nCollection paths must have odd number segments with no slash if it is just the parent collection.\n No trailing slashes are allowed",
  );
}
