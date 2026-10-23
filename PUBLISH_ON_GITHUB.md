# Publish Mopec Gross Tissue Copilot for your LTU project team

This package contains the **free vision-AI** edition. Your teammates do not need Python, a paid ChatGPT account, or personal API keys.

## Overview

- **GitHub** keeps the editable software code.
- **Cloudflare Pages** serves the website and runs the private `/api/ask` function.
- **OpenRouter Free** supplies NVIDIA Nemotron 3.5 Super VL vision/text AI, with `openrouter/free` fallback if the specific endpoint is unavailable.
- The OpenRouter key is entered **once by you**, using Cloudflare's **encrypted Variables and Secrets** settings, *never committed to GitHub*.
- Static browser features (public image, heuristic foreground segmentation, mask painting, local SOP drafts) work without the key, but AI calls do not.

## PART A — Create GitHub repository (5–10 minutes)

1. Download and **extract** `Mopec_Gross_Tissue_Copilot_Free_Shared_v7.zip`.
2. Open https://github.com/new and sign in.
3. Repository name: `mopec-gross-copilot` (or similar). Set it **Public** for a freely accessible demo. Create the repository.
4. In the new empty repository, click **uploading an existing file** (or **Add file > Upload files**).
5. Open the extracted `mopec-gross-copilot-free` folder. Drag its **contents** into GitHub, not the folder itself. At the repository root you should see:

   ```
   docs/
     index.html
     config.js
     research_guides.js
   functions/
     api/
       ask.js
       health.js
       specimen.js
     guides.js
   README.md
   PUBLISH_ON_GITHUB.md
   RESEARCH_SOP_DRAFTS.md
   .gitignore
   package.json
   tests/
   ```

   **Important:** If `docs/` and `functions/` are nested inside an extra folder, Cloudflare Pages won't find them with the settings below. Move them to repository root.
6. Click **Commit changes**. The repository code is now shareable at `https://github.com/YOUR-USERNAME/mopec-gross-copilot`.

## PART B — Get the free OpenRouter key (one-time owner setup)

1. Sign in to https://openrouter.ai/keys and create an API key.
2. Copy it somewhere private. **Never put it in `config.js`, `index.html`, your repository, or a chat message.**
3. The package defaults to the zero-token-cost model `nvidia/nemotron-3.5-super-vl:free`.

As of October 22, 2026, OpenRouter's normal free tier allows approximately **50 requests per day**. This is a shared limit for the entire project if every teammate uses the same key. Availability is not guaranteed and these endpoints are for low-volume research. Free NVIDIA endpoints can log inputs for product improvement: **public or explicitly permitted research images only, never patient data**.

## PART C — Publish a real website with no visitor setup

1. Open https://dash.cloudflare.com/ and create a **free Cloudflare account**.
2. Go to **Workers & Pages** and create a new **Pages** project from **Connect to Git** / **Import a Git repository** (the wording can vary).
3. Connect GitHub and select `mopec-gross-copilot`.
4. Set these values:
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: leave blank (or `exit 0` if a command is required)
   - Build output directory: `docs`
   - Root directory: repository root (leave blank or `/`)
5. Deploy. You should receive a URL like `https://mopec-gross-copilot.pages.dev`. This is the normal website link to send your project partners.
6. In the Cloudflare project, open **Settings > Variables and Secrets > Add**.
7. Add variable name **`OPENROUTER_API_KEY`**, paste the key, select **Encrypt / Secret** and save. Set it for **Production** (and Preview if you want preview AI).
8. **Redeploy** the latest production deployment so the Pages Function receives the new secret.
9. Visit `https://YOUR-PROJECT.pages.dev/api/health`. It should report `configured: true`. The key itself is not exposed.
10. Open the homepage, choose **Clippy**, and ask: "Describe the visible gross morphology of this kidney specimen and explain what needs PA review." It should show **Free vision AI · online** when configured. Your partners only visit the site URL.

> Cloudflare Pages Functions use the `/functions` directory at project root. If your Cloudflare plan or UI offers Workers rather than Pages by default, select the option to import a Pages project from your Git repository.

## PART D — Share the link

Copy your exact site URL from Cloudflare. Example format (not a live assigned link):

`https://YOUR-PROJECT.pages.dev`

You can email or message the URL; you do **not** need to send a ZIP, executable, or API key. GitHub and Cloudflare rebuild automatically when you push updates.

## Optional: GitHub Pages only (no cloud AI)

In your repository: **Settings > Pages > Deploy from a branch**; choose branch `main` and folder `/docs`, then save. You'll receive `https://YOUR-USERNAME.github.io/mopec-gross-copilot/`. This hosts **only the frontend**. Because GitHub Pages cannot execute backend functions or protect API secrets, Clippy uses local SOP guidance and **not** live vision AI. If you want one link that includes AI, share the Cloudflare URL instead.

## Troubleshooting

- **AI not configured:** Verify the production secret name exactly `OPENROUTER_API_KEY`; redeploy the Cloudflare production site.
- **AI rate limited:** The free OpenRouter quota is shared; try later or use the local SOP guidance. Do not add the API key to the website to work around it.
- **Public image missing:** Open the CDC source photo from the Sources tab and import a locally downloaded copy. The proxied thumbnail or Wikimedia may be temporarily unavailable.
- **HTTP 404 on `/api/ask`:** Your Cloudflare project is probably deploying static `docs` without the root `/functions` folder. Check repository hierarchy and build root.
- **Images can't be analyzed:** CORS may block canvas access if the public media proxy fails. The demo will say so and supports a local file upload.
- **The free AI guesses a diagnosis:** A vision-language model's observations are not a validated tissue-specific tumor classifier. The app displays separate model provenance and SOP draft sources.
- **GitHub won't allow upload of a folder:** Drag individual folders/files using Chrome/Edge, or use GitHub Desktop to commit the folder in one step.

## Model / dataset caveats

The bundled CDC caption is **prior source metadata**, not a prediction. Classical browser segmentation is **tissue/background suggestion**, not disease or tumor segmentation. The app contains **seven student research draft SOPs**; they are not formal LTU/Mopec/hospital approvals. For actual confidence scores, train and validate a tissue-specific model on expert reviewed held-out images. This free vision model supplies supporting narrative, not calibrated clinical percentages.
