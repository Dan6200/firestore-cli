#!/usr/bin/env bash
# Round-trip smoke test for an installed firestore-cli.
#
# Uses the globally installed `firestore-cli` by default; override with CLI=...
# Target a real project with ADC / GOOGLE_APPLICATION_CREDENTIALS, or the
# emulator with FIRESTORE_EMULATOR_HOST.
set -euo pipefail

CLI="${CLI:-firestore-cli}"
COLLECTION="${SMOKE_COLLECTION:-firestore_cli_smoke}"
DOC_ID="run_$(date +%s)_$$"
DOC_PATH="${COLLECTION}/${DOC_ID}"
VALUE="hello-$(date +%s)"

cleanup() {
  "$CLI" delete "$DOC_PATH" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "CLI: $(command -v "$CLI" || printf '%s' "$CLI")"
"$CLI" --version

"$CLI" set "$COLLECTION" "{\"id\":\"$DOC_ID\",\"hello\":\"$VALUE\"}" --no-merge

OUT="$("$CLI" get "$DOC_PATH" --json)"
node -e '
  const doc = JSON.parse(process.argv[1]);
  const expected = process.argv[2];
  if (!doc || !doc.data || doc.data.hello !== expected) {
    console.error("Unexpected document:", JSON.stringify(doc));
    process.exit(1);
  }
  console.log("Smoke test passed:", JSON.stringify(doc));
' "$OUT" "$VALUE"
