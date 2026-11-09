# Feature status and next validation — Mopec LTU v11 (November 2026)

This is a **public/synthetic research prototype** built to inform a focused Capture DX feature handoff. It is not a replica of Mopec's internal codebase, does not use live hospital records, and cannot provide validated cancer staging or diagnosis. Mike and Roseanne's November 6 meeting is the primary user-needs reference.

## PA workflow modules

| Requirement / enhancement | Implemented in current public prototype | Still required for a clinical handoff |
| --- | --- | --- |
| 1. Better gross anatomy model | Working free Groq image-question and proposal endpoints; organ mismatch check | Exact sponsor-recommended MiniMax/Kimi models, credentials, benchmarking |
| 2. Actual image segmentation | Foreground heuristic, experimental seed-connected color mask, hand-drawn polygons, mask PNG export | Trained tissue-specific SAM/MedSAM model and expert-labeled gross masks |
| 3. Classify and detect candidate findings | Model-estimated organ/gross considerations and normalized bounding boxes | Frozen test cases, calibrated probabilities and failure analysis |
| 4. Stage-relevant anatomy QA | Renal, breast, prostate/general prompts with review statuses/notes | CAP version mapping, PA sign-off, case-specific sampling policy |
| 5. Reproducible dataset pipeline | Source/rights metadata, versioned dataset-candidate JSON, case-group split marked unassigned | Expert masks, use permissions, database versioning, DGX training |
| 6. Capture DX navigation alignment | Case → Capture → Analysis → Evidence flow, compact left nav | Pathologize UX research and approved design components |
| 7. Hands-free assistance | Browser dictation with explicit browser-service warning; voice navigation | On-prem audio recognition, noise/accuracy testing, privacy review |
| 8. Barcode/case intake | Browser synthetic DEMO-/SYNTHETIC- barcode capture | LIS integration and hospital-specific barcode mapping |
| 9. Clippy SOP RAG | Draft research guides and source-backed Groq answers | Institution-approved/dated SOPs and team Qdrant corpus evaluation |
| 10. PA annotation/review | Brush, erase, polygon, per-region decision and correction feedback | Persistent authenticated annotation store and expert consensus |
| 11. High-resolution image inspection | Zoom, pan, selected-ROI crop at higher effective detail | Tile/pyramid backend for 200 MP camera and native-image coordinates |
| 12. Capture DX module handoff | JSON evidence contract and standalone modular pages | Geo's API schema, authentication and extension deployment |
| 13. Offline/local AI | Local browser annotation works after files are loaded | Offline licensed models, hospital compute, approved secure data path |
| 14. Structured documentation | Reviewer-verified draft description and text export | Controlled transcription, field mapping and e-signature |
| 15. CPT review | **Not enabled** (AMA licensing and institutional workflow pending) | Licensed code sets, validated clinical coding process |
| 16. Uncertainty | N/A when unscored; visual-support disclaimers; source mismatch checks | Empirical calibration, uncertainty/abstention measurement |
| 17. Before/after segmentation | Viewer split slider original vs annotations | Formal multi-mask review and registered expert overlays |
| 18. Image QC | Sharpness/clipping/resolution heuristics and explicit PA acknowledgment | Calibrated thresholds, camera-specific reference sets |
| 19. Measurement calibration | PA supplies known ruler span to convert drawn pixels to mm | Camera calibration traceability, scale verification across 200 MP captures |
| 20. Error tracking | Per-proposal correction reason, preferred label and timestamp in case export | Central audit records and model-improvement feedback service |
| 21. Compare AI models | Import a second model's JSON boxes and calculate geometric overlap | Sponsor-approved model endpoints on same held-out dataset |
| 22. Orientation | Rotate/flip remains a future workflow consideration | Validate how Capture DX records orientation; preserve original image |
| 23. Gross description | Editable source/reviewer-derived draft | LIS/report templates and authorized signoff |
| 24. Image completeness | PA checklist for overview, orientation, scale, ROI and case match | Organ/site SOP requirement matrix and camera capture integration |
| 25. Contextual Clippy | Follow-up actions for region review, missing checks, SOP and ROI focus | Deep-linking to actual approved Capture DX case fields |
| 26. Keyboard/touch access | Keyboard shortcuts, contextual help and touch-capable viewer | Observational usability study on grossing station hardware |
| 27. Review timeline | In-memory event stream and research JSON export | Authenticated, immutable clinical audit log |
| 28. Validation dashboard | Case-local region decisions, acceptance ratio and overlap scores when paired mask exists | Multi-case train/validation/test splits and aggregate metrics |
| 29. Organ-aware workflows | Kidney/breast/prostate/general review prompts | Sponsor-approved case types and protocol mapping |
| 30. Multiuser collaboration | **Not enabled** | Authenticated roles, locking, database, assignment and second-review flow |
| 31. Recovery/offline resilience | Local browser-only work and export; basic capture recovery | Approved persistence, version conflict handling, interrupted-session tests |
| 32. Security and audit | API secrets remain in Cloudflare Worker runtime; external-image consent gating | Threat model, HIPAA/security review, roles, PHI access controls, retention and audit |

