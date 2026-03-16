import { jest } from "@jest/globals";
import { BlockingQueue } from "../../utils/algorithms/blocking-queues.js";
import { workerPool } from "../../utils/worker-pool.mjs";
import { WriteResult } from "@google-cloud/firestore";
import { discoverPaths as realDiscoverPaths } from "../../utils/firestore/path-discoverer.mjs";

// Mock the discovery module
jest.unstable_mockModule("../../utils/firestore/path-discoverer.mjs", () => ({
  discoverPaths: jest.fn(),
}));

// Re-import after mocking
const { discoverPaths } = await import(
  "../../utils/firestore/path-discoverer.mjs"
);

describe("Worker Pool Engine", () => {
  let queue: BlockingQueue<any>;
  let mockCallback: jest.Mock;
  let mockErrCallback: jest.Mock;

  beforeEach(() => {
    queue = new BlockingQueue({ maxSize: 100 });
    mockCallback = jest
      .fn<() => Promise<WriteResult>>()
      .mockResolvedValue({ writeTime: new Date() } as unknown as WriteResult);
    mockErrCallback = jest.fn<(reason: string, err: Error | any) => void>();
    jest.clearAllMocks();
  });

  it("should process a single document and shut down", async () => {
    const mockDoc = {
      type: "document",
      path: "users/1",
      listCollections: jest
        .fn<() => Promise<Array<string>>>()
        .mockResolvedValue([]),
    };

    await queue.enqueue(mockDoc);

    // This should resolve when the queue and activeTasks are both 0
    await workerPool(queue, mockCallback as any, null, null, {
      recursive: true,
      discoverer: discoverPaths,
    });
  });

  it("should recurse to process all documents and shut down", async () => {
    debugger;
    const enqueuePromises = [];
    for (let i = 1; i <= 10; i++) {
      const mockDoc = {
        type: "document",
        path: `users/${i}`,
        listCollections: jest
          .fn<() => Promise<Array<any>>>()
          .mockResolvedValue([
            {
              type: "collection",
              path: `users/${i}/pets`,
              listDocuments: jest
                .fn<() => Promise<Array<any>>>()
                .mockResolvedValue([
                  {
                    type: "document",
                    path: `users/${i}/pets/jake`,
                    listCollections: jest
                      .fn<() => Promise<never[]>>()
                      .mockResolvedValue([]),
                  },
                  {
                    type: "document",
                    path: `users/${i}/pets/blake`,
                    listCollections: jest
                      .fn<() => Promise<never[]>>()
                      .mockResolvedValue([]),
                  },
                  {
                    type: "document",
                    path: `users/${i}/pets/drake`,
                    listCollections: jest
                      .fn<() => Promise<never[]>>()
                      .mockResolvedValue([]),
                  },
                ]),
            },
          ]),
      };

      enqueuePromises.push(queue.enqueue(mockDoc));
    }
    await Promise.all(enqueuePromises);

    // This should resolve when the queue and activeTasks are both 0
    await workerPool(queue, mockCallback as any, null, null, {
      recursive: true,
      discoverer: realDiscoverPaths,
    });

    expect(mockCallback).toHaveBeenCalledTimes(40);
    expect(queue.getStatus()).toContain("CLOSED");
  });

  it("should respect the recursive flag for collections", async () => {
    const mockCol = { type: "collection", path: "users" };
    await queue.enqueue(mockCol);

    await workerPool(queue, mockCallback as any, null, null, {
      recursive: true,
      discoverer: discoverPaths,
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(discoverPaths).toHaveBeenCalledWith(
      queue,
      mockCol,
      expect.any(AbortSignal),
    );
  });

  it("should throw error and stop if collection is found without recurse flag", async () => {
    const mockCol = { type: "collection", path: "users" };
    await queue.enqueue(mockCol);

    await workerPool(queue, mockCallback as any, mockErrCallback, null, {
      recursive: false,
    });

    expect(mockErrCallback).toHaveBeenCalledWith(
      "Unexpected Error",
      expect.objectContaining({
        message: "Collection Path provided without --recurse",
      }),
    );
  });

  it("should trigger abort signal on timeout", async () => {
    // 1. Arrange: Create a callback that waits longer than the timeout
    // We use a slightly longer delay than the timeout (100ms vs 150ms)
    mockCallback.mockImplementation(async (_, signal: AbortSignal) => {
      return new Promise((resolve, _) => {
        const timer = setTimeout(() => {
          // If the signal aborted as expected, we resolve "successfully"
          // for the test to inspect the state.
          resolve({} as any);
        }, 150);

        // Listen for the abort event to resolve/reject earlier if needed
        signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          resolve({} as any);
        });
      });
    });

    const mockDoc = {
      type: "document",
      path: "slow/doc",
      listCollections: jest
        .fn<() => Promise<Array<string>>>()
        .mockResolvedValue([]),
    };
    await queue.enqueue(mockDoc);

    // 2. Act: Set a short timeout of 50ms
    const timeout = 50;
    await workerPool(queue, mockCallback as any, null, null, {
      recursive: false,
      timeout,
    });

    // 3. Assert: Check the signal state in the last call
    const lastCallArgs = mockCallback.mock.calls[0];
    const signal = lastCallArgs[1] as AbortSignal;

    expect(signal).toBeDefined();
    expect(signal.aborted).toBe(true); // This is the crucial check
  });
});
