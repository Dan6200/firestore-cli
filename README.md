# Firestore CLI Tool

## Setup Instructions

### 1. Get Your OAuth2 Credentials

- Visit [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project or select an existing project.
- Enable the **Firebase API** or whichever Google APIs you need.
- Under **APIs & Services** → **Credentials**, create a new **OAuth 2.0 client ID** (with application type "Desktop App").
- Run the `firestore-cli init` command.
- Download the `JSON` file and store it locally in: `~/.config/firestore-cli/credentials/` (for \*nix systems) and `%APP_DATA%\firestore-cli\credentials` for windows.

### 2. Run the CLI Tool

- The first time you use the CLI, you'll need to authenticate with your Google Cloud account.
- The tool will guide you to authenticate and obtain your token.

## Example Command

```bash
firestore-cli init

```

### 3. Alternatively...

- If you wish to only use the Firestore tool to access an existing Firebase Firestore database and not create any projects or Firestore databases, then you can use a Service Account key instead.
  - Go to the [Firebase Console](https://console.firebase.google.com/).
  - Select your project.
  - Go to settings, then Project settings.
  - Go to the Service Accounts tab.
  - Run the `firestore-cli init` command.
  - Click "Generate new private key" and store that file in: `~/.config/firestore-cli/service-account/`
  - You should provide the Service Account key as a command line argument using the `--service-account` flag and the file path.
