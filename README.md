# Mopec Specimen Review Workstation

**Live site:** https://mopec-gross-copilot.isabellachandler169.workers.dev/

## v14 — Image-first Capture DX research workflow

**Live site:** https://mopec-gross-copilot.isabellachandler169.workers.dev/

New PA-facing features include an **8-image specimen view filmstrip**, original-resolution detail inspection/crop export, **side-by-side photograph comparison**, standalone **local image QC** with actionable retake suggestions, and a **section/cassette map** linking proposed section sites to views and AI/manual regions with a PA verification status. Review JSON now captures linked photo metadata, cassette mapping and local/cloud assistance mode. Draft descriptions include verified cassette records.

The header's **Local review only** option blocks initiating external AI and browser speech from the UI while allowing image viewing, QC, annotations and manual review. This is not a full offline license or a hospital deployment. Additional photo views are treated as unapproved until the operator explicitly authorizes cloud use in Capture.

MiniMax M3.1 Flash and Kimi K3.1 Pro adapters remain available **without switching away from Groq automatically** until owner credentials are configured and medical-image benchmarks have been completed. The model label and `/api/health` report the selected provider.

**For a complete demonstration script, technical acceptance checklist, and honest dependency matrix**, see [SPONSOR_HANDOFF_V14.md](SPONSOR_HANDOFF_V14.md).

---

## v13 — MiniMax / Kimi Clippy provider adapter

From the November 6 sponsor model discussion, the backend now supports **MiniMax M3.1 Flash** and **Kimi K3.1 Pro** through separate, fixed, server-only multimodal API endpoints. Either can serve Clippy Q&A and preliminary gross-image proposals when the project owner supplies a private provider key; no visitor API key is required. Health and sidebar labels now show the actual selected provider.

**The existing Groq key remains in place** until an alternative is activated and passes real gross-image tests. Model availability, pricing and clinical quality are not guaranteed. Do not publish a paid credential in GitHub or enable unlimited billed calls from an unprotected public site.

See [secure setup, model costs and the controlled PA benchmark](CLIPPY_MODEL_SETUP.md). For the next project phase, compare models on exactly the same source-labeled gross photos with PA reviewers and independently verified region annotations.

---

## v12 — Capture DX sponsor-review improvements

Updated from the November 6, 2026 discussion with Mike and Roseanne and the supplied Capture DX screenshots. **No new API key or reinstallation is required.**

- **Current case inspector:** a compact, collapsible case context on the right (synthetic accession, image source, QC, AI proposals, PA status, anatomy review cues). It automatically clears the image-viewing area when Clippy opens.
- **Hands-free controls:** optional microphone push-to-talk or typed commands for opening workflow tabs, initiating analysis, viewer zoom/overlay, camera preview, synthetic barcode scanning, notes and Clippy questions. Speech recognition requires browser support and may use a remote speech provider.
- **PA-oriented anatomy questions:** concise specimen-specific review prompts for renal sinus, fat/vascular interfaces, breast measurements/margins and prostate section mapping. Opens an editable Clippy question for follow-up, not automatic tumor staging.
- **Clippy update:** model instructions now prioritize visible gross anatomy, needed extra views or measurements, unassessable interfaces, PA verification and cited source guidance.
- **Handoff:** see [Nov 6 sponsor requirements and outstanding dependencies](SPONSOR_HANDOFF_V12.md). Exact MiniMax/Kimi model IDs, authorized gross images, LTU Pathologize credentials and DGX Spark access have *not* been provided; the current Groq vision service remains unchanged.

### Quick commands
Click **Hands-free** in the header, or press **Alt+Shift+V**, and type or speak "Open analysis", "Next step", "Analyze image", "Open Clippy", "Zoom in", "Dictate note …" or "Ask Clippy …". Speech runs only after user initiation; never dictate patient identifiers on this public build.

**This remains a research prototype, not a clinical decision-making device.** No stage, definitive diagnostic probability, live patient records, hospital SOP approvals or offline license integration are claimed.

