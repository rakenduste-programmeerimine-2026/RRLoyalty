<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Workflow

- Before starting work on an issue, read the comments and reviews on its connected PRs: the PRs that mention the issue, and the PRs of the issues that blocked it. Find the blockers with `gh issue view <n> --json blockedBy` and the PRs with `gh pr list --state all --search '"#<n>"'`. Read each PR with `gh pr view <pr> --comments` and its line comments with `gh api repos/rakenduste-programmeerimine-2026/RRLoyalty/pulls/<pr>/comments`. Report anything relevant to the user before starting.
- See `CLAUDE.md` for the rest of the project workflow.
