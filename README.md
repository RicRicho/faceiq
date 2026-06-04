# FaceIQ

**FaceIQ helps prove that the person behind an online interaction is the real human they claim to be.**

It is built for the moments where trust matters but the platform gives you almost nothing: a dating-app match before meeting, a marketplace seller before payment, a child-safety check, or any message thread where impersonation, catfishing, synthetic media, or stolen profile photos create risk.

## The simple idea

The FaceIQ web app opens in a browser window, photographs the user's driver's licence, then runs a fast biometric-backed face check using the device's native Face ID or Android biometric flow.

FaceIQ compares the driver's-licence image to photos taken immediately before and after the biometric check, executed as one roughly two-second process. It then displays a confidence level for the match. The driver's licence is also assessed for signs of looking fake or manipulated.

The aim is to make impersonation much harder: a person should not be able to pass by using a photo, a mask, or someone else's device.

FaceIQ is deliberately **platform-independent**. It is not tied to one dating app, marketplace, chat app, or social network. It can work at the URL layer wherever a link can be sent.

## Why it matters

Online identity has shifted from “is this account real?” to “is this the real person behind the account?”

FaceIQ targets that gap:

- **Catfish and romance-scam defence** — verify before meeting, sending money, or sharing private details.
- **Marketplace trust** — reduce risk when dealing with unknown buyers or sellers.
- **Child-safety checks** — help parents confirm who a child is really interacting with.
- **Creator and community trust** — give real people a way to prove presence without forcing every platform to build its own identity layer.

## Product wedges

FaceIQ can support several focused products on the same trust primitive:

- **RealHuman** — dating, creator, and catfish verification.
- **TrustTrade** — marketplace anti-scam verification.
- **KidCheck** — parent-led profile reality checks for child safety.

## Current prototype

This repository contains a browser proof-of-concept for the FaceIQ challenge flow:

- camera capture for the driver's licence image
- before/after live face captures around the biometric check
- browser/platform biometric attempt where supported
- confidence scoring for the match
- licence image quality / fake-document warning signals

The prototype is intentionally lightweight and browser-side. Production identity, biometric, document-fraud, privacy, and security architecture would need hardening before real-world reliance.

## Partnership / licensing

FaceIQ is a Ric Richardson invention with patent-pending protection. It is suited to partners operating in identity, trust and safety, online dating, marketplaces, child safety, social platforms, and fraud prevention.

For licensing, partnership, or pilot discussions, contact Ric Richardson via the RicRicho GitHub profile.

---

© Ric Richardson. All rights reserved unless otherwise agreed in writing.
