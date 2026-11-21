#!/usr/bin/env bash
# Runs on the HOST before the container is built (needs only bash).
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
test -f .env || cp .env.example .env
