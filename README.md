# Firestore CLI Tool

## Setup Instructions

### **User Guide: How to Obtain OAuth2 Credentials for `firestore-cli`**

`firestore-cli` requires a `credentials.json` file to authenticate and interact with Google Cloud services. Here's how to obtain this file using the **Google Cloud Console** and the **`gcloud` CLI**.

---

## **1. Obtaining Credentials via Google Cloud Console**

### **Step 1: Access the Google Cloud Console**

1. Open your browser and go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.

### **Step 2: Create or Select a Project**

1. In the top navigation bar, click the project dropdown and select an existing project or create a new one.
2. Ensure the Firestore and required APIs are enabled:
   - Navigate to **"APIs & Services" > "Library"**.
   - Search for and enable the **Cloud Firestore API** and other APIs your application requires.

### **Step 3: Create OAuth 2.0 Credentials**

1. Navigate to **"APIs & Services" > "Credentials"** in the left-hand menu.
2. Click **"Create Credentials"** and select **"OAuth client ID"**.
   - If prompted, configure your **OAuth consent screen**:
     - Enter an application name and other required fields.
     - Add `http://localhost` or any custom redirect URIs relevant to your workflow.
   - Save the settings and return to credentials creation.
3. Choose **"Desktop Application"** as the application type.
4. Enter a name for the credentials (e.g., "Firestore CLI Credentials").
5. Click **"Create"**. A dialog will display your client ID and client secret.

### **Step 4: Download the `credentials.json` File**

1. Click **"Download JSON"** to save your credentials as a `credentials.json` file.
2. Move the file to a secure and accessible location.
3. Provide the file path to `firestore-cli` during setup or as a command-line argument.

---

## **3. Providing Credentials to `firestore-cli`**

`firestore-cli` requires the path to the `credentials.json` file. Provide this path in one of the following ways:

### **Option 1: CLI Argument**

Use the `--credentials` or `-c` flag to specify the file:

```bash
firestore-cli --credentials /path/to/credentials.json
```

### **Option 2: Default Location**

Place the file in a default directory (e.g., `~/.config/firestore-cli/credentials.json`, or `%APPDATA%\firestore-cli\credentials.json`) to avoid specifying it each time.

---

## **User Guide: How to Obtain and Use Service Account Keys for `firestore-cli`**

`firestore-cli` supports authentication using **service account keys**, which are particularly useful for server-to-server interactions with Google Cloud services. Follow this guide to generate and configure your service account key.

---

## **1. Obtaining Service Account Keys via Google Cloud Console**

### **Step 1: Access the Google Cloud Console**

1. Open your browser and navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.

### **Step 2: Create or Select a Project**

1. Click the project dropdown in the top navigation bar and select an existing project or create a new one.
2. Enable the **Cloud Firestore API** and other required APIs for your project:
   - Navigate to **"APIs & Services" > "Library"**.
   - Search for **"Cloud Firestore API"** and click **Enable**.

### **Step 3: Create a Service Account**

1. Go to **"IAM & Admin" > "Service Accounts"** in the left-hand menu.
2. Click **"Create Service Account"**.
   - Enter a name for the service account (e.g., "Firestore CLI Service Account").
   - (Optional) Add a description.
   - Click **Create and Continue**.

### **Step 4: Assign a Role**

1. In the "Grant this service account access to project" step:
   - Assign the **Cloud Datastore Owner** role (or a more restrictive role suitable for your needs, such as **Cloud Datastore User**).
   - Click **Continue**.

### **Step 5: Create and Download the Key**

1. Skip adding users in the "Grant users access to this service account" step and click **Done**.
2. Locate the newly created service account in the list and click the three-dot menu (⋮) on the right.
3. Select **"Manage Keys"** > **"Add Key"** > **"Create New Key"**.
4. Choose **JSON** as the key type and click **Create**.
   - A JSON file containing your service account key will download automatically.

### **Step 6: Secure the Key**

- Move the downloaded JSON file to a secure and accessible location.
- Treat this file like a password—do not expose it publicly.
