# UltraDashboard preliminary architecture

This document captures the current product definition for UltraDashboard as of
May 5, 2026. It turns the discovery interview into a working architecture
draft, records what was verified against the live OmniRoute server, and lists
the assumptions we are making before writing the full implementation spec and
the master prompt for ClaudeCode Opus 4.7.

## Product summary

UltraDashboard is an internal operating dashboard for two human operators and
their trusted agents. It combines two jobs in one interface: an OmniRoute
control surface and an account operations workspace. The product is not a
general public SaaS app. It is a private tool that lives on the same VPS as
OmniRoute and is accessed only through the agreed tunnel or perimeter path.

The first release focuses on practical work, not enterprise process. Users must
be able to open the dashboard, understand what OmniRoute is, see what providers
and quotas are available, browse account inventories, reveal secrets directly in
the UI, generate current TOTP codes, read clean human-friendly instructions,
and hand the same information to agents through the UI or an internal API.

## Confirmed scope for V1

The first release has a deliberately narrow scope so it stays buildable. The
top-level app shell contains **Overview**, **OmniRoute**, and
**AccountManager**. Inside **AccountManager**, the first nested service tabs are
**GitHub**, **Google**, and **Zoho**.

The core actions for V1 are:

- View OmniRoute endpoint and tunnel information.
- View OmniRoute provider availability and quota status.
- Browse service families and root accounts.
- Open a linked service account card.
- View login, password, TOTP code, tags, notes, and instructions.
- Create, edit, archive, and delete account records.
- Let agents consume the same data through the UI or internal API.

V1 explicitly excludes multi-user access control, mobile applications, complex
analytics, log ingestion, secret rotation, and broad third-party integrations.

## Validated OmniRoute findings

We validated the live OmniRoute environment over SSH on May 5, 2026, so this
draft is grounded in the real system instead of guesses. The active OmniRoute
management app is a Next.js server listening on port `20128`, and the root path
redirects to `/dashboard`.

The management routes are not publicly open even on localhost. Requests to
paths such as `/api/provider-metrics`, `/api/health`, `/api/models`, and
`/api/tags` return `401 Authentication required` without a logged-in session.
That means UltraDashboard must not assume a clean unauthenticated HTTP API for
stats collection.

The good news is that OmniRoute's local data store already contains the fields
we need for a lightweight dashboard. The live `storage.sqlite` file contains at
least these relevant tables:

- `provider_connections`
- `quota_snapshots`
- `usage_history`
- `provider_nodes`
- `registered_keys`
- `provider_key_limits`

The current data confirms that providers such as `codex`, `chatgpt-web`,
`github`, `devin`, and `groq` are stored there, and recent quota snapshots are
present. This is enough to support a V1 OmniRoute summary page, even if the
authenticated internal API is inconvenient to reuse directly.

## Proposed information architecture

The app structure needs to feel simple at the top and deep only when you drill
in. The recommended navigation model for V1 is:

1. **Overview**
2. **OmniRoute**
3. **AccountManager**

Inside **AccountManager**, the nested service-family tabs are:

- **GitHub**
- **Google**
- **Zoho**

Each family page shows a table of root accounts. Opening a root account takes
the user to a dedicated detail page that lists linked service accounts such as
OpenAI or Devin. Opening a linked service account shows the full credential
card, instruction content, notes, tags, and current TOTP output.

This matches the confirmed mental model:

`Google -> Google account -> linked services -> OpenAI card`

## Proposed UI model

The UI direction for V1 is a premium internal tool, not a generic admin panel.
The visual system uses a futuristic glass look with shader-backed atmosphere,
tight spacing, careful alignment, and both dark and light themes. The UI also
needs a language toggle, with the shell itself built to support both Russian
and English.

The recommended rendering model is:

- A polished shell with top navigation and ambient visual effects.
- Dense but readable service tables for fast scanning.
- A separate account detail page instead of an in-row expander.
- Styled instruction content that reads like a roadmap, not raw Markdown.
- One-click copy actions for every field that matters to people or agents.

The instruction renderer should use structured blocks under the hood, even if
editing starts from Markdown-like input. That gives us human-readable output in
the UI without forcing agents to parse presentation-heavy HTML.

## Proposed technical architecture

The recommended V1 stack is `Next.js` with the App Router, `TypeScript`,
`shadcn/ui`, and a Postgres database dedicated to UltraDashboard. The app runs
on the same VPS as OmniRoute, but it must remain a separate service with its
own data model, migrations, and deployment lifecycle.

For UI implementation quality, the build workflow may source ideas or component
patterns from `21st.dev`, Magic MCP-driven component discovery, and related
design tooling. The shipped result must still feel like one consistent product,
not a collage of unrelated blocks.

The main runtime pieces are:

- `web app`: Next.js full-stack app for UI and internal API.
- `dashboard db`: Postgres for UltraDashboard data.
- `omniroute adapter`: server-side module that reads OmniRoute data.
- `hourly sync job`: scheduled task that refreshes OmniRoute summaries.
- `totp module`: built-in TOTP generator from stored shared secrets.

For deployment, a small `Docker Compose` setup on the VPS is the most practical
default. It keeps the dashboard and Postgres isolated from OmniRoute while
still letting them communicate over the local network.

## OmniRoute integration strategy

UltraDashboard should treat OmniRoute as an upstream system, not as a module it
owns. The cleanest V1 approach is an adapter with two possible data sources,
ordered by preference.

1. Use authenticated OmniRoute management APIs if stable credentials and route
   behavior are easy to wire up.
2. Fall back to read-only access against OmniRoute's local `storage.sqlite`
   when the internal API is gated or unstable.

