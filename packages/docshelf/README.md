# docshelf

Static documentation from Markdown, with a small setup and output that works on any static host.

<p>
  <a href="https://github.com/ofabiodev/docshelf/actions?query=branch%3Amain"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/ofabiodev/docshelf/ci_test.yml?branch=main&event=push"></a>
  <a href="https://opensource.org/licenses/MIT"><img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen"></a>
  <a href="https://www.npmjs.com/package/docshelf"><img alt="NPM Downloads" src="https://img.shields.io/npm/dw/docshelf"></a>
</p>

docshelf turns a folder of Markdown files into static HTML, CSS, JavaScript, search data, feeds, and metadata. The generated site does not need an application server.

Read the [official documentation](https://ofabiodev.github.io/docshelf/) for the complete guide.

## Installation

<table>
<tr>
<td width="300">

```bash
# Using Bun
bun add -d docshelf
```

</td>
<td width="300">

```bash
# Using npm
npm install -D docshelf
```

</td>
<td width="300">

```bash
# Using pnpm
pnpm add -D docshelf
```

</td>
</tr>
</table>

## Create a site

```bash
npx docshelf init
npx docshelf dev
```

`init` creates missing starter files. It keeps existing `package.json`, `docs/`, and `docshelf.toml` files, and adds a small `.gitignore` when needed.

The development server watches Markdown files, `public/`, and `docshelf.toml`. It ignores generated output, dependencies, and temporary files.

## Commands

| Command | Purpose |
| --- | --- |
| `docshelf init` | Create missing starter files |
| `docshelf dev` | Build, watch, and serve the site |
| `docshelf build` | Generate static output in `dist/` |
| `docshelf check` | Validate frontmatter, links, assets, and components |
| `docshelf preview` | Serve an existing `dist/` folder |

Useful options:

```bash
npx docshelf dev --open
npx docshelf dev --port 4173 --host 127.0.0.1
npx docshelf build --base /my-repository
npx docshelf build --docs content --out public-site
```

For CI, use `DOCSHELF_BASE`, `DOCSHELF_DOCS`, `DOCSHELF_OUT`, `DOCSHELF_PORT`, or `DOCSHELF_HOST`. Command-line options take priority.

## Project files

```text
docs/
├── index.md
└── guides/
    └── install.md
public/
├── custom.css
└── images/
docshelf.toml
```

Markdown files become clean routes. `docs/index.md` becomes `/`, and `docs/guides/install.md` becomes `/guides/install/`.

## Markdown

docshelf supports frontmatter, GitHub-flavored Markdown, tables, links, images, fenced code blocks, automatic syntax highlighting, and reusable blocks:

- Callouts
- Accordions
- Tabs
- Code groups
- Cards
- Tables
- Steps
- Version badges
- Keyboard shortcuts
- Image and video blocks

Example:

````md
---
title: Getting started
description: Start here.
group: Start here
order: 1
---

::: tip title="One command"
Run `docshelf init` to create a starter site.
:::
````

## Validation

Run the checker before publishing:

```bash
npx docshelf check
```

It reports invalid frontmatter, links to missing pages, missing local assets, missing branding assets, and unknown component names. External URLs are left alone.

## Configuration

Use `docshelf.toml` for site-wide settings:

| Section | Purpose |
| --- | --- |
| `[site]` | Site name, description, and URL |
| `[announcement]` | Optional sticky announcement |
| `[branding]` | Header title and icon |
| `[theme]` | Light, dark, or system mode |
| `[navigation]` | Sidebar, breadcrumbs, table of contents, and page links |
| `[markdown]` | Highlighting, line numbers, and heading anchors |
| `[search]` | Generated client-side search index |
| `[seo]` | Canonical links, JSON-LD, robots, and social metadata |
| `[validation]` | Error, warning, or ignore behavior |

Use `public/custom.css` for colors and visual changes. Set `branding.icon` to a Phosphor icon name or an asset such as `logo.svg` from `public/`.

## Deploy

Build the static site and upload `dist/` to your host:

```bash
npx docshelf build
```

The output works with GitHub Pages, Cloudflare Pages, Netlify, S3, or a plain file server.

## License

MIT. See [LICENSE](LICENSE).
