const ID_CHARS = "[-\\w@$()+.]+"; // A valid ID segment, including hyphens
const DOCUMENT_PATH_REGEX = new RegExp(
  // /^([-\w@()+.]+\/[-\w@()+.]+)(\/([-\w@()+.]+\/[-\w@()+.]+))*$/
  `^(${ID_CHARS}\/${ID_CHARS})(\/(${ID_CHARS}\/${ID_CHARS}))*$`,
);
const COLLECTION_PATH_REGEX = new RegExp(
  // /^([-\w@$()+.]+)(\/([-\w@$()+.]+\/[-\w@$()+.]+))*$/
  `^(${ID_CHARS})(\/(${ID_CHARS}\/${ID_CHARS}))*$`,
);

export function getFirestoreReference(
  db: FirebaseFirestore.Firestore,
  path: string,
) {
  if (!path) throw new Error("Path must be a non-empty string. Got :" + path);
  if (path.match(DOCUMENT_PATH_REGEX)) return db.doc(path);
  if (path.match(COLLECTION_PATH_REGEX)) return db.collection(path);
  throw new Error(
    "Malformed paths:\nDocument paths must haave even number segments separated by a slash `\`.\nCollection paths must have odd number segments and no slash if it is just the parent collection.\n No trailing slashes are allowed.",
  );
}

export function getCollectionReference(
  db: FirebaseFirestore.Firestore,
  path: string,
) {
  if (!path) throw new Error("Path must be a non-empty string. Got :" + path);
  if (path.match(COLLECTION_PATH_REGEX)) return db.collection(path);
  throw new Error(
    "Malformed path:\nCollection paths must have odd number segments separated by a slash and no slash if it is just the parent collection.\n No trailing slashes are allowed.",
  );
}

export function getDocumentReference(
  db: FirebaseFirestore.Firestore,
  path: string,
) {
  if (!path) throw new Error("Path must be a non-empty string. Got :" + path);
  if (path.match(DOCUMENT_PATH_REGEX)) return db.doc(path);
  throw new Error(
    "Malformed paths:\nDocument paths must haave even number segments separated by a slash `\`.\n No trailing slashes are allowed",
  );
}
