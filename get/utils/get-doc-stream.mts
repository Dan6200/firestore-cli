export async function* getDocStream(
  db: FirebaseFirestore.Firestore,
  paths: string[],
) {
  const docRefs = paths.filter(Boolean).map((p) => db.doc(p));

  const BATCH_SIZE = 100;
  for (let i = 0; i < docRefs.length; i += BATCH_SIZE) {
    const batch = docRefs.slice(i, i + BATCH_SIZE);
    const snapshots = await db.getAll(...batch);
    for (const doc of snapshots) {
      yield doc;
    }
  }
}
