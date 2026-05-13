# UltraDashboard agent integration guide

This document tells **automated agents and operator scripts** how to push
records into UltraDashboard and pull them back out. UltraDashboard runs
perimeter-trusted on the VPS — anyone who can reach the dashboard already
has full read/write authority over its data.

> **Trust model:** UltraDashboard V1 has **no per-agent tokens** and no RBAC.
> It only listens on `127.0.0.1:3000` on the VPS, and access is gated by an
> SSH tunnel. Anyone with the tunnel has full access.

## Reaching the API

The dashboard binds to `127.0.0.1:3000` inside the VPS. From a client
machine, open an SSH local-forward and hit the API on the localhost side
of that tunnel:

```bash
ssh -N -L 3000:127.0.0.1:3000 root@<VPS_HOST>
# Now from the same machine:
curl http://127.0.0.1:3000/api/internal/services
```

When integrating from another VM or container, set up the same forward
(or run on the VPS directly) and target `http://127.0.0.1:3000`.

All paths below are prefixed with `/api/internal`.

## Object model in one screen

```text
ServiceFamily ──┐
                │ 1..N
                ▼
            RootAccount
                │ 1..N
                ▼
       LinkedServiceAccount ── 0..N ─▶ Tag
                │ 0..1
                ▼
       InstructionDocument
```

- **ServiceFamily** — `github` / `google` / `zoho`. Seeded by `db:seed`.
- **RootAccount** — one identity per family (e.g. a GitHub account email).
- **LinkedServiceAccount** — a credential row for a downstream service
  (ChatGPT, Codex, Devin, Groq, …) tied to a `rootAccount`. Stores
  `loginOrEmail`, `loginUrl`, `passwordPlaintext`, `totpSecretPlaintext`,
  and (optionally) a `vaultItemId` pointing into Vaultwarden.
- **Tag** — operator-defined slug + label that can be attached to a
  linked service.
- **InstructionDocument** — JSON roadmap rendered next to the credentials
  card. Schema: `{ "version": 1, "blocks": [...] }`.

## Credential storage

A linked service exposes credentials in **one of two modes**:

1. **Vaultwarden-backed** (preferred): set `vaultItemId` to the UUID of an
   existing Vaultwarden item. The dashboard resolves the live password
   and TOTP through `bw serve` and never persists secrets to its own DB.
2. **Plaintext fallback**: set `passwordPlaintext` and
   `totpSecretPlaintext` directly. The dashboard treats them as the
   source of truth until a `vaultItemId` is provided.

You may use both: when both are set, Vaultwarden wins for the resolved
display values.

## Endpoint reference

All requests/responses are JSON unless stated otherwise. Successful
responses return `{ "data": ... }`; failures return `{ "error": "...",
"issues": ... }`.

### Read

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/services` | List service families with linked-service counts. |
| GET | `/services/{familySlug}/accounts` | List root accounts for a family with linked-service summaries. |
| GET | `/root-accounts/{rootAccountId}` | Full root account detail (linked services, tags). |
| GET | `/linked-service-accounts/{accountId}` | Linked service detail (resolved password, TOTP source, instruction doc). |
| GET | `/linked-service-accounts/{accountId}/totp` | Live TOTP code (forced fresh read). |
| GET | `/tags` | All tag slugs + labels. |
| GET | `/search?q=&tag=&family=` | Free-text search across root + linked services. |
| GET | `/export?format=json\|csv&family=&includeSecrets=true\|false` | Bulk export (see below). |
| GET | `/omniroute/overview` | KPI snapshot of OmniRoute's SQLite (providers / routes / traffic). |
| GET | `/omniroute/providers?provider=&health=&isActive=&q=&limit=&offset=` | OmniRoute provider connections (read-only mirror). |
| GET | `/omniroute/routes?q=&limit=&offset=` | OmniRoute combos (a.k.a. routes). |
| GET | `/omniroute/live-runs?provider=&status=2xx\|4xx\|5xx&errorsOnly=&q=&limit=&offset=` | Recent rows from OmniRoute's `call_logs`. |

`familySlug` is one of `github`, `google`, `zoho`.

OmniRoute endpoints are **read-only by design**. They expose normalized views of
`storage.sqlite`, not the raw rows; the dashboard never writes back. Failure to
open the SQLite file produces an `HTTP 503` on `/omniroute/overview` (and empty
lists on the other three) so the agent can fall back gracefully.

### Write — root accounts

```http
POST /api/internal/root-accounts
Content-Type: application/json

{
  "familySlug": "github",
  "displayName": "ops-1@example.com",
  "primaryEmail": "ops-1@example.com",
  "username": "ops-1",
  "notes": null
}
```

Response: `201 { "data": { "id": "<uuid>", ... } }`.

### Write — linked services under a root

```http
POST /api/internal/root-accounts/{rootAccountId}/linked-services
Content-Type: application/json

