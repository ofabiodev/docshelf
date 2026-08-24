# docshelf

`docshelf` is a dead-simple documentation framework with minimal setup, a quiet visual system, and static output that deploys anywhere. The generated site has no server dependency.

Read the [official documentation](https://ofabiodev.github.io/simple-theme) for the complete guide.

## Install

```bash
npm install -D docshelf
```

```bash
bun add -d docshelf
```

```bash
pnpm add -D docshelf
```

## Create a site

```bash
npx docshelf init
npx docshelf dev
```

`init` creates only missing starter files, detects an existing `package.json`, `docs/`, or `docshelf.toml`, and adds a small `.gitignore`. Edit Markdown while `dev` is running. The server watches Markdown, public files, and the TOML file while ignoring output, dependencies, and temporary files.

## Commands

| Command | Purpose |
| --- | --- |
| `docshelf init` | Create missing starter files |
| `docshelf dev` | Build, watch, and serve the site |
| `docshelf build` | Generate static output in `dist/` |
| `docshelf check` | Build and report invalid frontmatter, links, assets, and components |
| `docshelf preview` | Serve an existing `dist/` folder |

Useful options:

```bash
npx docshelf dev --port 4173 --host 127.0.0.1
npx docshelf dev --open
npx docshelf build --base /my-repository
npx docshelf build --docs content --out public-site
```

CI can set `DOCSHELF_BASE`, `DOCSHELF_DOCS`, `DOCSHELF_OUT`, `DOCSHELF_PORT`, or `DOCSHELF_HOST`. Command-line options take priority.

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

Markdown files become clean routes. `docs/index.md` becomes `/`; `docs/guides/install.md` becomes `/guides/install/`.

## Markdown features

The package supports frontmatter, GitHub-flavored Markdown, tables, links, images, fenced code blocks, automatic build-time syntax highlighting, and these optional blocks:

- callouts
- accordions
- tabs
- code groups
- cards
- tables
- steps
- version badges
- keyboard shortcuts
- image and video blocks

## Validation

`docshelf check` validates the published documentation before reporting success:

- Frontmatter keys and value types
- Links to generated pages
- Images, videos, posters, and other local assets
- Branding assets referenced from `docshelf.toml`
- Unknown component names

External URLs are left alone. Draft pages are checked for frontmatter but are not checked for links or assets because they are not published.

## Configuration

`docshelf.toml` controls global behavior. The main sections are:

| Section | Purpose |
| --- | --- |
| `[site]` | Site name, description, and URL |
| `[announcement]` | Sticky announcement. The section itself enables it |
| `[branding]` | Header title and Phosphor or custom asset icon |
| `[theme]` | Light, dark, or system mode |
| `[navigation]` | Sidebar, breadcrumbs, table of contents, and page links |
| `[markdown]` | Highlighting, line numbers, heading anchors, and optional smart typography |
| `[search]` | Generated client-side search index |
| `[seo]` | Canonical links, JSON-LD, robots, and social metadata |
| `[validation]` | Error, warning, or ignore behavior |

Page-specific settings belong in frontmatter:

```md
---
title: Installation
description: Install docshelf.
slug: /install/
sidebar_label: Install
toc: true
layout: doc
og_image: /images/install-og.png
---
```

Use `public/custom.css` for colors and visual changes. Use `branding.icon = "logo.svg"` when the header should use an SVG from `public/`.

## Development

From the repository root:

```bash
bun install
bun run check
bun run build
bun run dev
```

The package source is in `src/`. `tsc -p tsconfig.json` writes the publishable JavaScript and declaration files to `build/`. Tests live in `test/`.

## License

MIT. See [LICENSE](LICENSE).
