---
title: Frontmatter
description: Control page metadata, navigation, layouts, and SEO from each Markdown file.
slug: /frontmatter/
group: Reference
order: 2
---

Frontmatter is the YAML-like block between the first two `---` lines of a Markdown file. It is optional, but it is the easiest way to customize one page without changing the whole site.

## Complete example

```md
---
title: Installation
description: Install docshelf in a new project.
group: Guides
order: 1
slug: /install/
home: false
draft: false
sidebar: true
sidebar_label: Install
toc: true
breadcrumbs: true
page_navigation: true
layout: doc
hide_title: false
hide_footer: false
edit_link: true
last_updated: true
canonical: https://docs.example.com/install/
og_image: /images/install-og.png
seo_title: Install docshelf
seo_description: Install the documentation generator.
noindex: false
lang: en
author: Fabio Oliveira
---
```

## Page identity

| Field | Type | Description |
| --- | --- | --- |
| `title` | string | Page title and default sidebar label |
| `description` | string | Page description, metadata, and search result text |
| `seo_title` | string | Title used in SEO metadata while keeping the visible title unchanged |
| `seo_description` | string | Description used in SEO metadata while keeping the page description unchanged |
| `group` | string or `null` | Sidebar group. The default is `Guides` |
| `order` | number | Sort order inside the sidebar. The default is `999` |
| `slug` | string | Custom route. `/install/` becomes the page URL |
| `home` | boolean | Makes the page the home page |
| `draft` | boolean | Excludes the page from generated output |
| `lang` | string | HTML language value for this page |
| `author` | string | Page author for metadata and JSON-LD |

## Navigation

| Field | Type | Description |
| --- | --- | --- |
| `sidebar` | boolean | Shows or hides the page in the sidebar |
| `sidebar_label` | string | Short label used only in the sidebar |
| `toc` | boolean | Overrides the global table of contents setting |
| `breadcrumbs` | boolean | Overrides the global breadcrumbs setting |
| `page_navigation` | boolean | Overrides previous and next page links |
| `layout` | string | Adds a layout class such as `doc` or `showcase` |
| `hide_title` | boolean | Hides the generated title and description block |
| `hide_footer` | boolean | Hides the footer on this page |
| `edit_link` | boolean or string | Uses the configured edit URL or a direct URL |
| `last_updated` | boolean or string | Shows the file date or a custom update label |

## SEO

| Field | Type | Description |
| --- | --- | --- |
| `canonical` | string or `false` | Overrides or removes the canonical URL |
| `og_image` | string | Page-specific Open Graph image |
| `noindex` | boolean | Adds `noindex,follow` to the robots metadata |

## Draft pages

Draft pages are available while you write them locally, but they are not included in the generated site or search index:

```md
---
title: Internal release notes
draft: true
---
```

Their frontmatter is still checked by `docshelf check`.

## Validation

Run:

```bash
npx docshelf check
```

The command reports unknown fields, duplicate keys, invalid types, empty titles, broken links, missing assets, and unknown component names.
