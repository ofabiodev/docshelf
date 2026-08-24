---
title: Deploy anywhere
description: Ship the same dist/ folder to Cloudflare Pages or GitHub Pages.
slug: /deploy/
group: Guides
order: 4
---

## Cloudflare Pages

Create a Pages project from this repository and use:

| Setting | Value |
| --- | --- |
| Build command | `bun run build` |
| Build output directory | `apps/docs/dist` |
| Root directory | `/` |

Cloudflare Pages only needs the generated folder. For a direct upload with Wrangler:

```bash
npx docshelf build
npx wrangler pages deploy dist --project-name my-docs
```

## GitHub Pages

This repository includes a workflow at `.github/workflows/cd_pages.yml`. It builds with the repository name as the base path, uploads `apps/docs/dist/` as the Pages artifact, and deploys it on pushes to `main`.

To use it in your docs repository:

1. Copy the workflow file.
2. In repository settings, set Pages → Source to **GitHub Actions**.
3. Push to `main` or run the workflow manually.

The generated site is static, so it also works with the branch-based `docs/` source if you prefer to publish prebuilt files yourself.

## Any static host

```bash
npx docshelf build
```

Upload the contents of `dist/`. That is the portable contract.

Set `site.url` in `docshelf.toml` before a production build when you want absolute canonical links, `sitemap.xml`, `rss.xml`, `robots.txt`, and social image URLs.

> [!TIP]
> If a host serves your site below a path, pass `--base /that-path` during the build. Root domains use the default empty base.
