import {
  CollectionReference,
  DocumentReference,
} from "@google-cloud/firestore";
import { BlockingQueue } from "../../utils/algorithms/blocking-queues.js";
import { isCollection } from "../firestore-utils.mjs";

export async function discoverPaths(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  ref: CollectionReference | DocumentReference,
  signal?: AbortSignal,
) {
  if (signal.aborted) return;
  if (!isCollection(ref)) return;
  const docs = await ref.listDocuments();
  for (const doc of docs) {
    queue.enqueue(doc);
  }
}
