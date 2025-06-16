### Firestore CLI (Still In Development) - README

A lightweight command-line interface for interacting with Google Firestore, Firebase, and Google Cloud APIs. Streamline document management, queries, and administrative tasks directly from your terminal. **Note** This project is currently in its infancy! Expect things not to work or breaking changes. I am open to suggestions and feedback, thank you.

---

## 🔑 **Authentication Setup**

This tool requires a **Service Account Key** for API access. Here’s how to obtain credentials:

### **Method 1: Google Cloud Console (Web UI)**

1. **Go to** [Google Cloud Console](https://console.cloud.google.com/).
2. **Select your project** → Navigate to _IAM & Admin_ → _Service Accounts_.
3. **Create a Service Account**:
   - Click _+ Create Service Account_.
   - Name it (e.g., `firestore-cli`), assign `Firestore Admin`/`Editor` roles.
4. **Generate Key**:
   - Under _Actions_ (⋮), click _Manage Keys_ → _Add Key_ → _Create New Key_.
   - Choose **JSON** → Download the file (e.g., `service-account.json`).

### **Method 2: Firebase Console**

1. **Go to** [Firebase Console](https://console.firebase.google.com/).
2. **Select your project** → Click ⚙️ (Settings) → _Project settings_.
3. **Navigate to Service Accounts**:
   - Go to _Service accounts_ tab.
4. **Generate Key**:
   - Click _Generate new private key_ → Confirm → Download JSON file.
   - _(Uses default Firebase service account with Editor permissions)_

### **Method 3: Google Cloud CLI (`gcloud`)**

1. **Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)**.
2. **Authenticate and configure**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```
3. **Create Service Account and Key**:

   ```bash
   gcloud iam service-accounts create firestore-cli \
     --display-name="Firestore CLI Service Account"

   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:firestore-cli@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/datastore.user"

   gcloud iam service-accounts keys create service-account.json \
     --iam-account=firestore-cli@YOUR_PROJECT_ID.iam.gserviceaccount.com
   ```

### **Configure the CLI**

Set your environment variable to point to the key:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

_(Add this to your shell profile (e.g., `.bashrc`, `.zshrc`) for persistence)_

---

## 🚀 **Installation**

```bash
npm install -g firestore-cli  # Requires Node.js v16+
```

---

## 💻 **Basic Usage**

```bash
firestore-cli [command] [options]
```

### **Commands**

| Command              | Description                     | Example                                                   |
| -------------------- | ------------------------------- | --------------------------------------------------------- |
| `get <doc-path>`     | Fetch a document                | `firestore-cli get users/alice`                           |
| `set <doc-path>`     | Create/update a document (JSON) | `firestore-cli set products/laptop '{price: 999}'`        |
| `query <collection>` | Run a Firestore query           | `firestore-cli query orders --where "status==='shipped'"` |
| `delete <doc-path>`  | Delete a document               | `firestore-cli delete inventory/old-item`                 |
| `export <path>`      | Export data to JSON             | `firestore-cli export backups/ --all-collections`         |

### **Options**

- `--project <id>`: Specify a Google Cloud project ID.
- `--emulator`: Connect to a local Firestore emulator (default port: `8080`).
- `--debug`: Enable verbose logging.

---

## 🔒 **Security Notes**

- **Never commit `service-account.json` to version control**! Add it to `.gitignore`.
- Use **least-privilege roles** (e.g., `roles/datastore.user` instead of `roles/owner`).
- For production, leverage **secret managers** (e.g., GCP Secret Manager).

---

## 🛠️ **Development**

Contribute or extend functionality:

```bash
git clone https://github.com/your-repo/firestore-cli.git
cd firestore-cli
npm install
npm link  # Test locally
```

---

> **Need Help?**  
> Run `firestore-cli --help` or open an [issue](https://github.com/your-repo/firestore-cli/issues).

---

Built with ❤️ by Daniel Nyong | [MIT License](LICENSE).
