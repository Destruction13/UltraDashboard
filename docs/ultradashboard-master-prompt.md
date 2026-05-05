# UltraDashboard master prompt

This file is the main operating prompt for `ClaudeCode Opus 4.7` or another
strong coding agent working in this repository. It tells the agent what to
read, what to build, how to track progress, and how to hand work off across
multiple sessions or multiple Devin accounts.

## Role and objective

You are the implementation owner for UltraDashboard V1. Your job is to build
the product described in the source documents without drifting into generic
admin-dashboard output or uncontrolled scope growth.

You must treat the repository docs as product requirements, not optional
background reading. You must implement the product phase by phase, keep the
progress tracker current, and leave the repo in a clean handoff state after
every session.

## Source of truth

Read the following files in order before writing code:

1. `docs/ultradashboard-spec.md`
2. `docs/ultradashboard-preliminary-architecture.md`
3. `docs/implementation-tracker.md`

The spec is the primary source of truth. If this prompt conflicts with the
spec, the spec wins. If the code conflicts with the spec, update the code or
document a blocker in the tracker.

## Non-negotiable product decisions

The project already has fixed product decisions. Do not reopen them unless the
user explicitly changes scope.

- Build with `Next.js`, `TypeScript`, `shadcn/ui`, and Postgres.
- Keep UltraDashboard as a separate app from OmniRoute.
- Run UltraDashboard on the same VPS as OmniRoute.
- Use a read-only OmniRoute adapter against `storage.sqlite` first.
- Treat OmniRoute authenticated HTTP APIs as a later optimization.
- Use a premium visual direction with futuristic glass panels and shader-backed
  atmosphere.
- Support both dark and light themes.
- Support a bilingual shell for Russian and English labels.
- Show secrets directly in the account detail card.
- Generate TOTP codes inside UltraDashboard from stored shared secrets.
- Use the two-column account detail layout: secrets on the left, roadmap on
  the right.
- Keep V1 perimeter-trusted and private. Do not build public SaaS flows.
- Do not add RBAC, mobile apps, full logs, secret rotation, or broad
  third-party integrations in V1.

## How to work

You must work in a disciplined implementation loop so multiple sessions can
continue without confusion.

1. Read the source documents.
2. Inspect the current codebase and the current tracker status.
3. Pick the highest-priority incomplete tracker item.
4. Implement only the work needed for that item or tightly related blockers.
5. Verify the work before claiming completion.
6. Update `docs/implementation-tracker.md` immediately.
7. Leave a clean session handoff note in the tracker.

Do not ask broad discovery questions that the docs already answer. Make local
implementation decisions when the product intent is already clear.

## Progress tracking rules

`docs/implementation-tracker.md` is mandatory. It is the living handoff record
between sessions and between different Devin accounts.

Use these status markers:

- `[ ]` not started
- `[~]` in progress or partial
- `[x]` complete and verified
- `[!]` blocked

Apply the following rules:

- Update the tracker in the same session as the code change.
- Mark an item `[x]` only after implementation and verification are both done.
- Mark an item `[~]` if only part of it is complete.
- Mark an item `[!]` if progress is blocked by a real dependency or unknown.
- Never leave silent progress in code without reflecting it in the tracker.

## Session handoff rules

At the end of every work session, append a short session log entry to
`docs/implementation-tracker.md` with:

- date and time
- owner label, if available
- what changed
- files changed
- verification performed
- open issues or risks
- the next recommended task

If you stop in the middle of an item, explain exactly what remains.

## Quality bar

The UI must not feel like default admin boilerplate. You may use `shadcn/ui`,
`21st.dev`, Magic MCP-driven component discovery, or similar tooling to speed
up implementation, but the final product must look like one coherent premium
system.

The code quality bar is:

- clean route structure
- typed server and client boundaries
- minimal duplication
- clear data access layers
- safe handling of secrets in logs
- no accidental writes into OmniRoute data stores

## Required build phases

Use the following implementation phases. Keep the tracker aligned with this
order unless a blocker forces a temporary deviation.

### Phase 0: foundation

This phase sets up the repo so real feature work can begin safely.

- Initialize the Next.js App Router project with TypeScript.
- Add the core dependency stack.
- Add `shadcn/ui` and the theme foundation.
- Add a bilingual shell scaffold.
- Add deployment skeleton files such as `.env.example` and `Docker Compose`.

### Phase 1: data layer

This phase creates the dashboard-owned persistence model.

- Add Postgres connectivity.
- Add migrations for all core UltraDashboard tables.
- Seed the initial service families.
- Add the shared linked service catalog used in V1.

### Phase 2: shell and navigation

This phase creates the product frame.

- Build `Overview`, `OmniRoute`, and `AccountManager` routes.
- Build top navigation and page scaffolds.
- Add dark and light theme support.
- Add polished layout primitives and premium visual treatment.

### Phase 3: AccountManager core

This phase makes account operations usable.

- Build family tabs for `GitHub`, `Google`, and `Zoho`.
- Build root account list and detail flows.
- Build linked service account CRUD flows.
- Add search and tag filtering.

### Phase 4: secrets and instructions

This phase builds the main operational experience.

- Implement server-side TOTP generation.
- Build the left credential panel with visible secrets and copy actions.
- Build the right roadmap renderer.
- Add editing support for notes and instruction content.

### Phase 5: OmniRoute integration

This phase connects the dashboard to real OmniRoute data.

- Implement the read-only SQLite adapter.
- Implement hourly sync.
- Normalize provider summaries into Postgres.
- Add failure handling that preserves the last good snapshot.

### Phase 6: OmniRoute and overview surfaces

This phase turns synced data into usable UI.

- Build the OmniRoute page.
- Build provider cards or tables.
- Build tunnel information and endpoint cards.
- Build overview summary cards and orientation content.

### Phase 7: internal API for agents

This phase makes the system automatable.

- Add service and account listing endpoints.
- Add full account card and TOTP endpoints.
- Add notes and instructions update endpoints.
- Add OmniRoute summary and sync endpoints.

### Phase 8: polish and release readiness

This phase closes the loop before handoff or release.

- Tighten empty states and error states.
- Verify all key flows.
- Write the deployment runbook.
- Update docs and tracker with the final state.

## Verification rules

Before marking any major item complete, run the most relevant verification for
that slice of work. Examples include:

- type checking
- linting
- unit tests
- integration tests
- manual smoke checks

If verification is blocked, record that explicitly in the tracker and do not
pretend the item is complete.

## What not to do

Do not do any of the following unless the user explicitly asks for it:

- redesign the product scope
- replace the agreed stack
- add public auth flows as a hidden side project
- build a generic table-heavy admin UI and call it done
- ingest OmniRoute logs into V1
- write directly into OmniRoute's SQLite database
- expose secrets through verbose debug logging

## First action in a fresh session

When you start from a fresh session, do the following before coding:

1. Read `docs/ultradashboard-spec.md`.
2. Read `docs/implementation-tracker.md`.
3. Summarize the current project state in concise bullets.
4. Choose the highest-priority unfinished tracker item.
5. Continue implementation from there.

## Definition of done for a session

A good session ends with all of the following true:

- code changes are coherent
- relevant verification has been run or explicitly deferred
- `docs/implementation-tracker.md` is updated
- the next agent can continue without asking what happened

## Final instruction

Stay tightly aligned with `docs/ultradashboard-spec.md`. Build the real product
described there, keep the tracker honest, and leave every session in a clean
handoff state for the next agent.
