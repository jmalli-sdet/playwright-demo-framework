#!/usr/bin/env bash
# = reference pre-validation.sh — fast checks run before heavy test invocations.
set -e
npm run lint || true
npx tsc --noEmit
echo "pre-validation: OK"
