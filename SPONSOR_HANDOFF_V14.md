# Mopec Capture & Analysis v14 — Sponsor handoff and test guide

> **November 9, 2026 v15 update:** The deployed Clippy and Analyze image provider is now **Cloudflare Workers AI · Mistral Small 3.1**, replacing the shared rate-limited Groq default (HTTP 429). Both functions returned responses in live testing on the public CDC kidney specimen. Cloudflare daily free allocation limits still apply; this is not a validated pathology model. Earlier v14 table entries mentioning Groq are a historical snapshot and are superseded by this note. MiniMax and Kimi remain optional only when supplied an owner-managed credential. See [CLIPPY_MODEL_SETUP.md](CLIPPY_MODEL_SETUP.md).

**Public research workstation:** https://mopec-gross-copilot.isabellachandler169.workers.dev/

**Sponsor basis:** transcript supplied by LTU team from the November 6, 2026 Mike/Roseanne meeting; provided Capture DX and offline licensing screenshots. This is an LTU student R&D prototype, not the proprietary Mopec clinical platform.

## Implemented in the current browser prototype

| Capture DX need | Implementation in v14 | Important qualification |
| --- | --- | --- |
| One active case / specimen context | Cases, synthetic barcode intake, persistent active-case inspector, source provenance | No real patient identifier, Epic/LIS, pathology case server or shared database |
| Multiple grossing photographs per case | **Specimen views** filmstrip with up to 8 photos, per-view QC/results/annotations, and unregistered side-by-side comparison | Browser-session only; added user photo views require separate cloud-use authorization; no DICOM/whole-slide/tiled integration |
| High-resolution review | **Inspect detail** opens a native-pixel crop from the original decoded image; 1:1 crop export to local PNG | Current browser/Worker pipeline is not a validated 200-megapixel image tile server; memory-limited research workflow |
| Image quality gate | Standalone **Run local QC** without calling the AI provider; warns about low pixel resolution, blur, glare/light clipping, dark regions, with retake guidance | Screening heuristics, not clinically validated; PA decides whether to accept or retake |
| AI candidate anatomy / abnormality proposals | Groq vision currently active; MiniMax / Moonshot adapters prepared; visible region boxes and uncalibrated subjective visual-support scores | Not trained, clinically calibrated, or guaranteed to identify disease. No reliable automatic cancer staging. |
| Mask editing and measurement | Local seed-region growth, polygon tools, manual brush/erase, operator-calibrated mm measurements and reference-mask overlap testing | Seed segmentation is color-based, not SAM/MedSAM; operators must verify boundary and calibration |
| PA grossing completeness QA | Image-view checklist, renal/breast/prostate anatomy checks, reviewer notes, sources/draft SOP guidance | Hospital-specific controlled SOP approval and specimen-level stage classification are not implemented |
| Cassette/section mapping | **Section / cassette map** with A1/B1 labels, image/region references, reviewer status, notes and CSV export | No automated tissue sampling, cassette printer, grossing robot or LIS integration |
| Gross description | Editable draft from selected source metadata and PA-confirmed measures/regions, with verified cassette sections | Does not create final surgical pathology reports or infer histology |
| Reviewer corrections and handoff | Accept/Edit/Reject, corrections, review event log, JSON/PNG/CSV/TXT export, current-case validation metrics | Browser-memory research record only, no authenticated clinical audit trail |
| Hands-free operations | Opt-in speech/typed commands for navigation, camera, local notes, Clippy and analysis | Browser speech services may send audio outside the facility; not yet approved for protected data |
| Restricted/offline environments | **Local review only** mode disables app-initiated cloud AI and browser speech, while local QC/image editing works | Not an installed/offline licensed hospital workstation; webpage still needs loading |
| Minimax/Kimi experimentation | Backend adapters for MiniMax M3.1 Flash, Kimi K3.1 Pro and existing Groq | MiniMax/Kimi not activated without owner-supplied keys. Online provider charges/free limits and contracts are separate decisions |

## v14 PA walkthrough — verify before Mopec demo

