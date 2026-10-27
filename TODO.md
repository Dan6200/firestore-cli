# TODO

Work queue for the CLI. Checkboxes are the source of truth.

## Rate limiting and execution model

- [x] Audit `--rate-limit` wiring: it is passed to `BulkWriter`
      (`throttling.maxOpsPerSecond`) in `set.mts` and `delete/main.mts`; there is
      no CLI rate limiter.
- [x] Correct `architecture.md`: remove the "rate limiter → AsyncGate" model;
      document `set` (BulkWriter only) vs `delete` (workerPool → BulkWriter), and
      that `AsyncGate` bounds submission, not in-flight writes.
- [x] Fact-check recursive delete: `BulkWriter.delete()` is document-only, but
      `firestore.recursiveDelete(ref, bulkWriter?)` performs recursive traversal
      and accepts a configured `BulkWriter`.
- [ ] Benchmark the custom worker pool vs `firestore.recursiveDelete(ref, bulkWriter)`:
  - Dataset: root collection with N documents and M subcollections; emulator
    first, then a real project.
  - Variants: `workerPool(bulkWriter.delete)` vs `recursiveDelete(ref, bulkWriter)`;
    `--rate-limit` off/on; concurrency 20 vs higher.
  - Metrics: wall time, docs/s, peak RSS, p95 write latency, abort
    responsiveness, progress granularity, error behavior.
  - Run at least 3 times per variant and report median + environment.
- [ ] Decide whether to keep or remove the worker pool for delete. Keep it only
      if progress/timeout/control is measurably worth the extra layer.
- [ ] If kept: make `workerCallback` semantics explicit (await it, or document
      submission-only), and pass the abort signal where it can cancel work.
- [ ] Consider a shared token bucket if one ops/s budget is needed across read
      and write paths; otherwise document BulkWriter as the rate authority.
- [ ] Add rate-limit tests measuring actual ops/s for set (array), set (JSONL),
      and delete.

## Mutation safety

- [ ] `--dry-run` for `set`: parse/validate input, resolve refs, report
      counts/sample, never call BulkWriter.
- [ ] `--dry-run` for `delete`: discover/traverse read-only, report counts/tree,
      never construct a BulkWriter.
- [ ] `--dry-run --json` plan output and exit-code semantics.
- [ ] Reuse the discovery/concurrency path in dry-run without writes.

## Validation

- [ ] Implement `--validate` for `set` (currently a no-op: `set.mts` never reads
      `options.validate`; `validateFileInput` is only used by the commented-out
      `update.mts`).
- [ ] Support Zod or JSON Schema, compiled once; validate bulk arrays and JSONL
      streaming.
- [ ] Per-document errors (line/index/path) and an `--on-error` policy (abort vs
      skip).
- [ ] Decide inferred-schema (sample-based) vs explicit schema file.
- [ ] Measure validation overhead on large imports.

## AI agents

- [ ] MCP server (`firestore-cli mcp`) exposing get/query/set/delete with
      structured JSON.
- [ ] Dry-run by default for mutations; read-only mode; collection allowlists;
      project/database scoping; rate limits.
- [ ] Agent skill/instructions with safe patterns (preview before delete,
      emulator first, no secrets).
- [ ] Security review: no credential leakage, destructive-op confirmation, audit
      logging.

## Docs, tests, CI

- [ ] Tests for dry-run, validation, and rate-limit behavior.
- [ ] CI coverage for the new flags and the recursive-delete benchmark
      (emulator).
- [ ] Update `architecture.md` / `TESTING.md` as the model changes.
