# Architecture

Firestore CLI is designed as a Unix-oriented command-line tool with a small set of composable commands backed by a shared Firestore execution layer.

The architecture is intentionally split between **command concerns** (argument parsing, validation, formatting, terminal UX) and **data-processing concerns** (querying, discovery, concurrency, writes, deletes, and streaming).

## Overview

At a high level, a command follows this path:

```text
CLI input
   │
   ▼
Argument parsing
   │
   ▼
Command validation
   │
   ▼
Firestore operation
   │
   ├── Query / discovery
   │
   ├── Work scheduling
   │
   └── Execution
   │
   ▼
Output / stdin pipeline
```

Commands are designed to work independently, but they can also be chained through standard Unix pipes.

For example:

```bash
firestore-cli query users --where "status" "==" "inactive"   | firestore-cli delete --rate-limit 100
```

The first command produces document paths; the second consumes those paths from `stdin`.

---

## Core Design Principles

### 1. Unix composability

Firestore CLI treats the shell as part of the application.

Commands should be useful on their own, but their output should also be consumable by another command or standard Unix utility.

This is why operations such as `query` can produce document paths suitable for:

```bash
firestore-cli delete
```

or data can be streamed into tools such as:

```bash
jq
grep
awk
```

The CLI avoids requiring users to write custom scripts for common data-management workflows.

#### Input resolution: path, `--file`, or stdin

Commands that accept document paths resolve input in a fixed order:

1. `--file <path>`, if provided.
2. The positional `<path>` argument, if provided.
3. Piped stdin, but only when neither of the above is given and stdin is not a TTY.

stdin is deliberately not read when an explicit path or file is supplied. Reading stdin first caused two problems:

