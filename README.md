<p align="center">
  <img src=".github/assets/logo.svg" align="center" width="200" alt="docshelf logo">
  <h1 align="center">docshelf</h1>
  <p align="center">A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment.</p>
</p>
<br>

<p align="center">
  <a href="https://github.com/ofabiodev/docshelf/actions?query=branch%3Amain" rel="nofollow"><img alt="GitHub Actions Workflow Status" src="https://img.shields.io/github/actions/workflow/status/ofabiodev/docshelf/ci_test.yml?branch=main&event=push"></a>
  <a href="https://opensource.org/licenses/MIT" rel="nofollow"><img alt="License" src="https://img.shields.io/badge/license-MIT-brightgreen"></a>
  <a href="https://www.npmjs.com/package/docshelf" rel="nofollow"><img alt="NPM Downloads" src="https://img.shields.io/npm/dw/docshelf"></a>
</p>

## Why docshelf?

A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment.

docshelf turns Markdown files into a static documentation site. You keep writing files in a normal repository, run one command, and publish the generated folder to Cloudflare Pages, GitHub Pages, or any other static host.

The published site contains HTML, CSS, JavaScript, assets, search data, a 404 page, feeds, and metadata. It does not need an application server.

Read the [official documentation](https://ofabiodev.github.io/simple-theme) for the complete guide.

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

<table>
  <tr>
    <td>
      <strong>Transparency</strong><br>
      Transparency is a core pillar of my projects. AI is used as a supporting
      tool where it helps, mainly for code completion and translating technical
      documentation. The architecture, decisions, review, testing, and responsibility
      for the released code remain with the project owner.
    </td>
  </tr>
</table>

## Features

The status column keeps available and planned work in one list.

`✅` Included · `🗓️` Planned

| Area          | Status | Details                                                                                                                     |
| ------------- | :----: | --------------------------------------------------------------------------------------------------------------------------- |
| Output        |   ✅   | Static HTML, CSS, JavaScript, assets, a 404 page, and `.nojekyll`                                                           |
| Markdown      |   ✅   | GitHub-flavored Markdown, complete page frontmatter, tables, links, images, fenced code, and build-time syntax highlighting |
| Components    |   ✅   | Callouts, accordions, tabs, code groups, cards, tables, steps, version badges, keyboard shortcuts, images, and videos       |
| Branding      |   ✅   | Phosphor icons, inline SVG, and custom assets from `public/`                                                                |
| Search        |   ✅   | A generated client-side search index with keyboard navigation                                                               |
| Validation    |   ✅   | Frontmatter errors, broken links, missing local assets, and missing branding assets are reported by `docshelf check`        |
| CLI           |   ✅   | Five commands, readable errors, build summaries, browser opening, project detection, and CI environment values           |
| Watch mode    |   ✅   | Rebuilds Markdown, public assets, and TOML changes while ignoring generated and temporary files                           |
| Site data     |   ✅   | Multilingual routes, sitemap, RSS, robots.txt, canonical links, Open Graph, Twitter cards, and JSON-LD                      |
| Hosting       |   ✅   | Cloudflare Pages, GitHub Pages, Netlify, S3, or a plain file server                                                         |
| Redirects     |   🗓️   | Redirect configuration for moved pages                                                                                      |
| Authoring     |   🗓️   | Content includes and imports                                                                                                |
| Versioning    |   🗓️   | Versioned documentation sets                                                                                                |
| Customization |   🗓️   | Custom head and body hooks                                                                                                  |

## Start a site

Create a starter project:

```bash
npx docshelf init
npx docshelf dev
```

Open the local address shown in the terminal. The development server watches Markdown, public assets, and `docshelf.toml`, while ignoring generated output, dependencies, and temporary files.

When the site is ready:

```bash
npx docshelf build
npx docshelf preview
```

Publish the generated `dist/` folder.

## Publish the package

This repository uses Release Please and npm Trusted Publishing.

1. Create the npm package `docshelf` if it does not exist yet.
2. In npm package settings, add a GitHub Actions trusted publisher with:
   - account: `ofabiodev`
   - repository: `docshelf`
   - workflow filename: `cd_publish.yml`
   - allowed action: `npm publish`
3. In GitHub repository settings, allow Actions to create and approve pull requests.
4. Push commits to `main` using Conventional Commits, such as `fix: correct a link` or `feat: add a component`.

The workflow does not use an `NPM_TOKEN`. npm authenticates the publish job with a short-lived OIDC token. It also does not need a custom `PAT` for the normal flow because Release Please uses GitHub's built-in `GITHUB_TOKEN`.

A `feat:` commit creates or updates a Release Please pull request. It does not publish immediately. Merge that pull request to create the GitHub release and publish the package. `fix:` creates a patch release, `feat:` creates a minor release, and `!` marks a breaking change.

The package version lives in `packages/docshelf/package.json`, and Release Please writes the generated changelog beside it at `packages/docshelf/CHANGELOG.md`.

## Files

| File                     | Use                               |
| ------------------------ | --------------------------------- |
| `docs/index.md`          | Home page                         |
| `docs/guides/install.md` | `/guides/install/`                |
| `docshelf.toml`          | Optional site settings            |
| `public/`                | Static files copied to `dist/`    |
| `public/custom.css`      | Colors and small visual overrides |

## A page

````md
---
title: Getting started
description: Start here.
group: Start here
order: 1
---

## Install

Run the command:

```bash
npx docshelf init
```
````

`index.md` maps to `/`. Other Markdown files use their folder path. `group` creates a sidebar section and `order` controls its position. Add `draft: true` to leave a page out of the build.

## Frontmatter

Frontmatter is optional. These fields are supported:

| Field             | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `title`           | Page title and navigation label                       |
| `description`     | Page description and search metadata                  |
| `seo_title`       | SEO title without changing the visible title          |
| `seo_description` | SEO description without changing the page description |
| `group`           | Sidebar group, or `null` to leave it ungrouped        |
| `order`           | Sort order inside the sidebar                         |
| `slug`            | Custom route such as `/guides/install/`               |
| `home`            | Use the page as the home page                         |
| `draft`           | Exclude the page from the build                       |
| `sidebar`         | Show or hide the page in the sidebar                  |
| `sidebar_label`   | Use a different sidebar label                         |
| `toc`             | Override the table of contents for this page          |
| `breadcrumbs`     | Override breadcrumbs for this page                    |
| `page_navigation` | Override previous and next links                      |
| `layout`          | Set a page layout name such as `doc` or `showcase`    |
| `hide_title`      | Hide the generated page title and description         |
| `hide_footer`     | Hide the site footer on this page                     |
| `edit_link`       | Enable an edit link or provide a direct URL           |
| `last_updated`    | Show a generated date or provide a label              |
| `canonical`       | Set a canonical URL or `false` to omit it             |
| `og_image`        | Set a page-specific social image                      |
| `noindex`         | Prevent search engine indexing                        |
| `lang`            | Set the HTML language value                           |
| `author`          | Set the page author                                   |

Example:

```md
---
title: Installation
description: Install docshelf in a new project.
group: Guides
order: 1
slug: /install/
sidebar_label: Install
toc: true
breadcrumbs: true
page_navigation: true
layout: doc
---
```

## Components

Components are written in Markdown. They work during development and in the generated static site.

### Callouts

```md
::: tip title="Tip"
Keep important information near the code it explains.
:::

::: warning
Check the output before deploying.
:::
```

### Accordion

```md
::: accordion title="Advanced details"
This starts closed.
:::
```

Add `open` to start it expanded.

### Tabs

```md
::: tabs
::: tab npm

```bash
npm install docshelf
```

:::
::: tab Bun

```bash
bun add docshelf
```

:::
:::
```

### Code groups

```md
::: code-group
::: code label="npm" language="bash"

```bash
npx docshelf dev
```

:::
::: code label="Bun" language="bash"

```bash
bunx docshelf dev
```

:::
:::
```

### Cards

```md
::: cards
::: card title="Getting started" href="getting-started.md" icon="rocket"
Create a site.
:::
::: card title="Deploy" href="deploy/index.md" icon="arrow-up-right"
Publish the output.
:::
:::
```

### Tables, version badges, and shortcuts

```md
::: table

| Option | Type    | Default |
| ------ | ------- | ------- |
| base   | string  | empty   |
| search | boolean | true    |
| :::    |

::: version version="1.2.0" prefix="since"
:::

::: shortcut keys="Ctrl+K" label="Open search"
:::
```

### Steps, images, and videos

```md
::: steps

1. Create `docs/`.
2. Add Markdown.
3. Build the site.
   :::

::: image src="/images/diagram.png" alt="Architecture" caption="The route flow"
:::

::: video src="/videos/demo.mp4" caption="A short demo"
:::
```

Put image and video files in `public/`.

## Commands

| Command            | Use                                                              |
| ------------------ | ---------------------------------------------------------------- |
| `docshelf init`    | Create missing starter files and preserve existing project files |
| `docshelf dev`     | Build, serve, and watch                                          |
| `docshelf build`   | Write static HTML to `dist/`                                     |
| `docshelf preview` | Serve an existing build                                          |
| `docshelf check`   | Validate frontmatter, links, assets, and component names         |

Use `docshelf dev --open` to open the local site automatically. In CI, use `DOCSHELF_BASE`, `DOCSHELF_DOCS`, `DOCSHELF_OUT`, `DOCSHELF_PORT`, or `DOCSHELF_HOST` instead of adding build-only flags to scripts.

## Configuration

The configuration file is `docshelf.toml`:

```toml
[site]
name = "docshelf"
tagline = "A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment."
description = "A Markdown-to-static-HTML documentation system."
url = "https://docs.example.com"

[announcement]
text = "Minimal setup. Beautiful docs. Static deployment."
href = ""
tone = "default"

[branding]
title = "docshelf"
icon = "notebook"
logo = ""
logo_alt = "docshelf"
subtitle = ""

[icons]
enabled = true
library = "phosphor"
weight = "regular"

[theme]
default = "system"
respect_system = true
allow_toggle = true

[ui]
search = true
theme_toggle = true
footer = true
sidebar_footer = true

[navigation]
sidebar = true
sidebar_mode = "auto"
toc = true
breadcrumbs = true
page_navigation = true
edit_link = false
last_updated = false

[markdown]
syntax_highlighting = true
line_numbers = false
heading_anchors = true
smart_typography = false

[search]
enabled = true
provider = "local"
include_code = false
index = "search-index.json"

[paths]
docs = "docs"
output = "dist"
base = ""
custom_css = "custom.css"

[links]
   github = "https://github.com/ofabiodev/docshelf"
npm = "https://www.npmjs.com/package/docshelf"
edit = ""

[i18n]
enabled = false
default_locale = "en"
locales = ["en"]

[seo]
title_template = "%s · docshelf"
image = ""
description = ""
author = ""
twitter_card = "summary_large_image"
robots = "index,follow"
canonical = true
json_ld = true
generate_og_image = true

[feeds]
sitemap = true
rss = true

[validation]
broken_links = "error"
missing_assets = "error"
frontmatter = "error"
unknown_components = "warning"
```

Every section is optional. Defaults are used when a value is not present.

The icons section uses the official [Phosphor Icons Core](https://github.com/phosphor-icons/core) package. The selected SVG is inlined during the build. Set `icons.enabled = false` when the built-in icon library is not needed. To use an asset from `public/`, set `branding.icon = "logo.svg"`. The file is inlined when it is an SVG and used as an image for other supported assets.

Adding an `[announcement]` section enables the sticky announcement. Remove the section to remove it.

The `navigation`, `markdown`, `search`, and `validation` sections keep related settings together. Page-specific choices belong in Markdown frontmatter.

Colors do not belong in TOML. `docshelf init` creates `public/custom.css`, and this repository keeps the same editable template at `public/custom.css`. Change the variables there for both themes.

## Languages

Set the locales in `docshelf.toml`:

```toml
[i18n]
enabled = true
default_locale = "en"
locales = ["en", "pt-BR"]
```

Use one folder per locale:

```text
docs/
├── en/
│   ├── index.md
│   └── install.md
└── pt-BR/
    ├── index.md
    └── install.md
```

The default locale uses the root URL. Other locales receive a locale prefix such as `/pt-BR/install/`.

## Search, feeds, and SEO

The build writes the text of every published page to the configured client-side index, `search-index.json` by default. The browser ranks matches from titles, headings, descriptions, and page text. Set `search.include_code = true` when code should be searchable.

When `site.url` is set, the build can write:

- `sitemap.xml`
- `rss.xml`
- `robots.txt`
- canonical links
- language alternate links
- Open Graph and Twitter metadata
- JSON-LD article metadata

With `seo.generate_og_image = true`, docshelf creates an SVG social image for every page in `dist/og/`. Page frontmatter can override `og_image`, `canonical`, `noindex`, `seo_title`, and `seo_description`.

## Deploy

### Cloudflare Pages

| Setting                | Value            |
| ---------------------- | ---------------- |
| Build command          | `bun run build`  |
| Build output directory | `apps/docs/dist` |
| Root directory         | `/`              |

### GitHub Pages

Set Pages to GitHub Actions and use [.github/workflows/cd_pages.yml](.github/workflows/cd_pages.yml). The workflow passes the repository base path for project pages.

## License

[MIT](LICENSE) © [docshelf contributors](https://github.com/ofabiodev)
