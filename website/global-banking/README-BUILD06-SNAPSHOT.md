# KINO BUILD 06 — public registry fallback

This new source-only integration preserves the BUILD 05 portal and adds the **full public research catalog** to the static fallback. It is a documentation snapshot, not a banking service, institution endorsement, API access, or proof of available funds.

## Generate and check

From `sonoraport-banking` repo root with Node 22+:

```sh
node website/global-banking/build-public-snapshot.mjs --generate
node website/global-banking/build-public-snapshot.mjs --check
node --test website/global-banking/*.test.mjs
```

The generator uses the repository's existing **read-only public research API sanitization** to build `public-registry-snapshot.json` from `data/global-banking-all-providers-registry.json`; 18 unverified historical records are excluded. The snapshot is checked for drift by CI. No credentials or customer balances are read. Visitors see a source snapshot whenever Netlify functions are not verified, and the page shows the difference from a responding API.

If the source catalog changes, regenerate and commit the snapshot. Do not mark it as live banking, replace the website's existing homepage or change Supabase financial tables. The website can only go live through the user's approved Netlify publication workflow; committing to GitHub alone does **not** prove Netlify deployment.