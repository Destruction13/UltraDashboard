# UltraDashboard implementation tracker

This file is the live status board for UltraDashboard V1. Every coding session
must update it so another Devin or ClaudeCode run can continue work without
reconstructing context from scratch.

## Status legend

Use the markers below consistently.

- `[ ]` not started
- `[~]` in progress or partially complete
- `[x]` complete and verified
- `[!]` blocked

## Current strategy

The tracker follows the approved V1 spec. The current implementation strategy
is to build UltraDashboard as a separate `Next.js` app with `TypeScript`,
`shadcn/ui`, and Postgres, while reading OmniRoute through a read-only adapter
against its local `storage.sqlite`.

## Phase checklist

Use this checklist as the canonical implementation sequence unless a real
blocker forces a temporary deviation.

### Phase 0: foundation

This phase prepares the repo for feature work.

- [ ] Initialize the `Next.js` App Router project with TypeScript.
- [ ] Add the core dependency stack and project scripts.
- [ ] Add `shadcn/ui`, theme support, and a bilingual shell scaffold.
- [ ] Add `.env.example`, deployment skeleton files, and `Docker Compose`.

### Phase 1: data layer

This phase creates the dashboard-owned persistence model.

- [ ] Add Postgres connectivity.
- [ ] Create migrations for all core UltraDashboard tables.
- [ ] Seed the `GitHub`, `Google`, and `Zoho` service families.
- [ ] Seed the first-wave linked service catalog: `ChatGPT`, `Codex`,
  `GitHub`, and `Devin`.

### Phase 2: shell and navigation

This phase builds the product frame.

- [ ] Build the `Overview`, `OmniRoute`, and `AccountManager` route skeletons.
- [ ] Build the top navigation and layout system.
- [ ] Implement dark and light themes.
- [ ] Add premium visual direction and shared UI primitives.

### Phase 3: AccountManager core

This phase makes account operations usable.

- [ ] Build family tabs for `GitHub`, `Google`, and `Zoho`.
- [ ] Build root account list views.
- [ ] Build root account detail views.
- [ ] Build linked service account CRUD flows.
- [ ] Add search and tag filtering.

### Phase 4: secrets and instructions

This phase creates the main operational workflow.

- [ ] Implement server-side TOTP generation.
- [ ] Build the left credential panel with visible secrets and copy actions.
- [ ] Build the right roadmap renderer.
- [ ] Add editing flows for notes and instruction content.

### Phase 5: OmniRoute integration

This phase connects the app to real OmniRoute data.

- [ ] Implement the read-only SQLite adapter.
- [ ] Implement hourly OmniRoute sync.
- [ ] Persist normalized provider summaries to Postgres.
- [ ] Add sync failure handling that preserves the last good snapshot.

### Phase 6: overview and OmniRoute UI

This phase turns synced data into usable product surfaces.

- [ ] Build the OmniRoute page with provider summary UI.
- [ ] Build tunnel and endpoint information cards.
- [ ] Build Overview summary cards and orientation content.
- [ ] Add manual refresh flows where required by the spec.

### Phase 7: internal API for agents

This phase makes the dashboard automatable.

- [ ] Add services and accounts listing endpoints.
- [ ] Add full account card and TOTP endpoints.
- [ ] Add notes and instructions update endpoints.
- [ ] Add OmniRoute summary, providers, and sync endpoints.

### Phase 8: polish and release readiness

This phase closes the loop before handoff or release.

- [ ] Tighten empty states, loading states, and error states.
- [ ] Run the most relevant verification for each finished slice.
- [ ] Write deployment and VPS runbook docs.
- [ ] Leave a final implementation and handoff summary.

## Open blockers

List real blockers here. Remove or update them when they are resolved.

- None yet.

## Next recommended task

The next recommended task is the first incomplete item in **Phase 0**:
initialize the `Next.js` App Router project with TypeScript.

## Session log

Append one entry per work session. Keep entries concise but specific enough for
the next agent to continue work immediately.

### Session template

Use this template for new entries.

```text
Date:
Owner:
Focus:
Files changed:
Verification:
Status changes in tracker:
Open issues or risks:
Next recommended task:
```

### Session history

#### May 5, 2026

Date: May 5, 2026
Owner: Codex
Focus: Discovery, architecture, spec, and handoff package.
Files changed:
- `docs/ultradashboard-preliminary-architecture.md`
- `docs/ultradashboard-spec.md`
- `docs/ultradashboard-master-prompt.md`
- `docs/ultradashboard-bootstrap-prompt.md`
- `docs/implementation-tracker.md`
Verification:
- Reviewed the generated docs for scope alignment and cross-file consistency.
- Validated OmniRoute integration assumptions against the live OmniRoute VPS.
Status changes in tracker:
- Tracker created.
- No implementation phase items started yet.
Open issues or risks:
- V1 intentionally uses a high-risk secret storage posture because the product
  is perimeter-trusted and private.
- OmniRoute management HTTP APIs are gated, so the default plan is the
  read-only SQLite adapter path.
Next recommended task:
- Start Phase 0 by initializing the `Next.js` App Router project with
  TypeScript.
