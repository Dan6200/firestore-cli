# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.10] - 2026-10-24

### Fixed

- `get` and `delete` no longer ignore the `<path>` argument when stdin is not a TTY (scripts, CI, `child_process.exec`). They now prefer an explicit `--file` or `<path>` and only read stdin when neither is supplied.
- Fixed a hang when stdin is an open pipe that never reaches EOF.
- Removed the misleading `Cannot read properties of null (reading 'stdin')` error when the pager is disabled.

### Changed

- Documented input resolution precedence: `--file` → `<path>` → stdin.
- Restored the `query | delete` piping integration test; both integrated suites now pass.
- Replaced `.npmignore` with a `files` allowlist in `package.json`; tests and fixtures are excluded from the published package.
- Fixed the `main` entry point to point at `built/main.mjs`.

## [1.1.9] - 2026-10-16

### Added

- Warning and custom tag support in logging.
- Support for document paths containing hyphens.
- Optional `delete` path argument (`delete [path]`) to support stdin piping.

### Changed

- Rewrote `delete`: polymorphic reference getter (collection vs document), recursive delete fixes, and clearer permission-error handling.
- Improved BulkWriter operation error handling.
- Improved logging output.
- Pager cleanup and error handling.

### Fixed

- Recursive delete issues.
- Error message formatting.
- Test mocks; all unit tests pass.
- npm packaging: excluded the 481 MB integrated test fixture.

## [1.1.8] - 2026-04-24

### Added

- High-concurrency execution engine: `BlockingQueue`, `AsyncGate`, and a dual-phase worker pool (discovery vs execution).
- Stream-to-pager with drain handling; the CLI pauses fetching while you scroll.
- Recursive boolean query parser (`AND` / `OR`).
- Smart argument parsing (JSON first, then CSV-style lists).
- Implicit `AND` injection for long `--where` chains.
- Cursor-based queries and `--start-after` pagination.
- Multi-field ordering.
- JSONL streaming (`--stream`).
- `--full-path` output.

### Changed

- Replaced sequential operations with the concurrent pipeline.
- TTY handoff between spinners and the pager.

### Fixed

- Pager deadlock.
- Stream document printing.
- Stdin handling.

## Earlier releases

Versions before 1.1.8 predate this changelog. Release dates from npm:

| Version | Date |
| --- | --- |
| 1.1.6 | 2025-11-20 |
| 1.1.5 | 2025-11-20 |
| 1.1.4 | 2025-11-01 |
| 1.1.3 | 2025-11-01 |
| 1.1.2 | 2025-10-31 |
| 1.1.1 | 2025-10-31 |
| 1.1.0 | 2025-10-31 |
| 1.0.8 | 2025-06-16 |
| 1.0.7 | 2025-06-14 |
| 1.0.5 | 2025-01-16 |
| 1.0.4 | 2025-01-15 |
| 1.0.3 | 2025-01-15 |
| 1.0.2 | 2025-01-15 |
| 1.0.1 | 2025-01-15 |

Versions 1.0.6 and 1.1.7 were never published.

[Unreleased]: https://github.com/Dan6200/firestore-cli/compare/v1.1.10...HEAD
[1.1.10]: https://github.com/Dan6200/firestore-cli/compare/v1.1.9...v1.1.10
[1.1.9]: https://github.com/Dan6200/firestore-cli/compare/v1.1.8...v1.1.9
[1.1.8]: https://github.com/Dan6200/firestore-cli/releases/tag/v1.1.8
