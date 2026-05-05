# UltraDashboard bootstrap prompt

This file is the short prompt you can paste into a fresh Devin or coding-agent
session. It points the agent to the full operating prompt and the live tracker
so the session starts in the right place.

Use the following prompt as-is.

```text
You are starting work in the UltraDashboard repository.

Your first task is to read `docs/ultradashboard-master-prompt.md` and follow it
exactly. Do not start coding until you have read:

1. `docs/ultradashboard-master-prompt.md`
2. `docs/ultradashboard-spec.md`
3. `docs/implementation-tracker.md`

After reading them:

1. Summarize the current project status in 8-12 concise bullets.
2. Identify the highest-priority incomplete tracker item.
3. Continue implementation from that item.
4. Update `docs/implementation-tracker.md` immediately whenever an item status
   changes.
5. End your session by leaving a clean handoff note in the tracker.

Important rules:

- The spec is the source of truth.
- Do not reopen already fixed product decisions.
- Do not drift into generic admin-dashboard design.
- Verify work before marking a tracker item complete.
```

## Next steps

When you start a new agent session, paste the text block above first. That will
route the agent into the master prompt, then into the spec, then into the live
tracker.
