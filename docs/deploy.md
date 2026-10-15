# Deploying KiliSpatial

KiliSpatial builds to plain static files (`pnpm build` writes `build/`), so any static host works. **Cloudflare Pages** is a good default for this project:

- Free plan with unlimited bandwidth, which suits a map that may be shown at conferences or embedded on other sites.
- Global CDN, so the ~300 KB of route data and the app load quickly worldwide.
- Reads `static/_headers` (the `frame-ancestors` rule for `/embed`) with no extra setup.
- Free HTTPS and custom domains; preview builds for every branch.

Netlify and Vercel work the same way; GitHub Pages works too but ignores `_headers`, so you could not restrict who may frame `/embed`.

## Cloudflare Pages

1. Push the repository to GitHub.
2. Cloudflare dashboard, Workers & Pages, Create, Pages, Connect to Git, pick the repository.
3. Build settings:
   - Framework preset: None
   - Build command: `pnpm build`
   - Build output directory: `build`
   - Environment variables: `NODE_VERSION` = `22`, plus `VITE_SUPPORT_EMAIL` and `VITE_EMBED_ORIGINS` (see `.env.example`)
4. Edit `static/_headers` so `frame-ancestors` lists your own site(s), then deploy.
5. Add your custom domain under the project's Custom domains tab.

Deploy at the domain root (or a subdomain): data is fetched from `/data/...`.

## Before going public

- Check the Esri World Imagery terms for your use, or swap the imagery source in `Map3D.svelte`.
- Set `VITE_SUPPORT_EMAIL` so the Fund us button shows your contact.
- Ask a native Swahili speaker to review `src/lib/i18n/sw.ts`; the translations are a first draft.
