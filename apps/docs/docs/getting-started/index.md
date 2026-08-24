---
title: Getting started
description: Install docshelf and create a working documentation site.
slug: /getting-started/
group: Start here
order: 2
---

## Install the package

Use the package manager already used by your project:

| Package manager | Command |
| --- | --- |
| Bun | `bun add -d docshelf` |
| npm | `npm install -D docshelf` |
| pnpm | `pnpm add -D docshelf` |

For a one-off setup, use:

```bash
npx docshelf init
```

## Create the site

```bash
npx docshelf init
npx docshelf dev
```

`init` creates only files that are missing:

```text
docs/
  index.md
public/
  custom.css
docshelf.toml
.gitignore
```

If `package.json`, `docs/`, or `docshelf.toml` already exists, `init` detects it and preserves it. The development server rebuilds when Markdown files, `public/`, or `docshelf.toml` changes.

Open the browser automatically when starting development:

```bash
npx docshelf dev --open
```

## Add a page

Create `docs/hello.md`:

```md
---
title: Hello
description: Your first page.
group: Guides
order: 1
---

# Hello

Write the documentation your users need.
```

The file becomes `/hello/`. Folders become URL segments, so `docs/guides/install.md` becomes `/guides/install/`.

## Check and build

Run validation before the production build:

```bash
npx docshelf check
npx docshelf build
npx docshelf preview
```

`check` reports invalid frontmatter, broken page links, missing local assets, and unknown component names. Warnings can be configured in `docshelf.toml`.

## Publish

Upload the contents of `dist/` to a static host. See [Deploy](../deploy/index.md) for Cloudflare Pages and GitHub Pages settings.
