---
title: Configuration
description: Configure site behavior with a small docshelf.toml file.
slug: /configuration/
group: Guides
order: 2
---

## The config file

`docshelf.toml` is optional. `docshelf init` creates a complete starter file. Delete any section you do not need.

```toml
[site]
name = "My Docs"
tagline = "A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment."
description = "Documentation for my project."
url = "https://docs.example.com"

[announcement]
text = "New documentation is available"
href = "/getting-started/"
tone = "success"

[branding]
title = "My Docs"
icon = "logo.svg"
logo_alt = "My Docs logo"
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
github = "https://github.com/example/project"
npm = ""
edit = ""

[i18n]
enabled = false
default_locale = "en"
locales = ["en"]

[seo]
title_template = "%s · My Docs"
description = "Documentation for my project."
author = ""
image = ""
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

## Sections

| Section | Controls |
| --- | --- |
| `site` | Name, tagline, description, and public URL |
| `announcement` | Sticky announcement content. The section itself enables it |
| `branding` | Header title, subtitle, and icon or logo asset |
| `icons` | Phosphor availability and icon weight |
| `theme` | Default mode, system preference, and theme switch |
| `ui` | Search, theme button, footer, and sidebar footer |
| `navigation` | Sidebar, table of contents, breadcrumbs, and page links |
| `markdown` | Syntax highlighting, line numbers, heading anchors, and optional smart typography |
| `search` | Generated client-side search index |
| `paths` | Source, output, deployment base, and custom stylesheet |
| `links` | Project, npm, and source edit links |
| `i18n` | Locale folders and language switching |
| `seo` | Titles, descriptions, robots, canonical links, JSON-LD, and social images |
| `feeds` | Sitemap and RSS generation |
| `validation` | Error, warning, or ignore behavior for checks |

All sections are optional. The defaults are used when a section is missing.

## Announcement

There is no `enabled` property. Add the section to enable the bar:

```toml
[announcement]
text = "Version 1.0 is available"
href = "/getting-started/"
tone = "success"
```

Supported tones are `default`, `info`, `success`, and `warning`. Remove the whole section to remove the bar.

## Paths and GitHub Pages

Cloudflare Pages normally serves from the domain root, so leave `base` empty. GitHub Pages project sites use the repository name:

```bash
npx docshelf build --base /my-repo
```

The generated links and assets use `/my-repo/` without changing the Markdown source.

## Custom files

Put images, videos, fonts, a `CNAME`, a logo, or any other static file in `public/`. docshelf copies that folder into `dist/`.

The `custom_css` value is relative to `public/`:

```toml
[paths]
custom_css = "custom.css"
```

Keep `dist/` generated. Edit `docs/`, `public/`, and `docshelf.toml` instead.
