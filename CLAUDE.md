# CLAUDE.md — FaceIQ

## Project brief
FaceIQ is a client-side identity verification tool that uses the device's built-in biometrics (Face ID / Android) together with a driver's licence check to prove the real human behind an online interaction. No server upload, no biometric data ever leaves the device. Patent-pending (Ric Richardson). JavaScript web app.

## Goals
- Maintain and extend the client-side verification flow.
- Keep the UX simple: four screens, one action each, a plain Verified / Could not verify result.
- Produce code suitable for licensing/pilot integration by trust-and-safety and marketplace partners.

## Constraints
- Subscription auth only. Never write, add, or log an Anthropic or LLM API key.
- No credentials or secrets in any committed file. All secrets (SUPABASE_ACCESS_TOKEN, ANTHROPIC_API_KEY) are injected by the CI runner via GitHub secrets.
- Do not introduce server-side biometric processing — the client-side-only design is a core patent claim.
- Do not add features or abstractions beyond what the task requires.

## Write-quarantine rules
Do NOT commit to this repository:
- Patent claim text, application numbers, or specification detail unless explicitly cleared for public release.
- Implementation detail that narrows or weakens patent claims.
- Named licensing targets, investor details, or commercial negotiation notes.
- Private data-room material from unrelated projects.

## Warp event logging
For tasks dispatched from Warp, use the `warp-supabase` MCP server (configured in `.claude/settings.json`) to log progress and close the task row:

```sql
-- Log a step
SELECT cc_log_event('<task-id>', 'worker-step', '<what you did>');

-- Close the task
UPDATE tasks SET status = 'done', result = '<summary>' WHERE id = '<task-id>';
```

Log at least one `worker-step` per meaningful action and always close the task row (`done` or `failed`) before exiting.
