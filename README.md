# Firestore CLI

A lightweight, powerful command-line interface for interacting with Google Firestore. Streamline document management, perform complex queries, and pipe data between commands directly from your terminal.

**Note**: This project is under active development. Expect breaking changes and new features. Feedback and contributions are welcome!

---

## ✨ What's New in Version 1.1.0

This version introduces major features focused on performance, flexibility, and scriptability for large-scale data management.

*   **High-Performance Bulk Operations**: The `set` and `delete` commands now use Firestore's `BulkWriter` for efficient, high-throughput batch operations, replacing the previous batch implementation.
*   **Rate Limiting**: A new `--rate-limit` option on `set` and `delete` commands gives you fine-grained control over write speeds to prevent overloading the server or emulator.
*   **Firestore Native Streaming**: The `get` command has a new `--stream` flag to stream documents directly from Firestore, providing maximum memory efficiency for very large collections.
*   **Flexible Data Input for `set`**: The `set` command is now more powerful and flexible, accepting multiple data shapes:
    *   Simple JSON objects for documents with auto-generated IDs.
    *   Objects with explicit `id` and `data` keys.
    *   "Smart Path" logic that can use an `id` or `path` field from within the data object itself.
*   **Streaming Bulk Writes**: The `set` command supports a `--jsonl` flag to stream bulk writes from a newline-delimited JSON file, drastically reducing memory usage for massive import jobs.
*   **Pager Stability**: The output pager (`less`) is now more stable and correctly handles colors and shutdown, preventing crashes and improving the user experience.

---

## 🔑 Authentication Setup

This tool supports two methods for authentication. Application Default Credentials (ADC) is the recommended approach for most development scenarios.

### **Method 1: Application Default Credentials (Recommended)**

This is the easiest way to authenticate, especially for local development. It uses the credentials you've configured with the `gcloud` CLI.

1.  **Install the Google Cloud CLI**: If you haven't already, [install the `gcloud` CLI](https://cloud.google.com/sdk/docs/install).

2.  **Login and Set Your Default Credentials**: Run the following command and follow the web-based login flow:
    ```bash
    gcloud auth application-default login
    ```

Once this is done, `firestore-cli` will automatically find and use these credentials. No further configuration is needed.

### **Method 2: Service Account Key**

This method uses a JSON key file for authentication. It's useful for CI/CD environments or if you need to authenticate as a specific service account.

**Configure the CLI**

Set your environment variable to point to the key:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```
_(Add this to your shell profile (e.g., `.bashrc`, `.zshrc`) for persistence)_

You can also provide the path to the key file directly to any command using the `-k, --service-account-key` option.

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
