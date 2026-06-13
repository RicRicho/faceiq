# CLAUDE.md — FaceIQ

## Project brief
FaceIQ is a client-side identity verification tool that uses the device's built-in biometrics (Face ID / Android) together with a driver's licence check to prove the real human behind an online interaction. No server upload, no biometric data ever leaves the device. Patent-pending (Ric Richardson). JavaScript web app.

## Goals
- Maintain and extend the client-side verification flow.
- Keep the UX simple: four screens, one action each, a plain Verified / Could not verify result.
- Produce code suitable for licensing/pilot integration by trust-and-safety and marketplace partners.

## Constraints
- Subscription auth only. Never write, add, or log an Anthropic or LLM API key.
- No credentials or secrets in any committed file. All secrets (SUPABASE_ACCESS_TOKEN, ANTHROPIC_API_KEY, WARP_WRITE_KEY) are injected by the CI runner via GitHub secrets.
- Do not introduce server-side biometric processing — the client-side-only design is a core patent claim.
- Do not add features or abstractions beyond what the task requires.

## Write-quarantine rules
Do NOT commit to this repository:
- Patent claim text, application numbers, or specification detail unless explicitly cleared for public release.
- Implementation detail that narrows or weakens patent claims.
- Named licensing targets, investor details, or commercial negotiation notes.
- Private data-room material from unrelated projects.

## Report-back requirements (Warp-dispatched tasks)

The triggering issue body contains the task ID in this format:
```
Warp task: `TSK-YYYYMMDD-XXXX`
```

### (a) Branch and pull request — mandatory

Never commit code changes directly to `main`. For every Warp task:
1. Create a branch: `git checkout -b warp/<task-id>` (e.g. `warp/TSK-20260613-CWT4`)
2. Make all changes on that branch, commit, and push.
3. Open a pull request targeting `main` before exiting.

### (b) Write a cloud-build event on completion

Use the `WARP_WRITE_KEY` secret injected by CI — **not** `SUPABASE_ACCESS_TOKEN`:

```bash
TASK_ID="TSK-..."            # extracted from issue body
SUPABASE_URL="https://uswnbpyiepoaceretjjj.supabase.co"
SUMMARY="one-sentence description of what you did"

curl -s -X POST "$SUPABASE_URL/rest/v1/events" \
  -H "Authorization: Bearer $WARP_WRITE_KEY" \
  -H "apikey: $WARP_WRITE_KEY" \
  -H "Content-Type: application/json" \
  --data "$(jq -n --arg kind cloud-build --arg task_id "$TASK_ID" --arg body "$SUMMARY" \
    '{kind:$kind,task_id:$task_id,body:$body}')"
```

### (c) Close the task row

```bash
curl -s -X PATCH "$SUPABASE_URL/rest/v1/tasks?id=eq.$TASK_ID" \
  -H "Authorization: Bearer $WARP_WRITE_KEY" \
  -H "apikey: $WARP_WRITE_KEY" \
  -H "Content-Type: application/json" \
  --data "$(jq -n --arg status done --arg result "$SUMMARY" \
    '{status:$status,result:$result}')"
```

Use `"status":"failed"` and include the error in `result` if the task could not be completed.

### In-progress logging

Use the `warp-supabase` MCP (SUPABASE_ACCESS_TOKEN) for step logging during the task:
```sql
SELECT cc_log_event('<task-id>', 'worker-step', '<what you did>');
```
Log at least one `worker-step` per meaningful action.
