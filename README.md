# LTU / Mopec Gross Tissue Copilot — Cloudflare Worker fix (v7.1)

**This is the Worker-compatible version of the already published Mopec gross specimen demo.** It keeps the clean UI, real CDC gross specimen, draft SOP library, color-based foreground mask, editing controls, and shared Clippy. Its backend now works on **Cloudflare Workers** (the `*.workers.dev` domain), not Pages Functions. It uses **Groq Free** with an image-capable `qwen/qwen3.8-27b` model.

## Files to upload to GitHub

Upload **the contents of this folder**, preserving this structure:

```
docs/
  index.html
  config.js
  research_guides.js
functions/
  guides.js
src/
  worker.js
wrangler.jsonc
package.json
README.md
PUBLISH_ON_GITHUB.md
RESEARCH_SOP_DRAFTS.md
tests/
  worker.test.mjs
```

No API key is inside the source code. No Python or API key is needed for visitors.

## Quick verification

- After GitHub upload and Worker build: `/api/health` should return JSON (not a 404).
- After setting `GROQ_API_KEY` as a Cloudflare Worker secret and deploying: `/api/health` should show `"configured": true`.
- Only a successful Clippy image-question test proves the external AI model is responding. `configured: true` confirms only that the key is present.

Read `PUBLISH_ON_GITHUB.md` for step-by-step directions for the existing worker.

## Technical limitations

This is a public **research demonstrator**, not a secured clinical workstation. Groq's free model quotas apply to the entire project; public traffic can exhaust the shared key. The embedded source labels are from CDC metadata, not predicted diseases. Clippy can describe tentative findings but is not a trained or calibrated disease classifier. Seven workflow protocols are explicitly marked LTU **student drafts**, not hospital-approved guidance. Do not upload patient data.

Run local unit tests with `npm test` (Node.js 20+). Live Groq connectivity requires an account key and successful deployment.
