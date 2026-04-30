import {
  BulkWriterError,
  CollectionReference,
  DocumentReference,
  WriteResult,
} from "@google-cloud/firestore";
import { BlockingQueue } from "../algorithms/blocking-queues.js";
import { isCollection } from "../firestore/type-guards.mjs";
import { discoverPaths } from "../firestore/path-discoverer.mjs";
import { AsyncGate } from "../async-gate.mjs";

export async function workerPool(
  queue: BlockingQueue<CollectionReference | DocumentReference>,
  callback: (
    ref: DocumentReference,
    signal?: AbortSignal,
  ) => Promise<WriteResult>,
  errCallback?: (
    ref: CollectionReference | DocumentReference,
    error?: Error | BulkWriterError,
  ) => void,
  logger?: (message: string, level?: "info" | "error" | "debug") => void,
  options: {
    recursive?: boolean;
    timeout?: number;
    concurrencyLimit?: number;
    discoverer?: typeof discoverPaths;
  } = {},
) {
  const {
    recursive = false,
    timeout = 30_000,
    concurrencyLimit = 20,
    discoverer,
  } = options;

  const gate = new AsyncGate(concurrencyLimit);
  const activeTasks = new Set<Promise<unknown>>();

  try {
    while (true) {
      const ref = await queue.dequeue(); // Gets stuck here...

      if (activeTasks.size >= 100) {
        await Promise.race(activeTasks);
      }

      const controller = new AbortController();
      const { signal } = controller;
      let timer: NodeJS.Timeout = null;
      const task = gate
        .run(async () => {
          timer = setTimeout(() => controller.abort(), timeout);

          if (isCollection(ref)) {
            if (recursive) {
              if (!discoverer)
                throw new Error(
                  "Must provide discoverer helper for recursive traversals",
                );
              await discoverer(queue, ref, signal);
            } else {
              throw new Error("Collection Path provided without --recurse");
            }
          } else {
            if (recursive) {
              const subCollections = await ref.listCollections();
              for (const sub of subCollections) {
                queue.enqueue(sub);
              }
            }
            callback(ref, signal); // <-- DON'T await...
          }
        })
        .catch((error) => {
          if (signal.aborted) {
            if (errCallback) {
              const reason = `Task timed out for: ${ref.path}`;
              errCallback(ref, new Error(reason));
            } else {
              logger?.(error, "error");
            }
          } else if (error.toString().match(/Queue( \w)* closed/)) {
            throw error;
          } else {
            if (errCallback) {
              errCallback(ref, error);
            } else {
              logger?.(error, "error");
            }
          }
        })
        .finally(async () => {
          clearTimeout(timer);
          activeTasks.delete(task);
          if (queue.size === 0 && activeTasks.size === 0) {
            queue.close();
          }
          logger?.("ref: " + (ref ? ref.path : "null"), "debug");
          queue.getStatus().match(/CLOSED/) &&
            logger?.("Pending processing...", "info");
        });

      logger?.(`Active tasks: ${activeTasks.size.toString()}`, "debug");
      activeTasks.add(task);
      logger?.(queue.getStatus(), "debug");
      logger?.(
        queue.size
          ? `Deleting ${queue.size.toString()} document(s)...`
          : `Discovering new documents to delete...`,
        "info",
      );
    }
  } catch (err: any) {
    if (!err.toString().match(/Queue( \w)* closed/)) {
      const reason = `Unexpected Error`;
      if (errCallback) {
        errCallback(null, new Error(reason));
      } else {
        logger?.(err, "error");
      }
    }
  } finally {
    await Promise.allSettled(activeTasks);
  }
}
