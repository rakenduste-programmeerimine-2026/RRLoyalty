## Project

Gustavi rada: a loyalty program for Rahvaraamat customers. Stack: Next.js, TypeScript, Supabase, Vercel. Deadline: 2026-11-19.

Before changing points, perks, name-day or birthday behaviour, read `docs/program-rules.md`. It is the source of truth for the program rules.

## Workflow

- `development` is the integration branch. Cut every feature branch from it, named `feat/12-points-rail` (type, issue number, slug), and open PRs against it. Only the project owner moves work into `main`: push and merge to `development` at most.
- Every task starts as a GitHub issue, assigned to a milestone and tracked on the GitHub Project (kanban and timeline views).
- Before starting an issue, read its comments and those of its blockers, plus the descriptions and comments of recently merged PRs (`gh issue view 12 --comments`, `gh pr view 29 --comments`). Decisions made there can change what the issue text says. If a comment conflicts with `docs/program-rules.md`, stop and ask rather than picking one.
- Commits follow Conventional Commits. Write issues, commits and PRs in English, and product UI text in Estonian.
- PRs reference their issue with `Closes #12`, but GitHub only auto-closes on merge to `main`, so close the issue by hand when its PR lands on `development`.
- Finish the hi-fi design before writing feature code. `design/` is the lo-fi reference.
- Test with Vitest (domain logic, especially points rules) and Playwright (critical flows only), run in GitHub Actions on PRs.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (rakenduste-programmeerimine-2026/RRLoyalty), managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