- A non-TTY stdin (scripts, CI) shadowed the path argument, so path-based `get`/`delete` calls failed.
- Commands could block forever when the parent process left the stdin pipe open without sending EOF (for example, Node's `child_process.exec`).

Piping without a positional path is unaffected:

```bash
firestore-cli query users --where status == inactive | firestore-cli delete
```

### 2. Bounded concurrency

Firestore operations can involve a large number of independent documents.

Running every operation sequentially is unnecessarily slow, while creating an unbounded number of promises can overwhelm memory, Firestore, or the local process.

The execution layer therefore uses controlled concurrency.

Conceptually:

```text
                 ┌── Worker 1 ──┐
Discovery ───────┼── Worker 2 ──┼────► Firestore
                 ├── Worker 3 ──┤
                 └── Worker N ──┘
                       ▲
                       │
                 concurrency
                   control
```

The number of active operations can be controlled independently from the rate at which work is discovered.

### 3. Separate discovery from execution

Large operations are split into two logical phases:

```text
Discovery
   │
   │  Find documents / generate work
   ▼
Work queue
   │
   ├──► Worker
   ├──► Worker
   ├──► Worker
   └──► Worker
          │
          ▼
      Execution
```

Discovery is responsible for determining **what needs to be processed**.

Workers are responsible for determining **how that work is executed**.

This separation allows the CLI to continue discovering work while existing workers process previously discovered documents.

It also makes concurrency control considerably easier to reason about than a single recursive operation that performs discovery and mutation at the same time.

---

# Concurrency

Bulk operations use a worker-based execution model.

A producer discovers work and places it into a queue. Workers consume items from the queue and perform the corresponding Firestore operation.

```text
                 Producer
                    │
                    ▼
              ┌─────────────┐
              │ BlockingQueue│
              └─────────────┘
                │  │  │  │
                ▼  ▼  ▼  ▼
              W1  W2  W3  W4
                │  │  │  │
                └──┴──┴──┘
                     │
                     ▼
                 Firestore
```

## BlockingQueue

The queue provides a boundary between work discovery and work execution.

Its role is to:

- Buffer pending work
- Allow producers and workers to operate independently
- Prevent uncontrolled accumulation of pending operations
- Coordinate asynchronous consumers

A bounded queue is particularly important for large collections because discovery can otherwise produce work faster than Firestore operations can consume it.

## AsyncGate

`AsyncGate` provides concurrency control around asynchronous operations.

Rather than allowing an arbitrary number of Firestore requests to execute simultaneously, the gate limits the number of active operations.

This provides a predictable upper bound on in-flight work.

Conceptually:

```text
                incoming work
                     │
                     ▼
               ┌───────────┐
               │ AsyncGate │
               └───────────┘
                │ │ │
                ▼ ▼ ▼
               A B C
                │ │ │
                ▼ ▼ ▼
             Firestore
```

Concurrency and rate limiting are separate concerns.

- **Concurrency** controls how many operations are in flight.
- **Rate limiting** controls how frequently operations are started.

Keeping these concerns separate makes it possible to tune throughput without coupling worker count to an operations-per-second limit.

---

# Query Pipeline

The query command has several stages before documents reach the output stream.

```text
CLI arguments
     │
     ▼
Argument parser
     │
     ▼
Where expression
     │
     ▼
Boolean expression parser
     │
     ▼
Firestore query
     │
     ▼
Document results
     │
     ▼
Output formatter
     │
     ▼
stdout
```

## Boolean expressions

The `--where` interface supports compound conditions rather than requiring every query to be represented as a single filter.

For example:

```bash
firestore-cli query users   --where "age" ">" 30   "AND"   "status" "==" "active"
```

The parser converts the command-line representation into a structured expression before it reaches the Firestore query layer.

This keeps command-line syntax separate from Firestore's query API.

## Argument parsing

Values are interpreted with a JSON-first strategy.

This allows structured values such as:

```bash
'{"active":true}'
```

while also supporting convenient CLI-oriented values such as:

```text
male,female
```

The goal is to preserve JSON's expressive power without forcing users into excessive shell quoting for common values.

---

# Streaming

Large reads can be performed as a stream rather than accumulating the complete result set in memory.

```text
Firestore
    │
    ▼
Result stream
    │
    ▼
Formatter
    │
    ▼
stdout
    │
    ├──► terminal
    ├──► pager
    └──► another process
```

This is particularly useful for collections containing a large number of documents.

For example:

```bash
firestore-cli get users --stream | jq '.email'
```

The important property here is that downstream processing can begin while additional documents are still being retrieved.

Streaming also makes the CLI naturally compatible with Unix pipelines.

---

# Pager and Backpressure

Interactive output presents a different problem from normal pipe output.

If a command produces data faster than the terminal can consume it, continuing to fetch data unnecessarily can cause excessive buffering and memory usage.

The pager integration therefore accounts for the consumer's ability to accept more output.

Conceptually:

```text
Firestore
    │
    ▼
Data stream
    │
    ▼
Pager / terminal
    │
    │ consumer cannot accept more
    ▼
   pause
    │
    │ consumer resumes
    ▼
  continue
```

When the user pauses or stops consuming output, the CLI can stop pulling additional data until the output path is ready to continue.

This is especially important for commands operating on large collections.

The pager also has to coordinate with interactive CLI elements such as progress indicators and spinners. Those elements are stopped or handed off before the pager takes control of the terminal so that multiple components do not compete for cursor control.

---

# Pagination

Firestore queries may return data across multiple pages.

The CLI abstracts pagination so commands can operate on the logical result set rather than requiring users to manually manage individual Firestore pages.

For deeper navigation, the CLI exposes `--start-after`.

For ordered queries:

```text
Query
  │
  ▼
Page 1
  │
  ▼
last document / cursor
  │
  ▼
--start-after
  │
  ▼
Page 2
```

Multiple ordering fields can be used where supported by the underlying Firestore query.

Pagination is particularly useful for large collections and workflows where processing needs to resume from a known position.

---

# Bulk Writes and Deletes

`set` and `delete` share input handling (path argument, `--file`, or stdin), but
they do not share the same execution path.

```text
set
  input → validation → BulkWriter (internal queue, retries, throttle) → Firestore

delete
  input → discovery / work queue → workerPool (AsyncGate)
        → BulkWriter (throttle + write concurrency) → Firestore
```

- `set` does not use the worker pool. Both the JSON-array path and the JSONL
  streaming path hand writes to `db.bulkWriter()`, which owns its internal
  queue, retries, and write concurrency.
- `delete` uses the worker pool for recursive discovery, progress, and timeout
  handling. The pool's `AsyncGate` bounds how many callbacks are started; the
  writes themselves are queued in `BulkWriter`.

`BulkWriter.delete()` only deletes a single `DocumentReference`; it does not
traverse subcollections. The Firestore client provides
`firestore.recursiveDelete(ref, bulkWriter?)`, which performs the traversal
internally and can reuse a configured `BulkWriter`. The CLI currently uses its
own discovery/worker-pool path for progress reporting and control over
discovery/submission; whether that extra layer is worth its cost is a benchmark
question (see `TODO.md`).

For example:

```bash
firestore-cli query users --where "status" "==" "inactive"   | firestore-cli delete --rate-limit 100
```

The `query` process does not need to know how the downstream delete operation
works. It only needs to produce a compatible stream of document paths.

---

# Rate Limiting

`--rate-limit` is implemented by `BulkWriter`, not by a CLI rate limiter.

```ts
const bulkWriter = db.bulkWriter({
  throttling: options.rateLimit ? { maxOpsPerSecond: options.rateLimit } : false,
});
```

This is used by the bulk `set` paths (`set.mts`) and by `delete`
(`delete/main.mts`). There is no separate rate limiter in the worker pool.

The real layering is:

```text
set:     input → BulkWriter (throttle + internal write queue) → Firestore

delete:  input → discovery/queue → workerPool (AsyncGate) → BulkWriter
                                  submission concurrency    throttle + write concurrency
```

`AsyncGate` (see `utils/worker-pool/main.mts` and `utils/async-gate.mts`) is a
counting semaphore: it bounds how many worker callbacks have been started. In
`delete`, the callback invokes `bulkWriter.delete(ref)` without awaiting it, so
the gate bounds **submission**, not the number of in-flight writes. `BulkWriter`
owns the write-side concurrency, retries, and backpressure; its internal queue
is what actually drains.

The two controls are independent:

| Control | Owner | Effect |
|---|---|---|
| Submission concurrency | `AsyncGate` / `workerPool` | How many worker callbacks are started at once |
| Operation rate | `BulkWriter` (`maxOpsPerSecond`) | How fast writes are issued, including retries |
| Write concurrency / backpressure | `BulkWriter` | In-flight writes and its internal queue |

An earlier version of this document showed a rate limiter before `AsyncGate`.
That was inaccurate: the CLI does not implement a token bucket today. If a
single ops/s budget is needed across read and write paths, it must be added as
an explicit layer; until then, treat `--rate-limit` as a `BulkWriter` throttle
and `concurrencyLimit` as a submission bound.

---

# Output

The CLI supports several output modes depending on the command and workflow.

The primary goal is to make output useful both for humans and other programs.

### Human-readable output

Designed for interactive terminal use, including pager support for large results.

### JSON

Useful when a complete JSON representation is required:

```bash
firestore-cli get users/alice --json
```

### JSONL

Newline-delimited JSON is useful for streaming and Unix pipelines:

```text
{"id":"alice","name":"Alice"}
{"id":"bob","name":"Bob"}
{"id":"charlie","name":"Charlie"}
```

Each document can be processed independently without requiring the receiving process to parse one large JSON array.

---

# Full Document Paths

Firestore CLI can include the complete Firestore document path in structured output.

For example:

```text
projects/my-project/databases/(default)/documents/users/alice
```

This is useful when output from one command becomes input to another.

A query can therefore act as a discovery stage:

```text
query
  │
  ▼
document paths
  │
  ▼
delete / get / set
```

The `--full-path` option exposes this metadata when needed.

---

# Command Architecture

Commands are intentionally thin.

A command is primarily responsible for:

1. Parsing its arguments
2. Validating command-specific input
3. Selecting the appropriate operation
4. Formatting the result
5. Handling terminal interaction

The lower-level execution layer handles concerns such as:

- Firestore access
- Pagination
- Work scheduling
- Concurrency
- Streaming
- Rate limiting

This separation helps prevent individual commands from implementing their own versions of the same execution logic.

It also makes new commands easier to add without duplicating the concurrency and streaming infrastructure.

---

# Error Handling

Errors should remain actionable at the CLI boundary.

The general flow is:

```text
Underlying error
      │
      ▼
Operation layer
      │
      ▼
Command boundary
      │
      ├──► human-readable error
      └──► appropriate process exit
```

The CLI should avoid exposing unnecessary internal implementation details when reporting errors to users.

Debug logging is available through:

```bash
firestore-cli --debug <command>
```

This provides additional information when diagnosing failures.

---

# Design Tradeoffs

The architecture intentionally favors **controlled throughput and predictable resource usage** over maximum theoretical concurrency.

Some operations could be made faster by simply creating more concurrent requests, but unbounded concurrency introduces problems:

- Increased memory usage
- Excessive pending promises
- Greater pressure on Firestore
- Less predictable behavior
- Harder failure recovery

Similarly, streaming introduces additional coordination between producers and consumers, but avoids the much larger cost of buffering entire collections.

The architecture therefore treats:

**concurrency, rate limiting, streaming, pagination, and backpressure as separate mechanisms.**

This makes the behavior easier to tune and reason about as workloads grow.

---

# Future Direction

The architecture is designed to leave room for additional Firestore workflows without forcing each command to reinvent the underlying execution model.

Potential areas for future development include:

- Additional bulk operations
- More output formats
- Improved query ergonomics
- Additional streaming workflows
- More granular concurrency controls
- Better progress reporting
- Additional Firestore resource types

The goal is to keep the CLI simple at the surface while allowing the underlying execution engine to handle increasingly demanding workloads.
