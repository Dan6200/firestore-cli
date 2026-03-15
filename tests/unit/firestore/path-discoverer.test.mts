import { jest } from "@jest/globals";
import { BlockingQueue } from "../../../utils/algorithms/blocking-queues.js";
import { discoverPaths } from "../../../utils/firestore/path-discoverer.mjs";

describe("discoverPaths", () => {
  let queue: BlockingQueue<any>;

  beforeEach(() => {
    queue = new BlockingQueue();
  });

  it("should list documents and enqueue them", async () => {
    // 1. Mock the Firestore CollectionReference
    const mockDoc1 = { path: "users/1", type: "document" };
    const mockDoc2 = { path: "users/2", type: "document" };

    const mockCollection = {
      type: "collection",
      listDocuments: jest
        .fn<() => Promise<any[]>>()
        .mockResolvedValue([mockDoc1, mockDoc2]),
    };

    // 2. Run discovery
    await discoverPaths(queue, mockCollection as any);

    // 3. Assert
    expect(queue.size).toBe(2);
    expect(await queue.dequeue()).toBe(mockDoc1);
    expect(await queue.dequeue()).toBe(mockDoc2);
  });

  it("should exit immediately if signal is already aborted", async () => {
    const mockCollection = {
      type: "collection",
      listDocuments: jest
        .fn<() => Promise<any[]>>()
        .mockResolvedValue([{ path: "users/1" }]),
    };

    // Create an already aborted signal
    const controller = new AbortController();
    controller.abort();

    await discoverPaths(queue, mockCollection as any, controller.signal);

    // Should not have called Firestore and should not have enqueued anything
    expect(mockCollection.listDocuments).not.toHaveBeenCalled();
    expect(queue.size).toBe(0);
  });

  it("should stop enqueuing if aborted during the loop", async () => {
    const mockDocs = [{ path: "1" }, { path: "2" }, { path: "3" }];
    const mockCollection = {
      type: "collection",
      listDocuments: jest
        .fn<() => Promise<any[]>>()
        .mockResolvedValue(mockDocs),
    };

    const controller = new AbortController();

    // Mock enqueue to abort the controller mid-way
    const originalEnqueue = queue.enqueue.bind(queue);
    jest.spyOn(queue, "enqueue").mockImplementation(async (item) => {
      if (item.path === "2") controller.abort();
      return originalEnqueue(item);
    });

    await discoverPaths(queue, mockCollection as any, controller.signal);

    // It should have enqueued "1" and "2", but stopped before "3"
    expect(queue.size).toBe(2);
  });
});
