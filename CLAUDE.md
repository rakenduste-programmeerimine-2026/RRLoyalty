## Project

Gustavi rada: a loyalty program for Rahvaraamat customers. Stack: Next.js, TypeScript, Supabase, Vercel. Deadline: 2026-11-19.

Before changing points, perks, name-day or birthday behaviour, read `docs/program-rules.md`. It is the source of truth for the program rules.

## Workflow

- `development` is the integration branch. Cut every feature branch from it, named `feat/12-points-rail` (type, issue number, slug), and open PRs against it. Only the project owner moves work into `main`: push and merge to `development` at most.
- Every task starts as a GitHub issue, assigned to a milestone and tracked on the GitHub Project (kanban and timeline views).
- Commits follow Conventional Commits. Write issues, commits and PRs in English, and product UI text in Estonian.
- PRs reference their issue with `Closes #12`, but GitHub only auto-closes on merge to `main`, so close the issue by hand when its PR lands on `development`.
- Before starting work on an issue, read the comments and reviews on its connected PRs: the PRs that mention the issue, and the PRs of the issues that blocked it. Find the blockers with `gh issue view <n> --json blockedBy` and the PRs with `gh pr list --state all --search '"#<n>"'`. Read each PR with `gh pr view <pr> --comments` and its line comments with `gh api repos/rakenduste-programmeerimine-2026/RRLoyalty/pulls/<pr>/comments`. Report anything relevant to the user before starting.
- Finish the hi-fi design before writing feature code. `design/` is the lo-fi reference.
- Test with Vitest (domain logic, especially points rules) and Playwright (critical flows only), run in GitHub Actions on PRs.

## Agent skills

### Issue tracker

Issues live in GitHub Issues (rakenduste-programmeerimine-2026/RRLoyalty), managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
