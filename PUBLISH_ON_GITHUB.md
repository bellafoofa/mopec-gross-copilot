# Fix the existing Mopec Worker — GitHub and Groq Free

This guide is for an existing Cloudflare **Worker** named `mopec-gross-copilot`, with a URL such as `https://mopec-gross-copilot.<account>.workers.dev`.

## Step 1 — Update the already connected GitHub repository

1. Download the v7.1 Worker Fix ZIP and extract it using **Extract All**.
2. Open your existing repository: `https://github.com/bellafoofa/mopec-gross-copilot`.
3. Use **Add file → Upload files**, then drag the **contents** of the extracted folder, not the outer folder.
4. Make sure `wrangler.jsonc`, `package.json`, `src/worker.js`, `docs/index.html`, and `functions/guides.js` appear at the repository **root**. Do not upload API keys or `.env` files.
5. Click **Commit changes** on `main`. If GitHub cannot upload directories in your browser, use GitHub Desktop or Git.

If the repository already contains code in the same paths, replace the corresponding files. Commit once.

## Step 2 — Verify Cloudflare's Worker build settings

1. Cloudflare Dashboard → **Workers & Pages** → **mopec-gross-copilot** → **Settings** → **Build** (may appear as **Builds**).
2. Confirm GitHub repository: `bellafoofa/mopec-gross-copilot` and branch `main`.
3. Set **Root directory** to repository root (blank).
4. Set **Build command** to blank (no frontend build necessary).
5. Set **Deploy command** to `npx wrangler deploy`.
6. The `wrangler.jsonc` file sets the Worker name, entrypoint `src/worker.js`, and static assets directory `docs`, so you do **not** need a Pages build output directory.
7. Pushing to `main` should trigger a new build and deployment. Open the **Deployments** tab and confirm the latest version is Active/Ready.

## Step 3 — Verify the API route before setting a key

Visit your **actual** Worker URL with `/api/health` appended, for example:

`https://mopec-gross-copilot.<account>.workers.dev/api/health`

Expected JSON:

```json
{"configured":false,"provider":"Groq","model":"qwen/qwen3.8-27b","scope":"public research demo","validated_clinical_model":false}
```

If you still see **404**, check the deployed GitHub commit and whether the Worker was built using `wrangler.jsonc`. It means the backend change is not active yet. Do not troubleshoot the API key before the route exists.

## Step 4 — Add the free API key (once per project)

1. Create a **Free** account at `https://console.groq.com` and get an API key at `https://console.groq.com/keys`.
2. Cloudflare Dashboard → your Worker → **Settings → Variables and Secrets** → **Add**.
3. Variable name: `GROQ_API_KEY`.
4. Type: **Secret**. Paste the key as the value, and **Deploy** / save the updated version. Do not put it into GitHub or `docs/config.js`.
5. Reload `/api/health`. It should now show `"configured":true`.

Groq currently lists `qwen/qwen3.8-27b` as an image-enabled model. Free-tier quotas may change and are shared across your users. **No payment card should be needed when remaining on the advertised Free plan**, but do not upgrade if you want to avoid charges.

## Step 5 — Test live Clippy

1. Visit the main Worker URL without `/api/health`.
2. Open **Clippy** on the bottom right.
3. Ask: **"Describe the visible morphology of this gross kidney photograph and distinguish source labels from your own observations."**
4. A model response should include a model name and measured observations; this is unverified research assistance, not diagnostic ground truth.
5. If the response says **quota reached**, retry later; the viewer and research SOP library remain usable.

## Common issues

- **Homepage works but `/api/health` is 404:** static-only Worker deployed. Confirm code upload / Wrangler entrypoint.
- **`/api/health` shows `configured:false`:** missing Cloudflare runtime secret; adding a build variable is not enough.
- **`configured:true` but Clippy errors:** the model request failed, the key may be wrong or your Groq free-tier quota may be reached. Status of `configured:true` does not prove live connectivity.
- **Deploy says name mismatch:** Worker name in `wrangler.jsonc` must match existing Cloudflare Worker, namely `mopec-gross-copilot`.
- **Groq asks for payment:** remain on Free. Do not enter a credit card or upgrade just to test the school project.

Security note: this is a low-volume public research prototype with a single shared key; its website has no login or per-user quota. Do not use clinical data or expose source secrets to visitors.
