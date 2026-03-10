import {
  CollectionReference,
  DocumentReference,
  WriteResult,
} from "@google-cloud/firestore";
import { BlockingQueue } from "../utils/algorithms/blocking-queues.js";
import pLimit from "p-limit";

function isCollection(ref: any): ref is CollectionReference {
  return ref.type === "collection";
}

async function discoverPaths(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  ref: CollectionReference | DocumentReference,
) {
  if (!isCollection(ref)) return;
  const docs = await ref.listDocuments();
  for (const doc of docs) {
    queue.enqueue(doc);
  }
}

export async function processQueue(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  recursive: Boolean,
  callback: (ref: DocumentReference) => Promise<WriteResult>,
) {
  const limit = pLimit(20);
  const tasks = [];
  while (queue.size) {
    const refPromise = queue.dequeue();
    const task = limit(
      async (refPromise: Promise<CollectionReference | DocumentReference>) => {
        const ref = await refPromise;
        if (isCollection(ref)) {
          if (recursive) {
            await discoverPaths(queue, ref);
          } else {
            throw new Error(
              "Collection Path provided. To recursively delete, you must provide the --recurse flag",
            );
          }
        } else {
          if (recursive) {
            const subCollections = await ref.listCollections();
            for (const sub of subCollections) {
              await discoverPaths(queue, sub);
            }
            await callback(ref);
          }
        }
      },
      refPromise,
    );
    tasks.push(task);
  }
  queue.close();
  await Promise.all(tasks);
}
