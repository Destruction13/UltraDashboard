#!/usr/bin/env bash
# omniroute_snapshot.sh — VACUUM INTO snapshot of OmniRoute's storage.sqlite.
#
# UltraDashboard reads OmniRoute's SQLite as a read-only mirror. The live file
# uses WAL journaling, which means we cannot just bind-mount it into a
# container without giving SQLite write access to the directory. Instead we
# take a consistent point-in-time snapshot to a dedicated path and mount that
# snapshot read-only into the container.
#
# Usage:
#   ./omniroute_snapshot.sh                   # one-shot snapshot
#   ./omniroute_snapshot.sh --paranoid        # also fsync the snapshot file
#
# Run on the VPS host (NOT inside the container). Designed to be invoked from
# a systemd timer or a cron entry every 30–60 seconds.

set -euo pipefail

SOURCE="${OMNIROUTE_SQLITE_SOURCE:-/root/.omniroute/storage.sqlite}"
TARGET="${OMNIROUTE_SQLITE_SNAPSHOT:-/root/.omniroute-snapshot/storage.sqlite}"

if [[ ! -r "$SOURCE" ]]; then
  echo "omniroute-snapshot: source not readable: $SOURCE" >&2
  exit 1
fi

mkdir -p "$(dirname "$TARGET")"
TMP="${TARGET}.tmp.$$"
trap 'rm -f "$TMP"' EXIT

# VACUUM INTO is atomic on a SQLite level — concurrent writers see a
# consistent snapshot. Resulting file has journal_mode = delete (no WAL),
# which is exactly what better-sqlite3 needs to open it without a writable
# directory.
sqlite3 "$SOURCE" "VACUUM INTO '$TMP'"

# Atomic rename so readers either see the previous snapshot or the new one.
mv -f "$TMP" "$TARGET"
chmod 0444 "$TARGET"

if [[ "${1:-}" == "--paranoid" ]]; then
  sync -- "$TARGET"
fi

echo "omniroute-snapshot: refreshed $(stat -c '%s' "$TARGET") bytes -> $TARGET"
