# Project instructions

## Firebase errors

When an error originates from Firebase, explain the error and ask the user to update the relevant Firebase configuration first (for example, database indexes, security rules, or project settings). Do not implement a fallback or other code workaround before asking. Proceed with a code workaround only if the user explicitly requests or approves it.

## Playwright MCP cleanup

After finishing work with Playwright MCP, delete temporary output files created during that work, including snapshots, screenshots, traces, videos, and logs in `.playwright-mcp/` or other output directories. Track files created during the current task and remove only those files; preserve pre-existing files and artifacts the user explicitly asks to keep. Remove output directories only when empty. Perform cleanup before the final response, including after failed browser actions.