---

## v11 — PA workflow + measurable research annotations

The live Cloudflare site has been updated in place. No user installation or individual API keys are required.

**What has been added:** optional focused PA layout and keyboard help; a step-aware workflow ribbon; experimental color-connected **Seed mask** segmentation with tolerance tuning and PNG export; manually drawn polygon annotations; user-entered **mm/px calibration** from a measured ruler reference; original/annotated comparison; reviewer-acknowledged QC and image completeness; correction reasons; case timeline and export; local **Dice/IoU** against an aligned user-supplied reference mask; import-only model-box comparison; and a current-case metrics panel.

**What these do not mean:** The seeded mask is NOT a trained gross-tumor segmenter; a reference mask is not automatically expert-verified; subjective model percentages are not calibrated disease probabilities; and this public prototype does not assign clinical cancer stage or connect to patient records.

**Quick start:** Image Library → AI Analysis → Analyze → use Polygon or Seed mask → Review & Evidence → Model correction/QC confirmation → export review JSON. Advanced tools are tucked into collapsible panels. Clippy remains a right-hand toggleable assistant and uses the existing Groq runtime key.

See the [32-feature status matrix and validation instructions](FEATURE_STATUS_V11.md) for exactly what is working versus blocked pending Mopec data, model identifiers, Pathologize access, DGX Spark access and licensed hospital integration.

---

## v10 — Mopec sponsor-aligned Capture & Analysis workstation

**Current site:** https://mopec-gross-copilot.isabellachandler169.workers.dev/

Designed from the November 6 meeting with Mike and Roseanne and the provided Capture DX screenshots. Work is scoped to a **bespoke module for handoff to Geo**, not a copy of Capture DX's full admin application.

### Working in the browser
- Case queue and specimen image library; imported JPEG/PNG/WebP photos remain local until the researcher explicitly authorizes cloud AI processing.
- Capture tab with camera preview and optional camera frame capture, local scanning of synthetic demo barcodes (where BarcodeDetector is supported), notes and browser dictation. Speech recognition may use remote services and is *not* approved hospital transcription.
- Image QC heuristics (relative sharpness, image size, near-white/dark regions), experimental foreground contour and uncalibrated pixel measurement.
- Groq vision model suggestions for preliminary organ/finding classification and candidate bounding boxes, with **subjective visual-support percentages**. These are not validated lesion masks, disease probabilities or automatic staging.
- Per-region accept/edit/reject, renal/breast anatomy-focused verification checklist, reviewer notes, editable gross description draft and local JSON export.
- Collapsible Clippy question-and-answer sidebar with relevant current specimen context and source-linked draft SOP passages.
- Model/readiness tab and PA usability walkthrough timer recording task time, button interactions and reported errors; no centralized analytics.
- Mobile-responsive layout and light/dark appearance.

### Not yet connected
No live Pathologize.com/Capture DX API, actual Mopec station barcode/200 MP camera, Epic/LIS, official institutional SOP, hospital-grade voice stack, Kimi/MiniMax credentials, validated gross segmentation model or DGX Spark training. These need sponsor-provided access, specific interface contracts, approved data and independent evaluation. Do not use this public Worker with identifiable patient material.

### Handoff & reproducibility
- [Capture DX handoff and next steps](CAPTURE_DX_HANDOFF.md)
- [Dataset preparation / DGX prerequisites](training/README.md)
- [Dataset manifest verifier](training/prepare_manifest.py)
- [Original v9 web layout](https://mopec-gross-copilot.isabellachandler169.workers.dev/legacy-v9.html)

### Deployment and future requests
This repository remains connected to Cloudflare Workers Builds; changes committed to main trigger a deployment with the existing secret kept in Cloudflare runtime settings. Do **not** put API keys in GitHub. Client code is in docs/workstation-*; Worker inference/RAG routes are in src/worker.js and functions/guides.js. GitHub Actions checks syntax and backend tests.

---

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
