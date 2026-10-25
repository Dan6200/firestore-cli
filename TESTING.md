# Testing Strategy

How `firestore-cli` is tested, what each layer is expected to catch, and where
the tests run. Tests are intentionally not published to npm: the package
`files` allowlist only ships `built/main.mjs`, `README.md`, and `CHANGELOG.md`.

## Principles

- **Deterministic by default.** The automatic gate uses the Firestore emulator,
  not a real project, and needs no GCP credentials.
- **Test the published artifact.** CI installs the exact published version and
  the parity job compares it with the local build, instead of trusting a local
  `pnpm link`.
- **Real Firestore is still CI.** It runs as an on-demand GitHub Actions job
  with a protected environment and Workload Identity Federation — not as a
  manual, out-of-band procedure.
- **Isolation over ordering.** Integration tests reseed their data and use
  unique documents, so results do not depend on execution order.

## Layers

| Layer | Location | Runner | Backing store | Command |
| --- | --- | --- | --- | --- |
| Unit | `tests/unit` | Jest | none | `pnpm test:unit` |
| Integration | `tests/integrated` | Jest | Firestore emulator | `pnpm test:integrated` |
| E2E smoke | `tests/e2e/smoke.sh` | Bash + Node | emulator or real project | `pnpm test:e2e` |

### Unit

Fast tests for pure logic that does not touch Firestore: blocking queue and
async gate behaviour, path validation, where-clause parsing, worker-pool
behaviour, and printing. No emulator or network access.

### Integration

Runs against the Firestore emulator and covers the command surface end to end:

- read a collection and a single document;
- create one document (in-memory data);
- bulk-create a collection from an existing fixture;
- update with `--merge` (asserting untouched fields survive);
- delete a document, a collection, and recursively delete subcollections;
- pipe `query` paths into `delete`;
- stream a large JSONL file into `set --jsonl` over stdin (throughput).

`pnpm test:integrated` runs
`firebase emulators:exec --only firestore --project test "pnpm integrated_tests"`.
That starts/stops the emulator, exports `GCLOUD_PROJECT` and
`FIRESTORE_EMULATOR_HOST`, and runs Jest once (`--runInBand`).

Fixtures live in `tests/data`. The two fixtures used by CI
(`residents/data.json`, `observations/data.json`) are normal git blobs; the
481 MB fixture stays in LFS and is not needed by CI. Tests reseed
`providers/test-provider/residents` before each case, and large collection
reads use a 64 MB `maxBuffer`.

### E2E smoke

`tests/e2e/smoke.sh` verifies an **installed** CLI, not the repo build:

1. generate a unique document id;
2. `set <collection> '{"id":…,"hello":…}' --no-merge`;
3. `get <doc> --json` and assert `data.hello`;
4. `delete` the document via an `EXIT` trap;
5. exit non-zero on any mismatch.

It uses `firestore-cli` from `PATH` by default; set `CLI=./built/main.mjs` to
run the local build. Point it at the emulator with `FIRESTORE_EMULATOR_HOST`,
or at a real project with ADC and `GOOGLE_CLOUD_PROJECT`.

The previous Jest e2e suite was removed: it required real credentials and could
not be verified locally, so it only provided false confidence. The smoke script
is small enough to run anywhere and returns a real exit code.

## Where tests run

### Automatic CI gate — `.github/workflows/ci.yml`

- Triggered by push to `main` and pull requests.
- Node 22 + Java 21; `pnpm install --frozen-lockfile`, `pnpm build`,
  `pnpm test:unit`, `pnpm test:integrated`.
- Caches `~/.cache/firebase/emulators` so the emulator jar is not re-downloaded.
- `package-parity` job on `main`: packs the published version
  (`npm pack firestore-cli@<version>`) and compares the `built/main.mjs` sha256
  with the local build. If the version is not published yet, the step prints a
  notice and skips instead of failing.

### On-demand CI job — `.github/workflows/e2e-real.yml`

- `workflow_dispatch` only; it is **not** part of the automatic gate.
- Requires the `gcp-e2e` environment (required reviewers) and real GCP access.
- Authenticates with Workload Identity Federation via
  `google-github-actions/auth@v2`; no service-account keys.
- Environment variables: `GCP_WORKLOAD_IDENTITY_PROVIDER`,
  `GCP_SERVICE_ACCOUNT`, `GCP_TEST_PROJECT`.
- Installs the exact published version and runs `tests/e2e/smoke.sh` against the
  dedicated test project.

### Local

`pnpm test:unit`, `pnpm test:integrated`, and `pnpm test:e2e` are local
commands, not CI. They use the same scripts as CI so local failures reproduce
in the workflows.

## Conventions

- Reseed before each integration case; never depend on a previous case.
- Treat CLI status/spinner output as **stderr**; JSON and document paths are
  **stdout**.
- A deleted/missing single document is printed as `{ "id": "…" }` (no `data`);
  a missing collection is `[]`.
- Use `maxBuffer` and explicit timeouts for large collections and uploads.
- Clean up created documents (`trap`/`finally`) so reruns stay deterministic.
- Keep tests and fixtures out of the published package.

## Non-goals and tradeoffs

- Real-GCP coverage is intentionally on-demand and protected; it is not a
  prerequisite for merging.
- There is no Docker test path: GitHub Actions already provides clean,
  ephemeral runners.
- The parity job compares the bundled CLI (`built/main.mjs`), not every file in
  the tarball.
- Emulator tests do not exercise IAM, network paths, or Firestore security
  rules; the real-GCP smoke test covers authentication and project wiring.
