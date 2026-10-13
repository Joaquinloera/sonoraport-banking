# KINO #281102 — BUILD 06 Netlify isolated draft deployment

This deliverable **does not publish to `sonoraportaiholdingllc.com`**. The live main site is a different Netlify project (`sonoraportaiholdingllc13`), with a manual drop deployment (no Git commit associated with the published deploy). Do not replace that site with the `sonoraport-banking` repository homepage or assume GitHub pushes update it.

The separate Netlify project `sonoraport-banking` is `15b849d7-b776-4e6b-a3e6-06b0e3b25f66`. An actual published deployment has not been confirmed. This process prepares a **draft-only**, static research site for that project, using an allowlist. It does not deploy real SWARM agent executors or connect payment rails.

## What the build does

- Verifies the existing 178-entry source registry produces exactly 160 sanitized **public research entries**; the 18 unverified historical entries remain excluded.
- Keeps 19 developer-research records and 19 regional teams available to the public portal.
- Copies only six approved static portal assets into an isolated output folder, plus a dedicated preview landing page and security headers. **No serverless functions**, financial databases, API keys, account data, source archives, or unrelated repository files are included.
- Enforces source safety, rejects private account fields and false assertions of active bank connections, and never overwrites the repository or other deploy folders.
- Produces a verified artifact through GitHub Actions on each relevant push.

## Local verification

From the `sonoraport-banking` checkout with Node.js 22+:

```sh
node website/global-banking/build-public-snapshot.mjs --check
node --test deployment/build-banking-preview.test.mjs website/global-banking/*.test.mjs
node deployment/build-banking-preview.mjs --output /tmp/kino-public-banking-draft
```

## How a Netlify draft preview is authorized

The GitHub workflow `.github/workflows/kino-build06-netlify-draft-preview.yml` packages the static site automatically but **never deploys automatically**. For a manual draft, the project owner must configure a repository Actions secret named `NETLIFY_AUTH_TOKEN` with authorization for the separate banking Netlify project and manually run **KINO BUILD06 Banking Portal Draft Preview** using **Run workflow**. The deploy command intentionally omits `--prod`; the draft URL and Netlify deployment receipt are preserved as a GitHub Actions artifact. A missing secret blocks the draft rather than producing an invented success.

Production publication is a separate action requiring confirmation and a working preview. It must not replace the main SonoraPort homepage. In the meantime, the existing research portal's 160-entry public snapshot remains a GitHub-managed documentation source—not a bank account service or a claim of real financial access.

## Explicit limitations

- The 144 entries in the agent registry define logical specialist roles; this static website does not deploy 144 hosted agents.
- TinyFish server access, Supabase staging queue activation and paid/authorized provider onboarding are separate prerequisites for real distributed research execution.
- Source research for international payment networks does **not** establish production bank partnerships or payment authority.
