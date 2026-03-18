import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { BlockingQueue } from "../../utils/algorithms/blocking-queues.js";
import { isCollection } from "./type-guards.mjs";

export async function discoverPaths(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  ref: CollectionReference | DocumentReference,
  signal?: AbortSignal,
) {
  if (signal?.aborted) return;
  if (!isCollection(ref)) return;
  const docs = await ref.listDocuments();
  return Promise.all(
    docs.map(async (doc) => {
      if (!signal?.aborted) return queue.enqueue(doc);
    }),
  );
}
