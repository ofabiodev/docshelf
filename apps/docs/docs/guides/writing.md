---
title: Writing docs
description: Markdown first, with components when structure helps.
slug: /writing/
group: Guides
order: 1
---

## Markdown first

docshelf uses GitHub-flavored Markdown. Headings, lists, tables, links, images, blockquotes, and fenced code blocks work without extra syntax.

Every code block gets a copy button and is highlighted while the site is built. The published pages do not need a browser-side highlighter.

## Frontmatter

Frontmatter is optional. Use it for page metadata and page-level layout choices:

```md
---
title: API reference
description: The small API surface.
group: Reference
order: 1
sidebar_label: API
toc: true
layout: doc
---
```

See [Frontmatter](../reference/frontmatter.md) for the complete field list.

Run `docshelf check` before publishing. It reports unknown or mistyped frontmatter, links to missing pages, local assets that were not found, and unknown component names.

## Callouts

Use a directive when the message needs visual emphasis:

```md
::: tip title="Keep it close"
Put the important explanation next to the code.
:::

::: warning
This build removes the output folder before writing it again.
:::

::: callout type="danger" title="Do not share this"
Keep private credentials out of Markdown.
:::
```

The GitHub form also works:

```md
> [!NOTE]
> This is a normal Markdown callout.
```

Supported types are `note`, `tip`, `warning`, and `danger`.

## Accordion

```md
::: accordion title="Advanced configuration"
This starts closed.

It can contain normal Markdown.
:::
```

Add `open` after the title when it should start open.

## Tabs

Tabs contain nested `tab` blocks:

````md
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
````

## Code groups

Use `code` blocks inside a `code-group`:

````md
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
````

## Cards

```md
::: cards
::: card title="Install" href="getting-started.md" icon="rocket"
Create your first site.
:::

::: card title="Deploy" href="../deploy/index.md" icon="arrow-up-right"
Publish the static output.
:::
:::
```

The `href` can be a page link or a normal URL.

## Tables

Use one `table` component for API references, options, properties, and other structured data:

```md
::: table
| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `base` | string | empty | Deployment path |
| `search` | boolean | true | Shows client-side search |
:::
```

## Version badges

```md
::: version version="1.2.0" prefix="since"
:::
```

Use `version-badge` as an alias for `version`.

## Keyboard shortcuts

```md
::: shortcut keys="Ctrl+K" label="Open search"
:::
```

Shortcut buttons in the site and tabs can be used with a keyboard. Use `Arrow` keys, `Home`, and `End` to move through a tab list.

## Steps

```md
::: steps
1. Create a docs folder.
2. Add Markdown files.
3. Run the build command.
:::
```

## Images and video

```md
::: image src="/images/diagram.png" alt="Architecture" caption="The generated route flow"
:::

::: video src="/videos/demo.mp4" poster="/images/poster.png" caption="A short demo"
:::
```

Put the files in `public/`.

## Links between pages

Link to another Markdown file and docshelf turns it into a clean route:

```md
[Install](../getting-started/index.md)
```

Folders become URL segments. `docs/guides/install.md` becomes `/guides/install/`.
