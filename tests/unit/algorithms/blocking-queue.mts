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

    const [output, _] = await Promise.all([asyncEnqueue1, asyncEnqueue2]);
    const output_1 = await Promise.all(output);
    return expect(input).toEqual(output_1);
  });
});
