#!/usr/bin/env bash
set -euo pipefail

OFFLINE_BASELINE_SHA="${OFFLINE_BASELINE_SHA:-fa8dd4620b96ab8f7406d92733eb63b4c7894cd4}"

echo "=== Verifying Offline Freeze against baseline ${OFFLINE_BASELINE_SHA} ==="

# Check for modified production offline files
CHANGED_OFFLINE_FILES=$(git diff --name-only "${OFFLINE_BASELINE_SHA}"...HEAD 2>/dev/null | grep -E '(^frontend/src/offline/|usePaymentSubmission|syncStore|outbox|indexeddb|service-worker|workbox|pending-invoice)' || true)

if [ -n "${CHANGED_OFFLINE_FILES}" ]; then
	echo "❌ ERROR: Production offline files have been modified since baseline:"
	echo "${CHANGED_OFFLINE_FILES}"
	exit 1
else
	echo "✅ PASS: Zero production offline files modified since baseline."
fi
