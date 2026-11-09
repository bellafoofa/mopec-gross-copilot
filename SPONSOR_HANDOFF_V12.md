# Capture DX / LTU sponsor handoff — November 6, 2026 meeting

**Prototype:** https://mopec-gross-copilot.isabellachandler169.workers.dev/

**Purpose:** modular research components for possible review by Geo and eventual Capture DX integration. The public website is not Mopec's clinical product.

## Sponsor feedback → implementation

| Sponsor request | Demonstrated now | Requires sponsor access / validation |
| --- | --- | --- |
| Capture DX-style cases and image workflow | Case queue, image analysis, evidence review, source labels, Clippy; new compact Current case inspector | Capture DX patient/specimen schemas, persistent records |
| Hands-free grossing workflow | New push-to-talk/typed workflow commands; existing notes and chat dictation | Hospital-approved speech stack, offline speech and hardware testing |
| Barcode intake and camera | Browser camera preview, synthetic barcode recognition, demo case prefill | Station camera SDK, validated patient record lookup and permissions |
| Key stage-relevant anatomy | Kidney sinus/venous/perinephric, breast measurement/margin, prostate section mapping; reviewer prompts and Clippy question shortcuts | Verified specimen labels, current CAP protocols, expert assessments |
| Better gross anatomy model | Existing Groq vision as default; evaluate sponsor-recommended models later | Mike's exact MiniMax and Kimi/Moonshot vision models, endpoint and credentials |
| Train tissue-specific vision model | Review and annotation exports; optional reference-mask Dice/IoU; training-candidate manifest | Expert-labeled data, rights, DGX Spark VPN and compute, held-out evaluation |
| Pathologize extension | Modular PA workflow and export in repository | LTU test access, APIs, integrator handoff and secured deployment |
| Strict offline lab settings | Image editing works browser-local | Onsite licensing, secure storage and local model inference (not active) |
| 200-MP pathology imaging | Original image viewer, resize and measurement prototypes | Tile pipeline, memory tests, calibrated camera reference |
| Research SOP QA | Draft source-linked protocol content, editable reviewer checklist | Official controlled institutional SOP documents and PA review |

## v12: new interaction design

- An optional right-hand **Current case inspector** inspired by the active-case panel visible in Capture DX screenshots. It shows synthetic accession, current image/source, QC, AI candidate count, PA review status and navigation shortcuts. It hides while Clippy is open.
- A compact header **Hands-free** command panel that accepts a single voice or typed command at a time: open analysis, run analysis, zoom, show overlay, open review, open Clippy, dictate a note, request a camera frame or synthetic barcode scan. It never starts a microphone automatically.
- A collapsible **Anatomy & staging-relevant review questions** section inside PA review. Questions are sent to Clippy only when a user chooses to submit; the model does not assign tumor stage or reduce sampling.
- Earlier v11 tools remain, including seed/polygon masks, operator-entered scale, case review, model-correction notes, and validation exports.

## Responsible interpretation

- This is a public research interface: **do not enter real patient identifiers or restricted clinical images**. Synthetic IDs only.
- Browser speech recognition may transfer audio to an external transcription service. The UI warns users and supports typed commands if speech is unavailable.
- Visual-support percentages are **uncalibrated model estimates**, not disease probabilities. Colored masks and candidate boxes are not validated tumor boundaries.
- A gross photograph cannot establish microscopic renal sinus fat invasion or assign clinical cancer stage. Check exact thresholds against up-to-date CAP/AJCC guidance rather than treating interview examples as verified rules.
- No real Epic/LIS connection, Pathologize API, approved SOP enforcement, CPT coding, offline licensing, or secure multiuser clinical audit system is implemented.

## Model and pipeline validation plan

1. Obtain exact MiniMax and Kimi model IDs and allowed image input mechanisms; they are distinct providers.
2. Freeze one permitted specimen-level gross photo evaluation set and obtain separately reviewed labels/masks where available.
3. Run the same images and structured prompts across Groq, MiniMax, and Kimi. Track organ identity, feature relevance, false localizations, image quality, abstention and latency.
4. Blind PA review; report false positives, omitted cues and segmentation IoU/Dice against genuine reference masks. Separate visual support scores from calibrated diagnostic confidence.
5. Evaluate a tissue-specific SAM/MedSAM baseline before training on authorized Mopec material using the DGX Spark cluster.
6. Prepare a versioned JSON interface contract and testing plan for Geo before any live Capture DX integration.

## Questions for Mike, Roseanne and Geo

- Which 3–5 PA tasks should be streamlined first after the planned naturalistic lab observation?
- Can the team access the LTU-specific Pathologize sandbox and its Case, Specimen, AI Analysis and Evidence API contracts?
- Which barcode symbologies, scanner/camera hardware, metadata fields and offline constraints matter?
- Which organ and anatomy criteria should become the *first* expert-labeled proof of concept?
- What are the de-identification rules, data-use permissions, VPN setup and GPU resources for DGX Spark?
- Which controlled CAP/AAPA or local SOP documents may be used in the retrieval corpus?
- What source-code license and handoff format does Mopec permit for student prototypes?
