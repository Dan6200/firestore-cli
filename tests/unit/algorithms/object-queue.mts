import { ObjectQueue } from "../../../utils/algorithms/object-queue.js";

describe("Object Queue", () => {
  it("Should enqueue elements while correctly asserting its size", () => {
    const queue = new ObjectQueue();
    const iteration = 50 + Math.floor(Math.random() * 100);
    for (let i = 0; i < iteration; i++) {
      const item = Math.random() * 100;
      queue.enqueue(item);
    }
    expect(queue.length).toBe(iteration);
  });

  it("Should initialize elements with an array", () => {
    const iteration = 50 + Math.floor(Math.random() * 100);
    const list = new Array(iteration).fill("foo");
    const queue = new ObjectQueue(list);
    expect(queue.length).toBe(iteration);
  });

  it("Should dequeue elements while correctly asserting its size", () => {
    const iteration = 50 + Math.floor(Math.random() * 100);
    const list = new Array(iteration).fill("foo");
    const queue = new ObjectQueue(list);
    for (let i = 0; i < iteration; i++) {
      queue.dequeue();
    }
    expect(queue.length).toBe(0);
  });

  it("Should fail to dequeue an empty queue", () => {
    const iteration = 50 + Math.floor(Math.random() * 100);
    const list = new Array(iteration).fill("foo");
    const queue = new ObjectQueue(list);
    for (let i = 0; i < iteration; i++) {
      queue.dequeue();
    }
    expect(() => queue.dequeue()).toThrow("List is empty.");
  });
});
