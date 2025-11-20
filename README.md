# Firestore CLI

A lightweight, powerful command-line interface for interacting with Google Firestore. Streamline document management, perform complex queries, and pipe data between commands directly from your terminal.

**Note**: This project is under active development. Expect breaking changes and new features. Feedback and contributions are welcome!

---

## ✨ What's New in the Upcoming Version

This version introduces major features focused on performance, flexibility, and scriptability.

*   **Piping & `xargs`-like Behavior**: Pipe the output of `firestore-cli query` directly into `delete` to perform actions on a subset of documents.
*   **High-Performance `BulkWriter`**: The `set` and `delete` commands now use Firestore's `BulkWriter` for efficient, high-throughput batch operations.
*   **Rate Limiting**: A new `--rate-limit` option on `set` and `delete` commands gives you fine-grained control over write speeds to prevent overloading the server or emulator.
*   **Firestore Native Streaming**: The `get` command has a new `--stream` flag to stream documents directly from Firestore, providing maximum memory efficiency for very large collections.
*   **Flexible Data Input**: The `set` command is now more flexible, accepting simple JSON objects for documents with auto-generated IDs, or objects with explicit `id` and `data` keys.
*   **Pager Stability**: The output pager (`less`) is now more stable and correctly handles colors and shutdown.

---

## 🔑 Authentication Setup

This tool requires a **Service Account Key** for API access. You can obtain one using the Google Cloud Console, Firebase Console, or the `gcloud` CLI.

_(The detailed authentication setup guide from the previous README version remains here, as it was excellent and requires no changes.)_

### **Method 1: Google Cloud Console (Web UI)**
...
### **Method 2: Firebase Console**
...
### **Method 3: Google Cloud CLI (`gcloud`)**
...

### **Configure the CLI**

Set your environment variable to point to the key:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```
_(Add this to your shell profile (e.g., `.bashrc`, `.zshrc`) for persistence)_

---

## 🚀 Installation

```bash
npm install -g firestore-cli  # Requires Node.js v16+
```

---

## 💻 Usage

```bash
firestore-cli [command] [options]
```

### **Global Options**

These options are available for most commands.

*   `-k, --service-account-key <VALUE>`: Path to the service account key file.
*   `--project-id <VALUE>`: Your Google Cloud project ID.
*   `--database-id <VALUE>`: The Firestore database ID to use (defaults to `(default)`).
*   `--debug`: Enable verbose debug logging.

### **Commands**

#### `query <collection>`
Queries a collection. The output is a newline-separated list of full document paths, perfect for piping to other commands.

*   `-w, --where [VALUE...]`: Filter documents. Example: `--where "status" "==" "active"`
*   `-j, --json`: Output results as a JSON array.

**Example:** Find all users over 30 and pipe their paths to the `delete` command.
```bash
firestore-cli query users --where "age" ">" 30 | firestore-cli delete --rate-limit 100
```

---

#### `delete [path]`
Deletes one or more documents. It can receive a list of full document paths from `stdin` or a file.

*   `-f, --file <VALUE>`: Read a newline-separated list of document paths from a file.
*   `--rate-limit <VALUE>`: Sets the maximum number of deletes per second. Useful for large operations.

**Order of Precedence:** `stdin` > `--file` > `path` argument.

**Examples:**

Delete a single document:
```bash
firestore-cli delete users/some_old_user
```

Delete all users with a `status` of `inactive`:
```bash
firestore-cli query users --where "status" "==" "inactive" | firestore-cli delete
```

Delete documents listed in a file:
```bash
firestore-cli delete --file /path/to/docs_to_delete.txt
```

---

#### `set <path> [data]`
Creates or updates documents. Supports single documents, bulk writes from a file, and flexible data formats.

*   `-f, --file <VALUE>`: Read document data from a file.
*   `-b, --bulk`: Required when using `--file` for bulk operations.
*   `--merge`: Merge new data with existing document data instead of overwriting.
*   `--rate-limit <VALUE>`: Sets the maximum number of writes per second for bulk operations.

**Data Formats for `set`:**

1.  **Simple (Auto-ID):** Provide a simple JSON object. Firestore will generate the document ID.
    ```bash
    firestore-cli set users '{"name": "Alice", "status": "active"}'
    ```
2.  **Explicit ID:** Provide a JSON object with `id` and `data` keys.
    ```bash
    firestore-cli set users '{"id": "alice123", "data": {"name": "Alice", "status": "active"}}'
    ```

**Bulk Set Example:**
Your file (`users.json`) can contain a mix of formats:
```json
[
  {
    "id": "bob_the_builder",
    "data": { "name": "Bob", "role": "constructor" }
  },
  {
    "name": "Charlie",
    "role": "developer" 
  }
]
```

Run the command:
```bash
firestore-cli set users --file users.json --bulk --rate-limit 500
```

---

#### `get [path]`
Fetches and displays one or more documents.

*   `-j, --json`: Output in raw JSON format.
*   `--stream`: Streams documents directly from Firestore. Highly recommended for large collections to keep memory usage low.
*   `--no-pager`: Disables the `less` pager.
*   `--pager-args [ARGS...]`: Pass custom arguments to the pager (Default: `["-R", "-F", "-X"]`).

**Examples:**

Get a single document:
```bash
firestore-cli get users/alice123
```

Get an entire collection and view it in the pager:
```bash
firestore-cli get products
```

Stream a very large collection efficiently:
```bash
firestore-cli get big_collection --stream
```

---

## 🔒 Security Notes

-   **Never commit `service-account-key.json` to version control**! Add it to `.gitignore`.
-   Use **least-privilege roles** (e.g., `roles/datastore.user` instead of `roles/owner`).
-   For production, leverage **secret managers** (e.g., GCP Secret Manager).

---

## 🛠️ Development

```bash
git clone https://github.com/dan6200/firestore-cli.git
cd firestore-cli
pnpm install
pnpm link # Test locally
```