1. Open public kidney specimen from the **Image Library**. Confirm source organ, provenance, licensing and native pixel dimensions.
2. In **AI Analysis**, choose **Run local QC**. Review any retake warnings; note that flag absence is not clinical clearance.
3. Choose **Inspect detail**. Pan between native crops and export a local region PNG without downsampling the underlying image.
4. Use **+ Add views** to attach a second authorized gross photograph. Switch thumbnails and check that the source, QC and annotations are tied to that view rather than another photo. **Compare** opens unregistered side-by-side images.
5. From **Capture**, demonstrate synthetic barcode intake, camera preview and optional spoken notes with approved sample material only.
6. Return to analysis and explicitly authorize cloud analysis only for public/synthetic/de-identified material. Click **Analyze image**. If the model is unavailable, local QC and manual annotation still work.
7. Use manual seed/polygon/measure tools. Never report a mm measurement without an operator-supplied verified calibration distance.
8. Open **Review & Evidence** and complete anatomy prompts, photo completeness and per-finding decisions.
9. Add a research section such as A1, link it to the overview or manually chosen region, enter the reason and mark PA verified. Export CSV.
10. Click **Build draft from verified data**; confirm the description includes only confirmed information and lists verified cassette sections. Export review JSON, inspect \`case_views\`, \`section_mapping\` and \`privacy_mode\`.
11. Toggle **Local review only**. Confirm **Analyze image** is disabled, **Run local QC** remains available, and Clippy input / speech requests are blocked until re-enabled. This is not a claim of offline inference.
12. Open **Models & Setup**. Confirm the active provider label matches \`/api/health\`; the new MiniMax/Kimi service cannot be considered tested without a real key and side-by-side PA benchmark.

## Technical boundaries and next sponsor-dependent tasks

**200-MP imaging:** obtain PathCam/Capture DX source images, pixel format, orientation, scale calibration, image pyramid/tile API and camera SDK. Test memory budget, tile caching, zoom coordinate transforms, color profile consistency, ROI exports and lossless provenance on genuine 200-MP captures.

**Training / segmentation:** choose one organ and one anatomically defined target; obtain permission-cleared source photos with expert-reviewed masks, specimen-level train/validation/test splits, a SAM/MedSAM baseline, and measured Dice, IoU, class sensitivity and false-positive burden. Mopec's NVIDIA DGX Spark cluster access remains a dependency.

**Clinical knowledge:** retrieve dated, institution-controlled CAP/AAPA/lab SOP passages by version and approval status; test citation accuracy and cases with no answer. Do not encode simplified disease staging thresholds from meeting conversation as clinical rules.

**Model selection:** check exact MiniMax/Kimi versions with Mike and compare them with the same source-labeled gross images and blind PA review. See [CLIPPY_MODEL_SETUP.md](CLIPPY_MODEL_SETUP.md). The existing production Groq key remains the default until a tested alternative is configured.

**Capture DX integration:** request sandbox credentials for \`ltu.pathologize.com\`, Case/Specimen/AI Analysis/Evidence API contracts, SDK/webhook event schema, user-permission model and handling of PHI. Geo should review export structure and interface specifications before production integration.

**Security:** no public patient data, no credential keys in the repository, protected access before enabling billed models, real rate limits and organization-specific deployment reviews. For clinical use, isolated storage, authentication, audit trails, licensing and local/approved inference remain unbuilt.

## Quick technical regression checks

- \`npm test\` (Node 22+)
- \`node --check docs/workstation-v14.js\`
- \`node --check src/worker.js\`
- \`/api/health\` reports model *configuration*, not successful inference
- Live UI checks on a public specimen: filmstrip, QC, native crop, cassette form, export, Clippy toggle and local-review mode

### Development definition of done

A UI affordance counts as implemented only when its control, state transition, output and error path are tested. A clinical ML feature counts as validated only with approved test labels and an independently reported evaluation. Anything awaiting Mopec data, clinical approvals or credentials stays explicitly marked as pending.
