#!/bin/bash

# This script tests the high-throughput streaming upload.
# 1. It combines all individual data.json files into a single, large payload.jsonl file.
# 2. It uses the firestore-cli's --jsonl flag to stream the upload.

set -e

PROVIDER_ID="test-provider"
PAYLOAD_FILE="tests/e2e/data/payload.jsonl"

echo "--- E2E Bulk: Aggregating data into JSONL payload... ---"

# Use jq to convert all data.json arrays into a single JSONL stream and save it.
# This will find all data.json files, extract each object from the top-level array, 
# and print it on a new line.
jq -c '.[]' tests/e2e/data/**/data.json > "$PAYLOAD_FILE"

# Check if payload was created
if [ ! -s "$PAYLOAD_FILE" ]; then
  echo "Error: Failed to create payload file, or payload is empty." >&2
  exit 1
fi

echo "--- E2E Bulk: Starting streaming upload... ---"

# Use the --jsonl flag to stream the upload from the aggregated file.
firestore-cli set "providers/$PROVIDER_ID" -b --jsonl -f "$PAYLOAD_FILE" --rate-limit 500

echo "--- E2E Bulk: Upload complete! ---"