{
  "serviceName": "ChatGPT",
  "serviceSlug": "chatgpt",
  "loginOrEmail": "ops-1@example.com",
  "loginUrl": "https://chat.openai.com/",
  "vaultItemId": null,
  "passwordPlaintext": "super-secret",
  "totpSecretPlaintext": "JBSWY3DPEHPK3PXP",
  "notes": null,
  "tagSlugs": ["primary"]
}
```

Response: `201 { "data": { "id": "<uuid>", ... } }`.

### Update — linked service fields

```http
PATCH /api/internal/linked-service-accounts/{accountId}
{
  "serviceName": "ChatGPT Plus",
  "tagSlugs": ["primary", "billing"]
}
```

Any subset of: `serviceName`, `serviceSlug`, `loginOrEmail`, `loginUrl`,
`vaultItemId`, `passwordPlaintext`, `totpSecretPlaintext`, `notes`,
`status`, `tagSlugs`.

### Update — notes

```http
PATCH /api/internal/linked-service-accounts/{accountId}/notes
{ "notes": "Rotated 2026-05-12." }
```

### Update — instruction document

```http
PATCH /api/internal/linked-service-accounts/{accountId}/instructions
{
  "title": "Standard onboarding",
  "summary": "Daily ops roadmap for this service.",
  "content": { "version": 1, "blocks": [ ... ] }
}
```

`content.blocks` is an array of opaque renderer blocks
(see `lib/db/catalog.ts → InstructionDocumentContent`).

### Archive / delete linked services

```http
POST   /api/internal/linked-service-accounts/{accountId}/archive
DELETE /api/internal/linked-service-accounts/{accountId}
```

`archive` flips `status = archived` and hides the row from list views.
`DELETE` permanently removes it.

## Bulk import — preferred entry point for agents

`POST /api/internal/import` lets your program upload a batch of root
accounts (each with linked services and TOTP secrets) in one call.

```http
POST /api/internal/import
Content-Type: application/json

{
  "rootAccounts": [
    {
      "familySlug": "github",
      "displayName": "ops-1@example.com",
      "primaryEmail": "ops-1@example.com",
      "dedupe": true,
      "linkedServices": [
        {
          "serviceName": "Devin",
          "serviceSlug": "devin",
          "loginOrEmail": "ops-1@example.com",
          "passwordPlaintext": "rotate-me",
          "totpSecretPlaintext": "JBSWY3DPEHPK3PXP",
          "tagSlugs": ["primary"]
        }
      ]
    }
  ]
}
```

Behavior:

- `dedupe: true` (default) reuses an existing root account in the same
  family if `primaryEmail`, `username`, or `displayName` match
  case-insensitively. Otherwise a new root is created.
- Each linked service inside the same root is always inserted as a new
  row — use `PATCH` to update existing ones.
- The response is a per-root result envelope:

```json
{
  "created": 1,
  "reused": 0,
  "failed": 0,
  "results": [
    {
      "rootAccountId": "...",
      "familySlug": "github",
      "reused": false,
      "linkedServices": [
        { "id": "...", "serviceSlug": "devin", "serviceName": "Devin" }
      ]
    }
  ],
  "errors": []
}
```

Status codes:

- `201 Created` — all rows succeeded.
- `207 Multi-Status` — some rows succeeded, some failed (see `errors[]`).
- `400 Bad Request` — none of the rows succeeded.

## Bulk export

`GET /api/internal/export` returns the full account graph. Query
parameters:

| Parameter | Values | Meaning |
|-----------|--------|---------|
| `format` | `json` (default) or `csv` | Response shape. |
| `family` | `github` / `google` / `zoho` | Optional filter. |
| `includeSecrets` | `true` / `false` (default) | Include resolved password + TOTP. Off by default for safety. |

JSON payload shape:

```json
{
  "exportedAt": "2026-05-13T19:00:00.000Z",
  "format": "ultradashboard.v1",
  "includeSecrets": false,
  "families": [
    {
      "slug": "github",
      "name": "GitHub",
      "rootAccounts": [
        {
          "id": "...",
          "displayName": "...",
          "linkedServices": [
            {
              "id": "...",
              "serviceName": "...",
              "serviceSlug": "...",
              "vaultItemId": "...",
              "tags": [{"slug": "primary", "name": "Primary"}],
              "resolved": {
                "password": null,
                "currentTotp": null,
                "source": "vaultwarden",
                "bridgeIssue": null
              }
            }
          ]
        }
      ]
    }
  ]
}
```

CSV mode emits one row per linked service, suitable for spreadsheets and
quick diffing. Header columns include `password` and `current_totp` only
when `includeSecrets=true`.

## End-to-end example

The smallest integration: an agent rotates a TOTP secret and pushes the
new credential record:

```bash
ssh -N -L 3000:127.0.0.1:3000 root@<VPS_HOST> &
sleep 2

curl -s -X POST http://127.0.0.1:3000/api/internal/import \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON'
{
  "rootAccounts": [{
    "familySlug": "github",
    "displayName": "fresh-bot-99",
    "primaryEmail": "fresh-bot-99@mail.example",
    "linkedServices": [{
      "serviceName": "GitHub",
      "serviceSlug": "github",
      "loginOrEmail": "fresh-bot-99",
      "loginUrl": "https://github.com/login",
      "passwordPlaintext": "<password>",
      "totpSecretPlaintext": "<base32-secret>"
    }]
  }]
}
JSON

# Later, pull everything back out:
curl -s "http://127.0.0.1:3000/api/internal/export?includeSecrets=true" | jq .
```

That's the entire surface area an agent needs. The UI on
`http://127.0.0.1:3000` always reflects the same data, so a human
operator can edit or audit anything the agent has pushed.
