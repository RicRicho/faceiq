# CLAUDE.md — FaceIQ (public demo surface)

## Project brief
FaceIQ is a client-side identity verification tool that uses the device's built-in biometrics (Face ID / Android) together with a driver's licence check to prove the real human behind an online interaction. No server upload, no biometric data ever leaves the device. Patent-pending (Ric Richardson). JavaScript web app.

**This repository is the public demo surface only.** It contains the browser proof-of-concept and nothing operational — no secrets, no CI automation, no backend identifiers, no internal architecture. Production, hardening, and operational work live in a separate **private** repository.

## Goals
- Maintain and extend the client-side verification flow.
- Keep the UX simple: four screens, one action each, a plain Verified / Could not verify result.
- Produce code suitable for licensing/pilot integration by trust-and-safety and marketplace partners.

## Constraints
- No credentials or secrets in any committed file — ever.
- Do not introduce server-side biometric processing — the client-side-only design is a core patent claim.
- Do not add features or abstractions beyond what the task requires.

## Write-quarantine rules
Do NOT commit to this public repository:
- Patent claim text, application numbers, or specification detail unless explicitly cleared for public release.
- Implementation detail that narrows or weakens patent claims.
- Named licensing targets, investor details, or commercial negotiation notes.
- Any operational detail: backend URLs, service/project identifiers, secret names, CI automation, or task-runner configuration. These belong only in the private repository.
- Private data-room material from unrelated projects.
