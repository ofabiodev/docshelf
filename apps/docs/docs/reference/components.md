---
title: Components
description: Every built-in component, shown with the Markdown that creates it.
slug: /components/
group: Reference
order: 1
---

docshelf keeps components optional. Use plain Markdown for most pages, then add a component when it makes the information easier to scan.

## Callouts

::: tip title="Tip"
Use callouts for short advice that should not get lost in the page.
:::

::: note title="Note"
Use notes for neutral context or a small detail readers may otherwise miss.
:::

::: warning title="Warning"
Keep generated output out of your source folders.
:::

::: callout type="danger" title="Be careful"
Never put private credentials in public documentation.
:::

## Accordion

::: accordion title="Show advanced details"
This content starts closed and opens with the native details control.
:::

::: accordion title="Open details" open
This content starts open.
:::

## Tabs

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
::: tab pnpm
```bash
pnpm add -D docshelf
```
:::
:::

## Code groups

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

## Cards

::: cards
::: card title="Getting started" href="/getting-started/" icon="rocket"
Install docshelf and create your first page.
:::
::: card title="Writing docs" href="/writing/" icon="note"
Learn the Markdown format and component syntax.
:::
::: card title="Deploy" href="/deploy/" icon="arrow-up-right"
Publish the generated static files.
:::
:::

## Table

::: table
| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | string | filename | Page title and navigation label |
| `order` | number | 999 | Sidebar order |
| `draft` | boolean | false | Excludes the page from the build |
:::

## Version badge and keyboard shortcut

This component is available since:

::: version version="0.1.0" prefix="v"
:::

Search opens with:

::: shortcut keys="Ctrl+K" label="Open search"
:::

## Steps

::: steps
1. Create a `docs/` folder.
2. Add Markdown files.
3. Run `docshelf build`.
:::

## Image

::: image src="/logo.svg" alt="docshelf logo" caption="An image component using a file from public/."
:::

## Video

::: video src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" caption="A video component with native browser controls."
:::
