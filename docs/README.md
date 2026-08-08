# docs/

Working copies of the project's planning docs, mirrored in for local reference while building the
API. They are snapshots, not live syncs — re-copy by hand when the source changes.

| File | Original source | Notes |
|---|---|---|
| `ER.mermaid`, `ER.README.md` | `AdvisoryPlatform-Docs` repo (sibling to this one) | Canonical source stays that repo — it's the one thing given repo authority over the vault. Copied 2026-08-08. |
| `api-spec.md` | Obsidian vault, `Advisory API spec.md` | Copied 2026-08-08. Marked `Status: SAMPLE` at the source — only the Advisors module is written; expect this to be behind. |
| `sprint-plan.md` | Obsidian vault, `Advisory sprint plan.md` | Copied 2026-08-08. Forward-looking only, updated per sprint — this copy goes stale fast. |
| `frontend-contract.md` | Obsidian vault, `Advisory frontend contract.md` | Copied 2026-08-08. What breaks if frontend/backend assume different answers — sections 1–2 need a team decision, section 3 is settled. |
| `proposal.md` | Obsidian vault, `Advisory proposal.md` | Copied 2026-08-08. Verbatim copy of the submitted proposal (ข้อเสนอโครงงาน) — historical record, not a living doc. |
| `meetings/` | Obsidian vault, `Meeting *-2569.md` | Copied 2026-08-08. Filenames keep the vault's พ.ศ. dates (2569 ≈ 2026), just slugified. |
| `dev-log.md` | Native to this repo | Not a mirror — a running, append-only record of what changed and why, session by session. Started 2026-08-08. |
| `HANDOFF.md` | Native to this repo | Not a mirror, not append-only — a current-state snapshot (what's built, how to run it, what's next), overwritten in place each time it's refreshed. Started 2026-08-08. |

If something here looks wrong, check whether the vault or `AdvisoryPlatform-Docs` has since moved on — this folder doesn't know.
