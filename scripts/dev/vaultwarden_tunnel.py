import argparse
import os
import select
import socketserver
import threading
import time

import paramiko


DEFAULT_FORWARDS = [
    (1455, "127.0.0.1", 1455),
    (32028, "127.0.0.1", 20128),
    (32087, "127.0.0.1", 8087),
]


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Forward local ports to the UltraDashboard VPS via SSH.",
    )
    parser.add_argument("--host", default=os.environ.get("ULTRADASH_VPS_HOST"))
    parser.add_argument("--user", default=os.environ.get("ULTRADASH_VPS_USER"))
    parser.add_argument("--password", default=os.environ.get("ULTRADASH_VPS_PASSWORD"))
    return parser


def require(value: str | None, label: str) -> str:
    if value:
        return value
    raise SystemExit(f"Missing {label}. Pass --{label} or set ULTRADASH_VPS_{label.upper()}.")


def make_handler(transport: paramiko.Transport, remote_host: str, remote_port: int):
    class Handler(socketserver.BaseRequestHandler):
        def handle(self) -> None:
            try:
                channel = transport.open_channel(
                    "direct-tcpip",
                    (remote_host, remote_port),
                    self.request.getpeername(),
                )
            except Exception:
                self.request.close()
                return

            sockets = [self.request, channel]

            try:
                while True:
                    readable, _, _ = select.select(sockets, [], [], 5)
                    if self.request in readable:
                        data = self.request.recv(65536)
                        if not data:
                            break
                        channel.sendall(data)
                    if channel in readable:
                        data = channel.recv(65536)
                        if not data:
                            break
                        self.request.sendall(data)
            finally:
                channel.close()
                self.request.close()

    return Handler


class ReusableServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    host = require(args.host, "host")
    user = require(args.user, "user")
    password = require(args.password, "password")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, username=user, password=password, timeout=20)

    servers: list[ReusableServer] = []
    print(f"Connected to {user}@{host}")

    try:
        transport = ssh.get_transport()
        if transport is None:
            raise RuntimeError("SSH transport is unavailable.")
        transport.set_keepalive(15)

        for local_port, remote_host, remote_port in DEFAULT_FORWARDS:
            server = ReusableServer(
                ("127.0.0.1", local_port),
                make_handler(transport, remote_host, remote_port),
            )
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            servers.append(server)
            print(f"127.0.0.1:{local_port} -> {remote_host}:{remote_port}")

        print("Tunnel is active. Press Ctrl+C to stop.")
        while transport.is_active():
          time.sleep(5)

        raise RuntimeError("SSH transport became inactive. Restart the tunnel.")
    except KeyboardInterrupt:
        print("Stopping tunnel...")
    finally:
        for server in servers:
            server.shutdown()
            server.server_close()
        ssh.close()


if __name__ == "__main__":
    main()
