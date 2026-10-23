# Firestore CLI

A powerful command-line interface for working with Google Firestore.

Query, read, create, update, and delete documents directly from your terminal — with support for complex filters, bulk operations, streaming, pagination, and Unix-style piping.

```bash
npm install -g firestore-cli
```

> **Status:** Actively maintained. Feedback, bug reports, and contributions are welcome.

## ✨ Features

- 🔎 **Powerful queries** — Build complex `AND` / `OR` filters from the command line.
- 📄 **Document management** — Get, create, update, and delete documents without writing scripts.
- 🚀 **Bulk operations** — Process large numbers of documents with controlled concurrency and rate limiting.
- 🌊 **Streaming** — Stream large collections without loading everything into memory.
- 🔗 **Unix-style piping** — Chain Firestore commands together with `|`.
- 📦 **JSON & JSONL output** — Works naturally with tools like `jq`, `grep`, and other command-line utilities.
- 📑 **Pagination** — Navigate large, indexed result sets with multi-field ordering and `--start-after`.
- 🖥️ **Interactive output** — Large results automatically use a terminal pager.
- 🔐 **Google Cloud authentication** — Supports Application Default Credentials and service account keys.
- 🎯 **Multiple Firestore databases** — Select the project and database you want to work with.

---

## 🚀 Installation

Requires **Node.js 16+**.

```bash
npm install -g firestore-cli
```

Verify the installation:

```bash
firestore-cli --help
```

---

## 🔑 Authentication

Firestore CLI uses Google's standard authentication mechanisms.

### Application Default Credentials

For local development, Application Default Credentials are recommended.

If you have the Google Cloud CLI installed:

```bash
gcloud auth application-default login
```

The CLI will automatically use your configured credentials.

### Service Account

For CI/CD or environments where you need to authenticate as a specific service account:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

Or provide the key directly:

```bash
firestore-cli --service-account-key /path/to/service-account.json <command>
```

**Never commit service account keys to version control.**

For production workloads, use the least-privileged IAM role appropriate for your application.

---

# 💻 Usage

```text
firestore-cli [command] [options]
```

## Global Options

These options are available across commands where applicable.

| Option                              | Description                                    |
| ----------------------------------- | ---------------------------------------------- |
| `-k, --service-account-key <VALUE>` | Path to a service account key                  |
| `--project-id <VALUE>`              | Google Cloud project ID                        |
| `--database-id <VALUE>`             | Firestore database ID. Defaults to `(default)` |
| `--debug`                           | Enable verbose debug logging                   |

---

## 🔎 Query Documents

```bash
firestore-cli query <collection>
```

Query documents in a collection.

By default, results are returned as document paths, making them easy to pipe into other commands.

### Simple query

```bash
firestore-cli query users --where "status" "==" "active"
```

### Query with multiple conditions

```bash
firestore-cli query users \
  --where "age" ">" 30 \
  "AND" \
  "status" "==" "active"
```

### JSON output

```bash
firestore-cli query users --where "status" "==" "active" --json
```

### Pipe query results into another command

One of the main goals of Firestore CLI is making Firestore operations composable with standard Unix tools.

For example, find inactive users and delete them:

```bash
firestore-cli query users \
  --where "status" "==" "inactive" \
  | firestore-cli delete --rate-limit 100
```

No intermediate script required.

---

## 🗑️ Delete Documents

```bash
firestore-cli delete [path]
```

Delete one or more documents.

A document path can be provided directly:

```bash
firestore-cli delete users/some_old_user
```

Or supplied through standard input:

```bash
firestore-cli query users --where "status" "==" "inactive" \
  | firestore-cli delete
```

You can also read document paths from a file:

```bash
firestore-cli delete --file docs_to_delete.txt
```

### Rate limiting

For large operations, control the maximum number of deletes per second:

```bash
firestore-cli delete --file docs_to_delete.txt --rate-limit 100
```

### Input precedence

When multiple input sources are provided, they are processed in this order:

```text
stdin > --file > path argument
```

---

## ✏️ Create & Update Documents

```bash
firestore-cli set <path> [data]
```

Create or update Firestore documents.

### Create a document with an auto-generated ID

```bash
firestore-cli set users '{"name":"Alice","status":"active"}'
```

### Set a specific document ID

```bash
firestore-cli set users \
  '{"id":"alice123","data":{"name":"Alice","status":"active"}}'
```

### Merge instead of replacing

Use `--merge` to update specific fields without replacing the entire document:

```bash
firestore-cli set users/alice123 \
  '{"status":"inactive"}' \
  --merge
```

### Bulk operations

Load multiple documents from a JSON file:

```json
[
  {
    "id": "bob_the_builder",
    "data": {
      "name": "Bob",
      "role": "constructor"
    }
  },
  {
    "name": "Charlie",
    "role": "developer"
  }
]
```

Then:

```bash
firestore-cli set users \
  --file users.json \
  --bulk \
  --rate-limit 500
```

Documents can use either an explicit ID or an automatically generated ID.

---

