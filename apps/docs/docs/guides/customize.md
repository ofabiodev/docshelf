---
title: Customize the site
description: Change the header, icon, theme, CSS, and interface without changing the generator.
slug: /customize/
group: Guides
order: 3
---

## Change the title

```toml
[branding]
title = "Acme Docs"
subtitle = "API reference"
```

The title appears in the header, browser title template, and footer. The small text under the title is optional and is removed when `subtitle` is empty.

## Use a Phosphor icon

```toml
[branding]
icon = "rocket"

[icons]
enabled = true
library = "phosphor"
weight = "regular"
```

docshelf reads the icon from the official [Phosphor Icons Core](https://github.com/phosphor-icons/core) package and inlines the SVG.

## Use your own asset

Place an asset in `public/`:

```text
public/
  logo.svg
```

Reference it by path:

```toml
[branding]
title = "Acme Docs"
icon = "logo.svg"
logo_alt = "Acme Docs logo"
```

SVG assets are inlined. Other image assets are loaded from the generated site. Use `/logo.svg` when you prefer an explicit root-relative path.

Set `icon = false` to remove the mark. Set `icons.enabled = false` to disable the built-in Phosphor library while keeping a custom asset available.

## Change the theme

```toml
[theme]
default = "system"
respect_system = true
allow_toggle = true
```

`default` accepts `light`, `dark`, or `system`. With `system`, the site follows the operating system preference until the visitor chooses a mode. The choice is saved in the browser.

Hide the theme button with:

```toml
[theme]
allow_toggle = false
```

## Remove interface parts

```toml
[ui]
search = false
theme_toggle = false
footer = false
sidebar_footer = false

[navigation]
sidebar = false
toc = false
breadcrumbs = false
page_navigation = false
```

## Remove the announcement

The announcement is enabled by the presence of the section:

```toml
[announcement]
text = "This bar is visible"
```

Delete the entire section to remove it. There is no separate `enabled` flag.

## Change colors with custom.css

Create or edit `public/custom.css`. It loads after the default stylesheet.

```css
:root {
  --bg: #fbfaf8;
  --surface: #ffffff;
  --text: #262320;
  --text-soft: #756e67;
  --accent: #1f1c19;
  --green: #4f8b6f;
}

:root[data-theme="dark"] {
  --bg: #1b1917;
  --surface: #24211f;
  --text: #f2efeb;
  --text-soft: #b4ada6;
  --accent: #f2efeb;
  --green: #88c9a5;
}
```

`docshelf init` creates a complete variable template. Keep the variables in CSS rather than adding colors to TOML.

## Page-specific changes

Use frontmatter when a setting belongs to one page:

```md
---
title: Component showcase
layout: showcase
sidebar: false
toc: false
page_navigation: false
hide_footer: true
---
```

See [Frontmatter](../reference/frontmatter.md) for every supported field.
