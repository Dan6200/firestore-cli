import { BlockingQueue } from "../../../utils/algorithms/blocking-queues.js";

describe("Async Blocking Queue", () => {
  it("must add to queue asynchronously", async () => {
    const queue = new BlockingQueue();
    const loop1 = 50 + Math.floor(Math.random() * 100);
    const loop2 = 50 + Math.floor(Math.random() * 100);
    const loop3 = 50 + Math.floor(Math.random() * 100);
    const asyncEnqueue1 = new Array(loop1)
      .fill("foo")
      .map(async (foo) => queue.enqueue(foo));
    const asyncEnqueue2 = new Array(loop2)
      .fill("foo")
      .map(async (foo) => queue.enqueue(foo));
    const asyncEnqueue3 = new Array(loop3)
      .fill("foo")
      .map(async (foo) => queue.enqueue(foo));

    await Promise.all([asyncEnqueue1, asyncEnqueue2, asyncEnqueue3]);
    expect(queue.size).toBe(loop1 + loop2 + loop3);
  });

  it("should dequeue asynchronously and block queue when empty", async () => {
    const queue: BlockingQueue<number> = new BlockingQueue();
    const loop = 50 + Math.floor(Math.random() * 100);
    const input: number[] = [];
    for (let i = 0; i < loop; i++) {
      const item = Math.floor(Math.random() * 100);
      input.push(item);
    }
    const asyncEnqueue1 = new Array(loop)
      .fill("foo")
      .map(async () => queue.dequeue());
    const asyncEnqueue2 = input.map(async (val) => {
      queue.enqueue(val);
    });

    const [resultPromise, _] = await Promise.all([
      asyncEnqueue1,
      asyncEnqueue2,
    ]);
    const output = await Promise.all(resultPromise);
    return expect(input).toEqual(output);
  });

  it("should apply backpressure when the queue reaches maxSize", async () => {
    const maxSize = 5;
    const queue = new BlockingQueue<number>({ maxSize });

    // Fill the queue to its limit
    for (let i = 0; i < maxSize; i++) {
      await queue.enqueue(i);
    }

    let backpressureReleased = false;

    // This enqueue should BLOCK because the queue is full
    const pendingEnqueue = queue.enqueue(99).then(() => {
      backpressureReleased = true;
    });

    // Short delay to prove it's actually stuck/waiting
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(backpressureReleased).toBe(false);
    expect(queue.size).toBe(maxSize);

    // Dequeue one item to release the pressure
    await queue.dequeue();

    // Now the pending enqueue should resolve
    await pendingEnqueue;
    expect(backpressureReleased).toBe(true);
    expect(queue.size).toBe(maxSize); // Still maxSize because we dequeued 1 and enqueued 1
  });

  it("should drain correctly, waiting for all items to be processed, while rejecting new enqueues", async () => {
    const queue = new BlockingQueue<number>();
    const input = [1, 2, 3];
    const output: number[] = [];

    // Producer adds items
    for (const item of input) {
      await queue.enqueue(item);
    }

    // Consumer processes slowly
    const consumer = (async () => {
      for (let i = 0; i < input.length; i++) {
        await new Promise((res) => setTimeout(res, 20));
        output.push(await queue.dequeue());
      }
    })();

    // Drain should wait for the consumer to finish everything and reject upcoming enqueues
    const drain = queue.drain().then(() => queue.enqueue(100));

    await expect(Promise.all([drain, consumer])).rejects.toMatch(
      /Queue is draining/,
    );
    expect(output).toEqual(input);
    expect(queue.size).toBe(0);
  });

  it("should reject all pending operations when closed", async () => {
    const queue = new BlockingQueue<number>({ maxSize: 1 });
    await queue.enqueue(1); // Fill it

    // Create a pending producer (blocked by backpressure)
    const pendingProduce = queue.enqueue(2);

    // Create a pending consumer (blocked by empty-check if we were empty,
    // but here we'll just test the general close rejection)
    const emptyQueue = new BlockingQueue<number>();
    const pendingConsume = emptyQueue.dequeue();

    queue.close();
    emptyQueue.close();

    // Both should reject with an error
    await expect(pendingProduce).rejects.toThrow("Queue closed");
    await expect(pendingConsume).rejects.toThrow("Queue closed");
  });
});