## 📄 Get Documents

```bash
firestore-cli get [path]
```

Fetch a document or collection.

### Get a document

```bash
firestore-cli get users/alice123
```

### Get a collection

```bash
firestore-cli get products
```

Large results are displayed through a terminal pager automatically.

### JSON output

```bash
firestore-cli get users/alice123 --json
```

### Stream large collections

For large collections, use `--stream` to process documents incrementally:

```bash
firestore-cli get big_collection --stream
```

This is particularly useful when piping Firestore data into other command-line tools:

```bash
firestore-cli get users --stream | jq '.email'
```

---

# 🔗 Unix-Style Workflows

Firestore CLI is designed to work with the command line rather than against it.

Commands can consume document paths from `stdin`, allowing you to compose operations with pipes and standard Unix tools.

### Find and delete

```bash
firestore-cli query users \
  --where "status" "==" "inactive" \
  | firestore-cli delete
```

### Stream into `jq`

```bash
firestore-cli get users --stream | jq '.email'
```

### Save query results

```bash
firestore-cli query users \
  --where "role" "==" "admin" \
  > admins.txt
```

### Process the results later

```bash
cat admins.txt | firestore-cli delete
```

This makes it possible to build useful Firestore workflows directly from your existing shell environment.

---

# 📑 Pagination

Firestore CLI supports pagination for large or indexed result sets.

Use `--start-after` to continue from a specific position:

```bash
firestore-cli query users \
  --order-by "createdAt" \
  --start-after "2026-01-01"
```

Multiple fields can be used when ordering results.

---

# 🌊 Streaming

Firestore CLI can stream documents rather than buffering an entire result set.

```bash
firestore-cli get large_collection --stream
```

Streaming is useful when:

- Working with large collections
- Piping data to another process
- Avoiding unnecessary memory usage
- Processing documents incrementally

For example:

```bash
firestore-cli get events --stream | jq '.type'
```

Output can also be consumed as **JSONL (newline-delimited JSON)** when using the appropriate streaming output mode.

---

# 🧭 Full Document Paths

Use `-fp` / `--full-path` to include the document's complete Firestore path in JSON output.

```bash
firestore-cli query users --json --full-path
```

This is particularly useful when passing query results to another Firestore CLI command.

For example:

```bash
firestore-cli query users \
  --where "status" "==" "inactive" \
  --json \
  --full-path
```

---

# ⚡ Performance

Firestore CLI is designed to handle bulk operations without requiring you to write your own processing scripts.

Bulk reads, writes, and deletes use concurrent workers with controlled execution and optional rate limiting.

For large reads, streaming allows data to be processed incrementally rather than requiring the entire result set to remain in memory.

Interactive output is also backpressure-aware, so the CLI can pause data production when the terminal or pager cannot consume more data.

The result is a CLI that can comfortably handle workflows ranging from a single document:

```bash
firestore-cli get users/alice
```

to large-scale operations:

```bash
firestore-cli query users --where "status" "==" "inactive" \
  | firestore-cli delete --rate-limit 100
```

---

# 🔒 Security

Firestore CLI uses your existing Google Cloud credentials and does not require you to provide credentials to individual commands when Application Default Credentials are configured.

### Protect your service account keys

Never commit service account keys to Git:

```gitignore
service-account-key.json
```

Use the least-privileged IAM permissions necessary for your workflow.

For production environments, consider using Google Cloud's Secret Manager or another appropriate secret-management solution instead of distributing service account key files.

---

# 🆕 What's New

### v1.1.10

- **Fix:** `get` and `delete` now fall back to the path argument when stdin is not a TTY and no data is piped in. Previously this broke scripts, CI, and other non-interactive usage.

### v1.1.9

v1.1.9 introduces a new high-concurrency execution engine and several improvements to querying, streaming, and command-line workflows.

- **Faster bulk operations** with concurrent document processing.
- **Streaming support** for large collections.
- **Complex boolean queries** with `AND` / `OR` logic.
- **Improved argument parsing** with JSON and CSV-style values.
- **Pagination improvements** with `--start-after`.
- **Multi-field ordering** for queries.
- **JSONL streaming** for Unix-style pipelines.
- **Improved pager integration** and terminal handling.
- **Full document path output** with `--full-path`.

For the implementation details behind the concurrency and streaming architecture, see the project documentation.

---

# 🛠️ Development

Clone the repository:

```bash
git clone https://github.com/dan6200/firestore-cli.git
cd firestore-cli
```

Install dependencies:

```bash
pnpm install
```

Link the CLI for local development:

```bash
pnpm link
```

Run the CLI locally and test your changes against a development Firestore project.

---

# 🤝 Contributing

Contributions, bug reports, feature requests, and feedback are welcome.

If you find a bug or have an idea for improving the CLI, please open an issue or submit a pull request.

Before contributing, please make sure your changes:

- Have appropriate tests
- Follow the existing project conventions
- Don't expose credentials or sensitive Firestore data
- Include documentation for new user-facing functionality

---

# 📜 License

See the repository for license information.
