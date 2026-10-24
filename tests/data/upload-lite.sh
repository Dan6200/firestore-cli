#!/bin/bash

# This script uploads a small subset of data for quick Integrated tests.

set -e

PROVIDER_ID="test-provider"

echo "--- Uploading test data... ---"

# Upload a few key collections
./built/main.mjs set "providers/$PROVIDER_ID/residents" -b -f "tests/data/residents/data.json"
# ./built/main.mjs set "providers/$PROVIDER_ID/allergies" -b -f "tests/data/allergies/data.json"
#
# # Testing nested paths
# ./built/main.mjs set "providers/$PROVIDER_ID/residents/nested/residents" -b -f "tests/data/residents/data.json"
# ./built/main.mjs set "providers/$PROVIDER_ID/allergies/nested/allergies" -b -f "tests/data/allergies/data.json"

echo "--- Upload complete! ---"
