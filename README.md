# Mopec Gross Tissue Copilot — Free Shared Demo v7

**LTU Biomedical Engineering student research project — independent prototype, not Mopec/Cortex production software.**

A GitHub-ready, no-install gross tissue review demonstrator:
- Macroscopic gross specimen viewer using a real public-domain CDC photograph
- Local foreground-mask suggestion and manual brush/erase
- Seven LTU/Mopec student SOP drafts, with research checklists
- Optional live multimodal Clippy through **NVIDIA Nemotron 3.5 Super VL (free)** on OpenRouter
- Cloudflare Pages Functions to protect **one** project API key from browser users
- Offline/local guidance when AI is not connected or free quota runs out

## Start here

**Read [PUBLISH_ON_GITHUB.md](PUBLISH_ON_GITHUB.md).**

The live demo link only becomes available **after you publish this repository to GitHub and deploy the linked Cloudflare Pages project**. A GitHub Pages-only build runs the browser demo without live AI.

## Why this AI?

`nvidia/nemotron-3.5-super-vl:free` is an OpenRouter model with image+text input and zero token pricing. Free account usage is rate-limited and the service can change or temporarily become unavailable. It is **not** trained/validated as a pathology diagnostic device. Public or specifically authorized research images only; NVIDIA's free endpoint can log inputs.

## Run tests (developers)

Node.js 20+: `npm test`

Tests mock OpenRouter responses because the repository intentionally **does not contain an API key**. A true end-to-end cloud test requires deployment.

## Project files

- `docs/`: the browser application and student SOP listing
- `functions/api/ask.js`: private-key backend to query free vision AI and provide research citation metadata
- `functions/api/specimen.js`: proxy for public CDC gross specimen thumbnail
- `functions/api/health.js`: nonsecret runtime status
- `functions/guides.js`: bundled research drafts used by the backend
- `RESEARCH_SOP_DRAFTS.md`: consolidated draft library
- `PUBLISH_ON_GITHUB.md`: step-by-step GitHub + Cloudflare instructions

## Clinical and IP boundaries

No patient or restricted hospital data. This is not an authenticated clinical system. Historical public image captions are source labels, not AI diagnoses. Do not infer tumor grade/stage or confidence from AI narrative. CAP links identify external educational references, not an official CAP endorsement of the drafts. Repo software is a student research prototype for future Mopec UI and CaptureDx discussions.