For V1, the dashboard does not need detailed logs. It only needs provider-level
status cards and simple quota summaries. The hourly sync job should normalize
the upstream data into UltraDashboard-owned summary rows, for example:

- `provider_name`
- `total_accounts`
- `active_accounts`
- `available_windows`
- `exhausted_windows`
- `average_remaining_pct`
- `last_snapshot_at`
- `display_endpoint`
- `provider_note`

Because the current OmniRoute data already stores connection and quota data,
this adapter is feasible without changing OmniRoute first.

## AccountManager data model

The account hierarchy is deeper than a flat password vault, so the database
must model that explicitly. The proposed V1 data model is:

- `service_families`: top-level families such as GitHub, Google, and Zoho.
- `root_accounts`: actual family accounts such as a specific Google identity.
- `linked_service_accounts`: child accounts such as OpenAI or Devin attached to
  one root account.
- `instruction_documents`: structured roadmap content for each linked service.
- `tags`: reusable labels.
- `linked_service_account_tags`: join table for tags.

Each `linked_service_account` record should support these V1 fields:

- `service_name`
- `login_or_email`
- `password`
- `totp_secret`
- `login_url`
- `tags`
- `notes`
- `instruction_document`
- `status`
- `archived_at`

The user asked for secrets to be visible directly in the card. That means the
UI should show password and current TOTP code immediately on the detail page,
with clear copy actions nearby.

## Instruction model

Instructions are part of the product, not a side note. They must work for both
human collaborators and agents. V1 should store them in a structured format
that can render as clean UI blocks and checklists.

The recommended content model is:

- `title`
- `summary`
- `steps[]`
- `tips[]`
- `warnings[]`
- `use_cases[]`
- `links[]`

The UI should render this as a roadmap panel with ordered steps, helper notes,
and service-specific guidance such as "how to use this account to register for
OpenAI" or "how to hand this credential set to an automation agent."

## Agent access model

The product is explicitly designed for trusted agents. V1 therefore supports
two access paths: browser automation over the UI and an internal API for direct
reads and selective writes.

The required internal API surface for V1 is:

- `list services`
- `list accounts in service`
- `get full account card`
- `get current OTP`
- `search by tag`
- `get OmniRoute summary`
- `get provider quotas`
- `update notes`
- `update instruction block`
- `create new account entry`

The user currently prefers perimeter-based trust instead of per-agent tokens.
That is workable only if the service remains private to the VPS and tunnel path.
It is not safe for open internet exposure.

## Security perimeter and risk position

V1 is intentionally not a full RBAC product, but it still handles highly
sensitive data. The current user direction is to trust the tunnel boundary,
store secrets in plain form in the database, and skip a full application auth
model. That decision is possible, but it is the highest-risk choice in the
entire project.

The minimum defensive baseline for V1 must still include:

- No public internet exposure.
- Binding only to the intended private or tunneled access path.
- Strict CORS and same-origin browser behavior.
- No indexing, caching, or analytics vendors.
- Careful redaction of secrets from server logs.
- A separate database for UltraDashboard, not shared writes into OmniRoute.

The recommended safer alternative is to encrypt secrets at rest in the
dashboard database and keep the encryption key in environment variables. The
user explicitly declined that for now, so the full spec must record this as a
conscious risk acceptance, not an accidental omission.

## Assumptions in this draft

This preliminary architecture makes the following assumptions so we can keep
moving before every edge case is resolved.

- The dashboard is a private internal tool for two trusted humans.
- Agents are trusted and may read the same secrets humans can read.
- Site access already implies tunnel or perimeter access, so the "raise SSH
  tunnel" concept becomes a tunnel information card instead of a true remote
  action button.
- TOTP generation is built into UltraDashboard from stored shared secrets.
- V1 does not integrate with `2fun` or another external OTP provider.
- OmniRoute stats are refreshed hourly by the dashboard itself.
- OmniRoute data is consumed through an adapter, not embedded directly into the
  dashboard codebase.
- The first family tabs are GitHub, Google, and Zoho.
- Linked service accounts under those families may include OpenAI, Devin, and
  other services later.
- The dashboard stores only current state, not version history or rollback.

## Recommended implementation order

If multiple Devin accounts or ClaudeCode sessions work on this project, they
need a deterministic build order. The recommended sequence for V1 is:

1. Build the app shell, navigation, theme system, and visual language.
2. Build the AccountManager data model, CRUD flows, and TOTP generation.
3. Build the AccountManager list views and account detail pages.
4. Build the instruction roadmap renderer and editor model.
5. Build the OmniRoute adapter and hourly sync pipeline.
6. Build the OmniRoute overview page and provider summary cards.
7. Build the internal agent API.
8. Add deployment packaging and VPS runbooks.

This order gives the project a usable foundation early while postponing the
most integration-heavy work until the UI and data model are stable.

## Open questions for the full spec

This draft is strong enough to move forward, but several items still need a
final product decision in the next pass.

- Whether UltraDashboard should read OmniRoute through authenticated APIs or a
  read-only database adapter by default.
- Whether the dashboard will add even a minimal login gate beyond the tunnel.
- Which exact linked services belong in the first content wave under GitHub,
  Google, and Zoho.
- What exact instruction block schema gives the best balance between editing
  ease and premium UI rendering.
- Whether the UI language toggle affects stored content, or only shell labels.
- Whether the dashboard must expose raw tunnel passwords in the UI, or only
  access instructions.

## Next steps

The next document should convert this draft into a full implementation spec.
That spec needs page-by-page requirements, concrete Postgres schemas, API
contracts, sync flow details, UI component structure, acceptance criteria, and
the master execution prompt for ClaudeCode Opus 4.7 with a handoff protocol for
multiple Devin accounts.
