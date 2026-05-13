# UltraDashboard VPS runbook

Operational handbook for the production deploy on `72.56.84.248`.

## Topology

```
SSH (root, port 22)
  └─ Container: ultradashboard-web (Next.js, 127.0.0.1:3000)
       ├─ Postgres 16 (container ultradashboard-db, internal only)
       ├─ Vaultwarden bridge: host.docker.internal:18087 → bw serve
       └─ OmniRoute mirror: bind-mount of /root/.omniroute-snapshot/storage.sqlite (read-only)

Host (Ubuntu 24.04)
  ├─ Docker + docker compose (compose.yml in /opt/UltraDashboard)
  ├─ OmniRoute itself: separate process, owns /root/.omniroute/storage.sqlite (WAL mode)
  ├─ omniroute-snapshot.timer (systemd, every 60 s)
  │   └─ scripts/deploy/omniroute_snapshot.sh
  │       └─ sqlite3 .../storage.sqlite "VACUUM INTO '/root/.omniroute-snapshot/storage.sqlite.tmp.$$'"
  │       └─ mv -f *.tmp* → /root/.omniroute-snapshot/storage.sqlite
  └─ Vaultwarden + bw serve (separate service)
```

Nothing is exposed to the public internet. Port 3000 binds to `127.0.0.1` only;
the only way in is the SSH tunnel.

## Reaching the dashboard

```bash
# Forward the dashboard locally
ssh -L 3000:127.0.0.1:3000 root@72.56.84.248
# Then in a browser
open http://127.0.0.1:3000
```

When the SSH session ends the local port closes — that's the entire access
policy.

## Standard deploys

The repo is cloned at `/opt/UltraDashboard`. To roll out a new commit on `main`:

```bash
cd /opt/UltraDashboard
git fetch --all --prune
git checkout main
git pull --ff-only
docker compose pull            # pulls Postgres, etc.
docker compose build           # rebuilds the web image (better-sqlite3 native rebuild)
docker compose up -d --remove-orphans
docker compose ps              # confirm both containers are healthy
```

Migrations run automatically inside the web container at boot (`npm run db:push`
via the entrypoint).

## OmniRoute snapshot

Why we use a snapshot at all: OmniRoute keeps `storage.sqlite` in WAL journal
mode, which requires SQLite to create `-shm` / `-wal` sidecars in the database
directory. A read-only bind-mount of the file alone makes the dashboard fail
with "attempt to write a readonly database". The snapshot is journal-free
(plain `DELETE` mode) so the container can open it cleanly.

### Files

- `/root/.omniroute/storage.sqlite` — OmniRoute's live DB (don't touch).
- `/root/.omniroute-snapshot/storage.sqlite` — what the dashboard reads.
- `/opt/UltraDashboard/scripts/deploy/omniroute_snapshot.sh` — the snapshotter.
- `/etc/systemd/system/omniroute-snapshot.service` + `.timer` — schedule.

### Verify the timer

```bash
systemctl status omniroute-snapshot.timer
systemctl list-timers | grep omniroute
stat -c '%y %n' /root/.omniroute-snapshot/storage.sqlite
```

The `mtime` should advance every minute. If it doesn't:

```bash
journalctl -u omniroute-snapshot.service -n 50 --no-pager
# Common causes:
#   - source DB renamed / moved
#   - disk full
#   - sqlite3 binary missing on host (apt install sqlite3)
```

Force one snapshot manually:

```bash
/opt/UltraDashboard/scripts/deploy/omniroute_snapshot.sh
```

Reinstall the timer (idempotent):

```bash
/opt/UltraDashboard/scripts/deploy/install_omniroute_snapshot_timer.sh
```

### Tuning cadence

Edit `omniroute-snapshot.timer`'s `OnUnitActiveSec=` and `systemctl daemon-reload`.
Don't go below ~5 s — `VACUUM INTO` of a 70 MB database is cheap but not free.

## Postgres (UltraDashboard's own DB)

```bash
# Shell into the DB container
docker compose exec -T ultradashboard-db psql -U ultradash -d ultradash
```

Sanity queries:

```sql
SELECT count(*) FROM service_families;
SELECT count(*) FROM root_accounts WHERE archived_at IS NULL;
SELECT count(*) FROM linked_service_accounts WHERE archived_at IS NULL;
```

Backups (point-in-time snapshot):

```bash
docker compose exec -T ultradashboard-db \
  pg_dump -U ultradash -d ultradash -F c -f /tmp/ultradash-$(date +%F).dump
docker compose cp ultradashboard-db:/tmp/ultradash-$(date +%F).dump /root/backups/
```

Restore:

```bash
docker compose cp /root/backups/ultradash-YYYY-MM-DD.dump ultradashboard-db:/tmp/restore.dump
docker compose exec -T ultradashboard-db \
  pg_restore -U ultradash -d ultradash --clean --if-exists /tmp/restore.dump
```

## Vaultwarden bridge

The dashboard talks to `bw serve` over the docker bridge IP
`host.docker.internal:18087` (proxied by the host script in
`scripts/deploy/install_vaultwarden_bw_relay.sh`).

If TOTP / password resolution silently returns `source: "plaintext"` even
though a `vaultItemId` is set, check the bridge:

```bash
curl -s http://127.0.0.1:18087/status
# expected: { "data": { "status": "unlocked" } }
```

If `locked`, log into the bot account and unlock via the bw CLI on the host.

## Rollback

If a deploy breaks the dashboard, revert to the previous commit and rebuild:

```bash
cd /opt/UltraDashboard
git log --oneline -5
git checkout <previous-sha>
docker compose build
docker compose up -d
```

The OmniRoute snapshot and Postgres data are independent of the deploy, so a
rollback never costs data.

## Health checklist

```bash
docker compose ps
systemctl status omniroute-snapshot.timer
curl -s http://127.0.0.1:3000/api/internal/omniroute/overview | jq '.available, .providers.active'
curl -s http://127.0.0.1:18087/status | jq '.data.status'
```

All four should return healthy values. Anything else → check the corresponding
section above.
