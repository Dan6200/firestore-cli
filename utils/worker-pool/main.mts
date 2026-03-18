import {
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
  errCallback?: (reason: string, error?: Error) => void,
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
      const ref = await queue.dequeue();

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
              await discoverer?.(queue, ref, signal);
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
            await callback(ref, signal);
          }
        })
        .catch((error) => {
          let reason: string;
          if (signal.aborted) {
            if (errCallback) {
              reason = `Task timed out for: ${ref.path}`;
              errCallback(reason);
            } else {
              console.error(reason);
            }
          } else {
            reason = "Unexpected Error";
            if (errCallback) {
              errCallback(reason, error);
            } else {
              console.log(reason);
              console.error(error);
            }
          }
        })
        .finally(() => {
          clearTimeout(timer);
          activeTasks.delete(task);

          if (queue.size === 0 && activeTasks.size === 0) {
            queue.close();
          }
        });

      activeTasks.add(task);
      logger?.(queue.getStatus());
    }
  } catch (err: any) {
    if (!err.message.match(/Queue closed:/)) {
      const reason = `Unexpected Error`;
      if (errCallback) {
        errCallback(reason, err);
      } else {
        console.log(reason);
        console.error(err);
      }
    }
  }
  await Promise.allSettled(activeTasks);
}
