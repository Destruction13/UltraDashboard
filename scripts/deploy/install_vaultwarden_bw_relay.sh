#!/bin/sh
set -eu

RELAY_HOST="${RELAY_HOST:-172.17.0.1}"
RELAY_PORT="${RELAY_PORT:-18087}"
TARGET_HOST="${TARGET_HOST:-127.0.0.1}"
TARGET_PORT="${TARGET_PORT:-8087}"

SOCKET_UNIT="/etc/systemd/system/vaultwarden-bw-relay.socket"
SERVICE_UNIT="/etc/systemd/system/vaultwarden-bw-relay.service"

cat > "$SOCKET_UNIT" <<EOF
[Unit]
Description=Expose Vaultwarden bw serve to Docker bridge only

[Socket]
ListenStream=${RELAY_HOST}:${RELAY_PORT}
Accept=no

[Install]
WantedBy=sockets.target
EOF

cat > "$SERVICE_UNIT" <<EOF
[Unit]
Description=Vaultwarden bw serve Docker bridge relay
Requires=vaultwarden-bw-serve.service
After=vaultwarden-bw-serve.service

[Service]
ExecStart=/lib/systemd/systemd-socket-proxyd ${TARGET_HOST}:${TARGET_PORT}
PrivateTmp=true
NoNewPrivileges=true
EOF

systemctl daemon-reload
systemctl enable --now vaultwarden-bw-relay.socket
systemctl restart vaultwarden-bw-relay.socket

echo "Relay ready on ${RELAY_HOST}:${RELAY_PORT} -> ${TARGET_HOST}:${TARGET_PORT}"
