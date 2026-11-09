# Clippy model choices — Cloudflare Mistral, MiniMax, and Kimi

## Current default — Cloudflare Mistral AI (v15)

As of November 9, 2026, the deployed workstation uses **Mistral Small 3.1 24B Instruct** via the Cloudflare Workers AI binding (model ID `@cf/mistralai/mistral-small-3.1-24b-instruct`). The binding is declared in `wrangler.jsonc` under `ai.binding = "AI"`; visitors **do not obtain an API key**. The live research demo was tested on the publicly sourced CDC polycystic-kidney photograph: both **Analyze image** and **Clippy** returned usable responses after the switch.

Why it changed: the previous shared Groq account returned HTTP 429, indicating a provider usage limit. The site now favors Cloudflare AI automatically when its binding is present. **Cloudflare Workers Free includes a capped allocation of 10,000 Neurons/day; there is no promise of unlimited free requests**. If the Cloudflare account is on a paid plan, use beyond that allocation can incur charges. Check actual costs and daily limits in the Cloudflare dashboard. The app does not silently fall back to a potentially paid provider on rate limits.

- **Default routing:** `CLIPPY_PROVIDER` if explicitly set; otherwise Cloudflare Workers AI binding; otherwise configured MiniMax; otherwise configured Kimi; otherwise existing Groq.
- **Explicit model selection:** `CLIPPY_PROVIDER=cloudflare`, `minimax`, `kimi`, or `groq`. The alias `workers_ai` also selects Cloudflare.
- **Owner action:** none for the currently working Mistral binding. You may leave the existing Groq secret unused. Do **not** delete an existing secret or change paid billing settings without owner review.
- **Cloudflare-specific troubleshooting:** `/api/health` shows which model is bound but does not guarantee request quota; 429 means the model allocation or request limit was reached. Local image QC, manual masks, and PA review still work. If an error is displayed, the interface does not keep retrying automatically.
- **Model performance:** no externally validated lesion/disease confidence score, trained tissue-specific segmentation, or hospital-approved SOP is claimed. Current visual proposal percentages are uncalibrated estimates, not tumor probabilities.

Official references: [Workers AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/), [Mistral Small 3.1 model](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/), [free daily allowance and pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

---

**Status (November 9, 2026):** The Cloudflare Worker includes server-only OpenAI-compatible adapters for:
- **MiniMax M3.1 Flash** (default model ID `MiniMax-M3.1-Flash`; `https://api.minimax.io/v1/chat/completions`)
- **Moonshot/Kimi K3.1 Pro** (default model ID `kimi-k3.1-pro`; `https://api.moonshot.ai/v1/chat/completions`)
- Existing **Groq/Qwen** as an optional owner-selected fallback, no longer the default in production.

MiniMax and Kimi are **separate companies and APIs**. MiniMax API and Moonshot API calls are both typically billed. Cloudflare Workers AI offers a limited free daily allocation for eligible hosted models but Cloudflare Kimi K2.6/K2.7 require a paid method and are on a deprecation schedule. Never assume access, zero cost, patient-data authorization or medical-device validation.

### Activate one provider (project owner only)

1. **MiniMax:** obtain a key from https://platform.minimax.io/; go to Cloudflare Dashboard → Workers & Pages → `mopec-gross-copilot` → Settings → Variables and Secrets. Add a **Secret** called `MINIMAX_API_KEY`. Do not paste this key in GitHub, in chat, or into any frontend HTML/JS.
2. Add a **Text** variable `CLIPPY_PROVIDER` with value `minimax`. Optionally add `MINIMAX_MODEL` = `MiniMax-M3.1-Flash`.
3. Or **Kimi:** obtain a key from https://platform.kimi.ai/ and add secret `MOONSHOT_API_KEY`; set `CLIPPY_PROVIDER` = `kimi`. Optional `KIMI_MODEL` = `kimi-k3.1-pro`.
4. Check `https://mopec-gross-copilot.isabellachandler169.workers.dev/api/health`. It reports configured/provider/model but **does not make a model inference call**.
5. Test **one known public photograph** in Clippy and **Analyze image**. Confirm that text and image are actually processed; compare against verified anatomy.
6. If a MiniMax/Kimi account is unconfigured, remove `CLIPPY_PROVIDER` to return to the working Cloudflare AI binding. Groq can be explicitly selected only if the owner wants to use that account.

**No visitor needs to obtain or paste an API key.** The code never exposes a server key. *Do not enable a billed model on an unprotected public demo without a spending budget and practical rate limits.* Cloudflare provider settings and exact UI labels change occasionally; use the current dashboard.

### Routing rules and safeguards

- All API requests go through **server-side Worker functions**; the browser never receives private keys.
- The server selects the provider: explicit `CLIPPY_PROVIDER` > configured Cloudflare AI binding > configured MiniMax > configured Kimi > existing Groq. If the selected provider has no key, calls fail visibly rather than silently switching to a different paid service.
- Model URLs are fixed allowlisted endpoints; a browser prompt cannot supply a provider hostname.
- The **same** provider handles Clippy questions and preliminary gross image analysis (including normalized bounding-box proposals). Requests use `image_url` multimodal content parts.
- Image requests ask for valid JSON and remain subject to schema checks, normalization and source-organ mismatch detection.
- Responses are provisional research aids. Percentages are uncalibrated visual-support estimates and **not** probabilities of cancer.
- Error responses do not echo raw upstream error bodies or credentials.

### Sources and costs (verify again before purchasing)

- MiniMax official API: https://platform.minimax.io/docs/api-reference/text-openai-api
- MiniMax official pricing: https://platform.minimax.io/docs/pricing/overview
- Kimi official quickstart: https://platform.kimi.ai/docs/get-your-api-key
- Kimi visual input: https://platform.kimi.ai/docs/guide/use-kimi-vision-model
- Kimi price listing: https://platform.kimi.ai/docs/pricing/chat
- Cloudflare Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/

As of the research date, MiniMax-M3.1-Flash standard API pricing is **$0.15 per million input tokens / $0.60 per million output tokens**, excluding modality-specific token accounting and any other product fees; Kimi K3.1 Pro standard is **$2 / $10 per million** input/output tokens respectively. These are not promises of free use, and actual cost depends heavily on image size and reasoning/output tokens.

### Evaluation before selecting the better model

Freeze a held-out, permission-cleared **case-level** test set with source-provided organ labels, blinded PA review, and expert-verified regions/masks when possible. For each model run the *same photo and prompt*, and record:
- Organ/source agreement and number of confident wrong-organ answers;
- Relevant gross features, missed anatomical cues, false localizations, invented pathology/stage/measurements;
- Exact ROI coordinates, bbox IoU versus expert reference, and segmentation Dice only for an actual segmentation model;
- SOP citation validity, abstention when no authorized source exists;
- Response latency, timeout/retry rate, tokens and per-image cost;
- Reviewer preference and human correction rate.

**Separate roles:** a general vision LLM provides descriptions and candidate localizations. A validated tissue-specific segmentation model (SAM/MedSAM baseline plus expert training) must generate/validate lesion masks. A retrieved controlled SOP corpus supplies authoritative workflow instructions; Clippy should not invent them.

### Mopec dependencies

Mike offered to send exact preferred MiniMax and Kimi model IDs and gave access plans for DGX Spark/VPN and Pathologize APIs. Confirm those models and sponsor financing **before** purchasing or upgrading anything. Ask Geo about Capture DX contracts and add rate limits, auditing, authentication and privacy safeguards before any hospital trial.
