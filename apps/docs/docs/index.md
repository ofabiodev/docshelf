---
title: A dead-simple documentation framework
description: Minimal setup, beautiful design, and effortless deployment.
group: Start here
order: 1
home: true
---

docshelf turns a folder of Markdown files into a static documentation site. The source stays readable, the output is portable, and the generated pages work without an application server.

::: tip title="Start with one file"
Create `docs/index.md`, run `docshelf dev`, and edit the page in your browser.
:::

## The basic workflow

::: steps
1. Install `docshelf` in your project.
2. Run `docshelf init` to create the starter files.
3. Write pages in `docs/`.
4. Run `docshelf check` before publishing.
5. Build and upload `dist/` to your static host.
:::

::: cards
::: card title="Getting started" href="getting-started/index.md" icon="rocket"
Install the package and create your first page.
:::
::: card title="Writing docs" href="guides/writing.md" icon="note"
Learn Markdown, frontmatter, links, and components.
:::
::: card title="Configuration" href="guides/configuration.md" icon="gear"
Organize site settings in one TOML file.
:::
::: card title="Customize" href="guides/customize.md" icon="paint-brush"
Change the header, theme, icon, and interface.
:::
::: card title="Deploy" href="deploy/index.md" icon="arrow-up-right"
Publish to Cloudflare Pages, GitHub Pages, or another static host.
:::
:::

## What gets generated

The build produces HTML pages, the default stylesheet, the client-side search index, a 404 page, copied public files, optional sitemap and RSS files, robots metadata, and social images.

Read the [official documentation](https://ofabiodev.github.io/simple-theme) for the public guide and the [package source](https://github.com/ofabiodev/docshelf) for implementation details.
