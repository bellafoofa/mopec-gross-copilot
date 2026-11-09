# Capture DX integration handoff — LTU workstation v10

## Scope from November 6 sponsor meeting

Mike and Roseanne said the existing prototype resembled Capture DX alpha and described an LTU goal of building localized features for Geo to incorporate later. The deliverable should be a focused AI Analysis + specimen intake + review module, not a duplicate of the entire administrative platform.

Sponsor staging environment: ltu.pathologize.com (credentials and supported APIs pending). No unauthorized integration is attempted. The existing Cloudflare version is for public/synthetic cases.

## Functionality map

| Workflow | Working in prototype | Awaiting Mopec |
| --- | --- | --- |
| Case intake | Demo case queue, synthetic IDs, public image selection | Authenticated case/record association |
| Capture | Browser camera, demo barcode scanner | Station 200 MP camera, autofocus and barcode integration |
| QC | Blur/resolution/clipping heuristics with inspect flags | Validation on station photos and formal QA thresholds |
| AI analysis | Groq Qwen vision hypotheses and candidate boxes | MiniMax/Kimi benchmark, trained gross tissue-specific models |
| Segmentation | Foreground contour + manual markup | Verified segmentation masks/labels and training data |
| Measurements | Pixel ruler | Verified physical scale and resolution metadata |
| Clippy | Image questions, draft reference guidance with citations | Institution-approved SOP RAG and a suitable dictation stack |
| Review | Per-region decisions, anatomy checks, JSON export | Capture DX integration, authenticated audit/approval |
| Compute | Cloudflare API inference for public photos | DGX Spark via approved Mopec VPN/local environment |

Important: source pathology labels are catalog metadata. AI visual-support percentages are subjective and not calibrated disease probabilities. A gross image does not independently establish histologic diagnosis or TNM stage.

## Export contract

Review & Evidence > Export review JSON produces schema ltu-mopec-capture-dx-handoff/1.0 with:
- case: synthetic ID, source attribution, organ metadata and rights
- image: native pixel dimensions
- qc: image-only heuristics and warning flags
- analysis: provider model ID, visible observations and candidate boxes as [x,y,width,height] in normalized 0-1000 coordinates
- manual_annotations: stroke points, pixel measurements and per-region decisions
- review: reviewer label, checked anatomic cues, note, editable draft
- integration_status: explicit no live connection

Geo should confirm field mappings, coordinate calibration, audit schema, roles, source hashing and API authentication before any live connector is built. This package invents no Capture DX API endpoints.

## Next inputs from sponsor

1. The exact sponsor-recommended MiniMax and Kimi vision model IDs, access modes, budget and license. Evaluate on the same held-out gross photos, including erroneous organ hypotheses, false regions, expert agreement, response time and cost. Keep working Groq default until verified.
2. Approved de-identified gross data, case-level splits, PA-reviewed masks, one tissue/task focus and NDA/data-use terms. Train on Mopec-approved DGX cluster only when configured.
3. At least one PA observation session to map barcode intake, images, dictation, QC, labeling, section selection and approval into a realistic task sequence.

## Important limits

- 200 MP files likely require tile/pyramid image storage and region-of-interest inference. Current demo displays regular images and resizes a derivative for external AI; it is not a 200 MP pipeline.
- Browser speech recognition can send audio to third-party recognition services. It is not a hospital-approved dictation system.
- Only DEMO-/SYNTHETIC- barcodes are accepted. No patient identifiers, medical record access, Epic, billing codes, or hospital security claims.
- Review exports are local downloads, not institution-controlled permanent storage.

## Next validation set

Check capture and review tasks with PA observers, false glare/blur QC alerts, source/image organ mismatches, inappropriate stage assertions, held-out mask Dice/IoU, reviewer acceptance/edit rates, reference retrieval with abstention, and any failure to retain source/model/version in exported records.

## v10.1 sponsor-directed extensions

- **Priority anatomy review:** `docs/workstation-sponsor.js` adds a specimen-specific PA checklist (kidney renal sinus/perinephric/vascular interfaces, measurements, collecting system; breast margins/size/skin/nodes). Each item records *not reviewed*, *no concern noted*, *follow-up required*, *not assessable in image*, or *not applicable*, plus a reviewer note. These are **verification prompts**, not automatic cancer-stage decisions.
- **Clippy ROI focus:** The active, user-selected model bounding box can be cropped at a higher effective resolution from the original image for a single Clippy question. The cropped question is annotated with the ROI context; it does not represent a 200 MP tiled model or validated lesion mask.
- **Dataset candidate export:** `Models & Setup → Export current case manifest` emits `ltu-capturedx-dataset-candidate/1.1` with source, rights status, QC, candidate locations, human decisions and case-level split unset. It does **not** include expert masks or training permissions.
- **PA task observation:** `Review & Evidence → PA walkthrough & workflow observation` times an opt-in simulated workflow session and exports a local usability log without uploading identifying information. The lab observation still requires site approval and professional consent.
- **Hands-free navigation:** More voice phrases route to Cases, Review, Evidence, Library and Models; spoken commands cannot approve clinical findings.
- **Export:** Existing review JSON now includes priority-anatomy statuses and capture notes. Any integration into Capture DX must map these to Mopec's actual schema with Geo.

The prototype's Groq key stays in the **Cloudflare runtime secret**; the sponsor-recommended exact MiniMax/Kimi identifiers, `ltu.pathologize.com` access and the DGX/VPN training environment are still pending. Do not commit these credentials or Mopec clinical data to this public repository.
