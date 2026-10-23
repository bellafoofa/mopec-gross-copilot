# Mopec Specimen Review Workstation

**Live site:** https://mopec-gross-copilot.isabellachandler169.workers.dev/

## v9 — Interactive Clippy and preliminary scored findings

**Already published to the existing Cloudflare Worker.** No browser API key, Python installation, or reinstallation is necessary.

1. Open the website and choose a specimen in **Library**, or **Open image** for a local approved gross photograph.
2. Select **Analyze**. The color-based tissue/background boundary is drawn and a separate Groq vision request proposes focal regions, organ identity, and gross-morphology considerations.
3. The results bar includes **subjective AI visual-support percentages** where the model can provide them. These are *not calibrated disease probabilities or validated tumor diagnoses*. When the photograph cannot support a meaningful score, the UI shows N/A.
4. Preliminary focal bounding boxes appear over the photograph. A localized color-similarity highlight is generated from the first region; it is not an expert lesion mask. Brush/Erase still edit the foreground layer.
5. Click **Clippy** in the top bar to open a right-side question-and-answer panel; click again, press Escape, or click × to close. Clippy supports continued questions and renders Markdown headers, bullet lists, and cited draft SOP references.
6. Record **Accepted / Edited / Rejected** with a reviewer note; export the image PNG or a review JSON.

**Model governance:** The backend checks whether the generated organ identification conflicts with the selected specimen's source label and flags mismatch rather than accepting it as a medical finding. Human review and model benchmarking with expert labels remain essential. The prototype is not validated for patient-care diagnosis.

**AI availability:** Free Groq inference depends on the provider's quota and model availability. The public key is stored as the Cloudflare Worker runtime secret `GROQ_API_KEY`, never in the repository.

---
## What is in v8

- Flat imaging-first workstation with horizontal navigation, optional Clippy panel, light/dark toggle and improved Markdown rendering.
- Seven curated real **gross specimen** examples across kidney, lung, liver and brain. Each item links back to source attribution and licensing.
- Image QC metrics (blur heuristic, white clipping, image size) and heuristic tissue/background boundary.
- Groq vision proposals: preliminary organ classification and visually localized feature boxes, with optional **color-similar region highlight**. These are **not** a trained tumor segmentation or calibrated disease probabilities.
- Reviewer accept/edit/reject decisions, short notes and portable JSON/PNG exports.
- Seven draft workflow/SOP references with source URLs. Approved institutional SOPs will replace these as supplied.

## Automatic website updates

The GitHub repo is connected to Cloudflare Workers Builds on the **main** branch. Any merged commit can trigger redeployment using `npx wrangler deploy`. For routine updates, modify the repository files; **do not** recreate Cloudflare or re-enter `GROQ_API_KEY`.

- Frontend: `docs/index.html`, `docs/v8.css`, `docs/v8.js`
- Model/API worker: `src/worker.js`
- Research SOP corpus: `functions/guides.js` and `docs/research_guides.js`
- Automated checks: `npm test`, GitHub Actions `.github/workflows/checks.yml`

If a new GitHub commit does not appear live, check **Cloudflare > Workers & Pages > mopec-gross-copilot > Deployments** before changing settings.

## Scientific status

Source-derived condition labels are **catalog metadata**. Groq visual suggestions are unverified **proposals**, not independent validated diagnoses. Tissue/background isolation is a color-based heuristic. The color-similar region function highlights pixels within an AI-suggested box; it is not a validated cancer mask. Numerical confidence scores are deliberately unavailable until an organ-specific classifier is trained and evaluated against independently reviewed labels.

Next: choose a single organ (e.g., kidney), obtain expert-reviewed **region masks** and labels, evaluate SAM/MedSAM against a frozen held-out set, then calibrate a classifier and review failure cases. Gross-specimen photographs are distinct from microscopic whole-slide images.

---
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
