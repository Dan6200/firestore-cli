#!/bin/bash

# This script uploads a small subset of data for quick E2E tests.

set -e

PROVIDER_ID="test-provider"

echo "--- E2E Lite: Uploading test data... ---"

# Upload a few key collections
firestore-cli set "providers/$PROVIDER_ID/residents" -b -f "tests/e2e/data/residents/data.json"
firestore-cli set "providers/$PROVIDER_ID/allergies" -b -f "tests/e2e/data/allergies/data.json"

echo "--- E2E Lite: Upload complete! ---"
