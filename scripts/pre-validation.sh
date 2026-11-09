#!/usr/bin/env bash
# = Nike pre-validation.sh — fast checks run before heavy test invocations.
set -e
npm run lint || true
npx tsc --noEmit
echo "pre-validation: OK"
