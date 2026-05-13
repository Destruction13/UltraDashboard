#!/usr/bin/env bash
# install_omniroute_snapshot_timer.sh — install + enable the snapshot timer.
#
# Drops a systemd service + timer that runs omniroute_snapshot.sh every 60s
# on the VPS host. Idempotent — re-running just updates the unit files.

set -euo pipefail

REPO_ROOT="${REPO_ROOT:-/opt/UltraDashboard}"
SCRIPT_PATH="${REPO_ROOT}/scripts/deploy/omniroute_snapshot.sh"

if [[ ! -x "$SCRIPT_PATH" ]]; then
  chmod +x "$SCRIPT_PATH"
fi

cat >/etc/systemd/system/omniroute-snapshot.service <<EOF
[Unit]
Description=Snapshot OmniRoute storage.sqlite for UltraDashboard
After=multi-user.target

[Service]
Type=oneshot
ExecStart=${SCRIPT_PATH}
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
EOF

cat >/etc/systemd/system/omniroute-snapshot.timer <<EOF
[Unit]
Description=Refresh OmniRoute snapshot every minute

[Timer]
OnBootSec=10s
OnUnitActiveSec=60s
AccuracySec=5s
Unit=omniroute-snapshot.service

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now omniroute-snapshot.timer
systemctl status omniroute-snapshot.timer --no-pager
