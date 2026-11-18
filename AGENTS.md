# Project instructions

## Commit messages

Use `WV-<next index number>: <commit message>` for every commit message. Before committing, inspect Git history for the highest existing `WV-<number>:` prefix and increment that number by one.

## Firebase errors

When an error originates from Firebase, explain the error and ask the user to update the relevant Firebase configuration first (for example, database indexes, security rules, or project settings). Do not implement a fallback or other code workaround before asking. Proceed with a code workaround only if the user explicitly requests or approves it.

## Design verification

Whenever updating a design or UI, including the standalone HTML design, open the changed artifact in a browser and inspect its rendered appearance before declaring the work complete. Source inspection, type checks, and passing tests alone are insufficient.

- Check affected screens and states at relevant desktop and mobile sizes. For fixed-size phone mockups, inspect the entire phone frame.
- Verify that text, inputs, suggestions, buttons, and footers fit without clipping, overflow, or overlap and remain readable.
- Exercise changed interactions, including selection, confirmation, and enabled/disabled controls. Use the artifact's existing interaction system.
- Check browser errors and confirm nearby screens still render correctly. For bundled HTML, verify the actual bundled file loads and renders, not just its extracted template.
- Fix any observed issues and repeat the browser check after the final edit. Inspect screenshots when useful, and clean up temporary browser artifacts afterward.
- If browser verification is unavailable, explicitly report that limitation and leave visual verification outstanding; do not claim the design is verified or the work fully complete.

## Playwright MCP cleanup

After finishing work with Playwright MCP, delete temporary output files created during that work, including snapshots, screenshots, traces, videos, and logs in `.playwright-mcp/` or other output directories. Track files created during the current task and remove only those files; preserve pre-existing files and artifacts the user explicitly asks to keep. Remove output directories only when empty. Perform cleanup before the final response, including after failed browser actions.
