import { AsyncGate } from "../../utils/async-gate.mjs";

describe("AsyncGate (Custom p-limit)", () => {
  it("should limit concurrency to the specified number", async () => {
    debugger;
    const gate = new AsyncGate(2);
    let active = 0;
    let maxActive = 0;

    const task = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((res) => setTimeout(res, 50));
      active--;
    };

    // Fire off 5 tasks
    await Promise.all([
      gate.run(task),
      gate.run(task),
      gate.run(task),
      gate.run(task),
      gate.run(task),
    ]);

    expect(maxActive).toBe(2);
  });

  it("should return the value from the original async function", async () => {
    const gate = new AsyncGate(1);
    const result = await gate.run(async () => "success");
    expect(result).toBe("success");
  });

  it("should continue processing after a task failure", async () => {
    const gate = new AsyncGate(1);

    // Task 1: Fails
    await expect(
      gate.run(async () => {
        throw new Error("Boom");
      }),
    ).rejects.toThrow("Boom");

    // Task 2: Should still run if the "slot" was released correctly
    const result = await gate.run(async () => "still working");
    expect(result).toBe("still working");
  });

  it("should execute tasks in the order they were enqueued (FIFO)", async () => {
    const gate = new AsyncGate(1);
    const results: number[] = [];

    const createTask = (id: number) => async () => {
      await new Promise((res) => setTimeout(res, 10));
      results.push(id);
    };

    await Promise.all([
      gate.run(createTask(1)),
      gate.run(createTask(2)),
      gate.run(createTask(3)),
    ]);

    expect(results).toEqual([1, 2, 3]);
  });

  it("should handle a thundering herd (large burst)", async () => {
    const gate = new AsyncGate(5); // 5 workers
    const totalTasks = 100;
    let active = 0;
    let maxActive = 0;
    let completed = 0;

    const tasks = Array.from({ length: totalTasks }).map(() => {
      return gate.run(async () => {
        active++;
        maxActive = Math.max(maxActive, active);

        // Random slight delay to shuffle the event loop
        await new Promise((res) => setTimeout(res, Math.random() * 20));

        active--;
        completed++;
      });
    });

    await Promise.all(tasks);

    expect(completed).toBe(totalTasks);
    expect(maxActive).toBeLessThanOrEqual(5);
  });
});