## How to exercise v11 without waiting for Mopec access

1. Open a public specimen in Cases or Image Library.
2. Analyze image and review the QC panel. This uses the **existing Groq service** and is subject to free provider quota.
3. In **Annotation & measurement tools**, trace a polygon; mark its review status. If a physical ruler is visible, use Measure and provide its verified length in millimeters. Do not assume arbitrary image distances are calibrated.
4. In **Experimental segmentation**, select **Seed mask**, click inside a region, adjust the color tolerance and export a binary PNG if useful. It is **not a trained cancer segmentation**.
5. Use the original/annotated split slider. Under **Review & Evidence**, mark QC reviewed, verify image completeness, document anatomy and correct model errors. Export the review JSON.
6. Optional expert-ground-truth task: open **Models & Setup**, upload a PNG reference mask of **exactly the same native image dimensions**, then compare *manual polygons* and the *seed mask* separately. The mask source and expert status must be verified before calling results research ground truth.
7. Optional model comparison: import `{"model":"MODEL_ID","case_id":"kidney-cysts","candidates":[{"label":"feature","box":[100,100,250,250]}]}`. Geometric box overlap does not measure disease correctness.
8. For the PA field study, start a simulated walkthrough, complete the case, and export observer notes and events. Do not record identifiable case data in this public demo.

## Engineering gates prior to deployment in a hospital

- **Data**: Mopec-approved de-identified corpus, organ/task definition, case-level split and expert region mask consensus.
- **Vision**: per-class sensitivity/specificity, lesion-level F1, patient/case-group held-out Dice and IoU, confidence reliability and false-negative review.
- **Workflow**: observed PA task-time and click-count comparisons, documentation completeness, recapture rate, voice-command recognition and fatigue/error evaluation.
- **RAG**: approved versioned SOPs, retrieval hit rate, citation correctness, abstention and contradiction tests.
- **Hardware**: embedded capture camera/barcode interface, 200 MP image tile/storage flow, workstation and offline behavior.
- **Security**: access control, audit storage, PHI boundaries, signed approved workflow integration with Geo and IT/compliance.

## What cannot be completed before sponsor supplies resources

Do **not** imply that Kimi/MiniMax are active, that pathology masks are trained or validated, or that `ltu.pathologize.com`, the DGX Spark cluster, LIS/Epic, real barcode patient lookups, licensed CPT coding or a secure hospital workstation are connected. Those require sponsor credentials, data-use permissions, model identification, integration schemas and approval.

## Code map

- `docs/workstation-core.js` — source-aware viewer, case loading, annotation rendering and exports
- `docs/workstation-analysis.js` — QC and visual model proposals
- `docs/workstation-workflow.js` — barcode, camera, browser dictation and SOP library
- `docs/workstation-chat.js` — collapsible Clippy context panel
- `docs/workstation-sponsor.js` — anatomy QA, PA walkthrough and training manifest
- `docs/workstation-imaging-v11.js` — polygon, calibration, QC acknowledgment, manual mask Dice/IoU
- `docs/workstation-segmentation-v11.js` — seeded color mask, PNG and reference comparison
- `docs/workstation-ops-v11.js` — model feedback, case timeline, focused UI, model box comparison and diagnostics
- `src/worker.js` — Groq and public data endpoints (keys never in browser JavaScript)
- `CAPTURE_DX_HANDOFF.md` — interface mapping questions for Geo

Normal future updates: modify and commit code in this GitHub repository; Cloudflare automatically deploys `main`. Do **not** change the runtime `GROQ_API_KEY` secret for routine UI releases.
