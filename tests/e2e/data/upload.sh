#!/bin/bash

# This script uploads all generated and encrypted demo data to Firestore
# using a single bulk payload file, which is handled by the `firestore-cli`.

set -e # Exit immediately if a command exits with a non-zero status.

# --- Configuration ---
ENCRYPTED_PAYLOAD_FILE="demo-data/firestore-encrypted-payload.jsonl"
PROVIDER_ID="GYRHOME" # Define the target provider ID

ENVIRONMENT="dev"
if [ "$1" == "--prod" ]; then
  ENVIRONMENT="prod"
fi

# --- Arguments Setup for firestore-cli ---
ARGS="--rate-limit 500"
if [ "$ENVIRONMENT" == "prod" ]; then
  KEY_PATH="secret-key/assisted-living-app-key.json"
  if [ ! -f "$KEY_PATH" ]; then
    echo "Error: Production key file not found at $KEY_PATH" >&2
    exit 1
  fi
  ARGS="-k $KEY_PATH $ARGS"
  echo "Using production key: $KEY_PATH"
fi

echo "--- Step 0: Creating Users... ---"
node dev-utils/create-admin-user.ts dev@mail.com Developer ADMIN,CLINICIAN,CAREGIVER,VIEWER

# --- 1. Generate and Encrypt Data ---
echo "--- Step 1: Generating and Encrypting all data to a single payload... ---"

# The encryption script now handles reading all the individual plaintext files
# and outputting a single, structured, encrypted payload file.
export NODE_ENV=development 
node ./dev-utils/encrypt-resident-data.ts
unset NODE_ENV

echo "--- Step 2: Starting Firestore upload... "

if [ ! -f "$ENCRYPTED_PAYLOAD_FILE" ]; then
  echo "Error: Encrypted payload file not found at $ENCRYPTED_PAYLOAD_FILE" >&2
  exit 1
fi

# The new firestore-cli can take the structured JSON file and handle all collection
# and subcollection uploads in one command. # firestore-cli upload --json-file "$ENCRYPTED_PAYLOAD_FILE" $ARGS
# Bulk upload facilities
echo "Uploading facilities..."
firestore-cli set "providers/$PROVIDER_ID/facilities" -b -f demo-data/facilities/data.json $ARGS

# Bulk upload residents and their subcollections (This is much faster)
# The payload file contains relative paths (e.g., residents/some-id, residents/some-id/allergies/allergy-id)
# which are resolved against the base path provided here.
echo "Uploading residents and subcollections..."
firestore-cli set "providers/$PROVIDER_ID" -b -f $ENCRYPTED_PAYLOAD_FILE --jsonl $ARGS

echo "\n--- Upload Complete! ---"
