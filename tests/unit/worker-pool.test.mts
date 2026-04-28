import { jest } from "@jest/globals";
import { BlockingQueue } from "../../utils/algorithms/blocking-queues.js";
import { workerPool } from "../../utils/worker-pool/main.mjs";
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
  const createMockDoc = (path: string, subCollections: any[] = []) => ({
    type: "document",
    path,
    listCollections: jest
      .fn<() => Promise<any[]>>()
      .mockResolvedValue(subCollections),
  });

  const createMockCol = (path: string, documents: any[] = []) => ({
    type: "collection",
    path,
    listDocuments: jest.fn<() => Promise<any[]>>().mockResolvedValue(documents),
  });

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
    const enqueuePromises = [];

    for (let i = 1; i <= 10; i++) {
      const pets = [
        createMockDoc(`users/${i}/pets/jake`),
        createMockDoc(`users/${i}/pets/blake`),
        createMockDoc(`users/${i}/pets/drake`),
      ];
      const petCollection = createMockCol(`users/${i}/pets`, pets);
      const userDoc = createMockDoc(`users/${i}`, [petCollection]);

      enqueuePromises.push(queue.enqueue(userDoc));
    }
    await Promise.all(enqueuePromises);

    // This should resolve when the queue and activeTasks are both empty
    await workerPool(queue, mockCallback as any, null, null, {
      recursive: true,
      discoverer: realDiscoverPaths,
    });

    expect(mockCallback).toHaveBeenCalledTimes(40);
    expect(queue.getStatus()).toContain("CLOSED");
  });

  it("should recurse even deeper to process all documents and shut down", async () => {
    const enqueuePromises = [];

    for (let i = 1; i <= 10; i++) {
      const userDocPath = `users/${i}`;
      const petColPath = `users/${i}/pets`;
      const petNames = ["jake", "blake", "drake"];

      const pets = petNames.map((name) => {
        const petDocPath = `${petColPath}/${name}`;
        const treatColPath = `${petDocPath}/treats`;
        const treatDoc = createMockDoc(`${treatColPath}/bone`);
        const treatCol = createMockCol(treatColPath, [treatDoc]);
        return createMockDoc(petDocPath, [treatCol]);
      });

      const petCollection = createMockCol(petColPath, pets);
      const userDoc = createMockDoc(userDocPath, [petCollection]);

      enqueuePromises.push(queue.enqueue(userDoc));
    }
    await Promise.all(enqueuePromises);

    // This should resolve when the queue and activeTasks are both empty
    await workerPool(queue, mockCallback as any, null, null, {
      recursive: true,
      discoverer: realDiscoverPaths,
    });

    expect(mockCallback).toHaveBeenCalledTimes(70);
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
      expect.objectContaining(mockCol),
      expect.objectContaining({
        message: "Collection Path provided without --recurse",
      }),
    );
  });

  it("should trigger abort signal on slow DISCOVERY", async () => {
    // 1. Arrange: A slow discoverer that actually gets awaited
    const slowDiscoverer = jest.fn(
      async (_: never, __: never, signal: AbortSignal) => {
        return new Promise<void>((resolve) => {
          // If signal aborts, we resolve
          signal.addEventListener("abort", () => resolve(null));
          // Otherwise we'd wait 200ms
          setTimeout(resolve, 200);
        });
      },
    );

    const mockCol = {
      type: "collection",
      path: "slow/collection",
    };
    await queue.enqueue(mockCol);

    // 2. Act: Set short timeout
    await workerPool(queue, mockCallback as any, null, null, {
      recursive: true, // Trigger the discoverer path
      discoverer: slowDiscoverer as any,
      timeout: 50,
    });

    // 3. Assert: The discoverer's signal should have aborted
    const signal = slowDiscoverer.mock.calls[0][2];
    expect(signal.aborted).toBe(true);
  });
});
