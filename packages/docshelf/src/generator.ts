import { watch, type FSWatcher } from "node:fs";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";
import { posix } from "node:path";
import { performance } from "node:perf_hooks";
import { load, SyntaxParseError } from "js-toml";
import hljs from "highlight.js/lib/common";
import { marked } from "marked";
import { renderComponents } from "./components.js";
import { inlineIcon, isAssetIcon, loadIcons, type IconSet } from "./icons.js";
import { error, heading, info, muted, success, warning } from "./terminal.js";
import type { AnnouncementConfig, BuildOptions, BuildResult, DocsConfig, DocsDocument, Frontmatter, Heading, ParsedFrontmatter, RenderPageOptions, RenderedMarkdown, SearchItem, ServeOptions, ValidationIssue, ValidationKind } from "./types.js";

export const DEFAULT_CONFIG: DocsConfig = {
  site: {
    name: "docshelf",
    tagline: "A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment.",
    description: "A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment.",
    url: "",
  },
  announcement: null,
  branding: {
    title: "",
    icon: "notebook",
    logo: "",
    logoAlt: "",
    subtitle: "",
  },
  icons: {
    enabled: true,
    library: "phosphor",
    weight: "regular",
  },
  theme: {
    default: "system",
    respectSystem: true,
    allowToggle: true,
  },
  ui: {
    search: true,
    themeToggle: true,
    footer: true,
    sidebarFooter: true,
  },
  navigation: {
    sidebar: true,
    sidebarMode: "auto",
    toc: true,
    breadcrumbs: true,
    pageNavigation: true,
    editLink: false,
    lastUpdated: false,
  },
  markdown: {
    syntaxHighlighting: true,
    lineNumbers: false,
    headingAnchors: true,
    smartTypography: false,
  },
  search: {
    enabled: true,
    provider: "local",
    includeCode: false,
    index: "search-index.json",
  },
  paths: {
    docs: "docs",
    output: "dist",
    base: "",
    customCss: "custom.css",
  },
  links: {
    github: "",
    npm: "",
    edit: "",
  },
  i18n: {
    enabled: false,
    defaultLocale: "en",
    locales: ["en"],
    names: { en: "English" },
  },
  seo: {
    titleTemplate: "%s · docshelf",
    image: "",
    description: "",
    author: "",
    twitterCard: "summary_large_image",
    robots: "index,follow",
    canonical: true,
    jsonLd: true,
    generateOgImage: true,
  },
  feeds: {
    sitemap: true,
    rss: true,
  },
  validation: {
    brokenLinks: "error",
    missingAssets: "error",
    frontmatter: "error",
    unknownComponents: "warning",
  },
};

export const CUSTOM_CSS_TEMPLATE = String.raw`:root {
  --bg: #fbfaf8;
  --surface: #ffffff;
  --surface-soft: #f5f2ef;
  --surface-code: #211f1d;
  --text: #262320;
  --text-soft: #756e67;
  --text-faint: #aaa39c;
  --line: #e8e4df;
  --line-strong: #d8d2cc;
  --accent: #1f1c19;
  --accent-soft: #ebe7e2;
  --green: #4f8b6f;
  --callout-note: #5c7c99;
  --callout-tip: #4f8b6f;
  --callout-warning: #b17b2a;
  --callout-danger: #b84f57;
  --code-comment: #928a83;
  --code-keyword: #9d5c7c;
  --code-string: #588a68;
  --code-number: #ad6a38;
  --code-title: #55799b;
  --code-built-in: #8068a3;
  --shadow: 0 18px 50px rgba(35, 29, 24, 0.08);
}

:root[data-theme="dark"] {
  --bg: #1b1917;
  --surface: #24211f;
  --surface-soft: #2d2926;
  --surface-code: #121110;
  --text: #f2efeb;
  --text-soft: #b4ada6;
  --text-faint: #7d756e;
  --line: #3b3632;
  --line-strong: #504943;
  --accent: #f2efeb;
  --accent-soft: #3a3531;
  --green: #88c9a5;
  --callout-note: #8db4d8;
  --callout-tip: #88c9a5;
  --callout-warning: #e2b56c;
  --callout-danger: #ed8b91;
  --code-comment: #aaa39c;
  --code-keyword: #e3a5c9;
  --code-string: #a8d6b2;
  --code-number: #e4ae7b;
  --code-title: #a7c9e4;
  --code-built-in: #c0a7e5;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
}
`;

export const STARTER_FILES = {
  ".gitignore": `node_modules/
dist/
`,
  "docshelf.toml": `# Delete any section you do not need.

[site]
name = "docshelf"
tagline = "A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment."
description = "A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment."
url = ""

[announcement]
text = "Minimal setup. Beautiful docs. Static deployment."
href = ""
tone = "default"

[branding]
title = ""
icon = "notebook"
logo = ""
logo_alt = ""
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
github = ""
npm = ""
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
`,
  "public/custom.css": CUSTOM_CSS_TEMPLATE,
  "docs/index.md": `---
title: A dead-simple documentation framework
description: Minimal setup, beautiful design, and effortless deployment.
group: Start here
order: 1
home: true
---

## Your docs should feel this easy

docshelf turns a folder of Markdown files into a clean, searchable documentation site. There is no app runtime, no server to keep alive, and no maze of configuration.

## How you use it

1. Put Markdown files in \`docs/\`.
2. Run \`npx docshelf build\`.
3. Upload \`dist/\` to any static host.
`,
  "docs/getting-started.md": `---
title: Getting started
description: Start a new documentation site in under a minute.
group: Start here
order: 2
---

## Create a site

\`\`\`bash
npx docshelf init
npx docshelf dev
\`\`\`

Open the local URL printed in your terminal. Edit a file in \`docs/\`, save it, and refresh.

## Build for production

\`\`\`bash
npx docshelf build
\`\`\`

The complete site is written to \`dist/\`. It is just HTML, CSS, JavaScript, and your copied public files.
`,
};

const DEFAULT_CSS = String.raw`
:root {
  color-scheme: light;
  --bg: #fbfaf8;
  --surface: #ffffff;
  --surface-soft: #f5f2ef;
  --surface-code: #211f1d;
  --text: #262320;
  --text-soft: #756e67;
  --text-faint: #aaa39c;
  --line: #e8e4df;
  --line-strong: #d8d2cc;
  --accent: #1f1c19;
  --accent-soft: #ebe7e2;
  --green: #4f8b6f;
  --shadow: 0 18px 50px rgba(35, 29, 24, 0.08);
  --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
  font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

:root[data-theme="dark"] {
  color-scheme: dark;
  --bg: #1b1917;
  --surface: #24211f;
  --surface-soft: #2d2926;
  --surface-code: #121110;
  --text: #f2efeb;
  --text-soft: #b4ada6;
  --text-faint: #7d756e;
  --line: #3b3632;
  --line-strong: #504943;
  --accent: #f2efeb;
  --accent-soft: #3a3531;
  --green: #88c9a5;
  --shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
}

* { box-sizing: border-box; }
html { min-width: 0; scroll-behavior: auto; scroll-padding-top: 31px; }
body { margin: 0; overflow-x: hidden; background: var(--bg); color: var(--text); font-size: 15px; line-height: 1.65; }
body, button, input { font: inherit; }
::selection { background: var(--accent); color: var(--bg); }
a { color: inherit; text-decoration: none; }
button { border: 0; cursor: pointer; }
button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid var(--green); outline-offset: 3px; }

.announcement {
  position: sticky;
  z-index: 60;
  top: 0;
  height: 31px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  overflow: hidden;
  padding: 6px 14px;
  background: #211f1d;
  color: #d4cec7;
  font-size: 11px;
  letter-spacing: 0.01em;
  line-height: 19px;
  white-space: nowrap;
}
.announcement strong { color: #86cba3; font-weight: 600; }
.announcement span { color: #8d867f; }
.announcement-info strong { color: #8db4d8; }
.announcement-success strong { color: #88c9a5; }
.announcement-warning strong { color: #e2b56c; }
.no-announcement .site-shell { min-height: 100vh; }
.no-announcement .sidebar { top: 0; height: 100vh; }
.no-sidebar .site-shell { grid-template-columns: minmax(0, 1fr); }

.site-shell { width: min(1120px, 100%); min-height: calc(100vh - 31px); margin: 0 auto; display: grid; grid-template-columns: 215px minmax(0, 1fr); padding: 0 15px; }
.sidebar { position: sticky; top: 31px; height: calc(100vh - 31px); display: flex; flex-direction: column; min-width: 0; padding: 72px 18px 18px 0; }
.brand { display: inline-flex; align-items: center; gap: 9px; width: fit-content; min-width: 0; color: var(--text); font-size: 19px; font-weight: 730; letter-spacing: -0.045em; }
.brand-mark { width: 27px; height: 27px; display: inline-grid; place-items: center; border-radius: 7px; background: var(--accent); color: var(--bg); }
.icon { fill: currentColor; }
.brand-mark svg { width: 17px; height: 17px; }
.brand-image { display: block; width: 17px; height: 17px; object-fit: contain; }
.brand > span:last-child { min-width: 0; }
.brand small { display: block; margin: 3px 0 0 36px; color: var(--text-faint); font-size: 10px; font-weight: 500; letter-spacing: 0; }
.theme-icon { display: inline-flex; }
[data-theme-icon="dark"] { display: none; }
:root[data-theme="dark"] [data-theme-icon="light"] { display: none; }
:root[data-theme="dark"] [data-theme-icon="dark"] { display: inline-flex; }
.icon-fallback { font-size: 11px; line-height: 1; }
.search-trigger { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 28px; padding: 7px 9px; border: 1px solid var(--line); border-radius: 7px; background: transparent; color: var(--text-faint); font-size: 11px; text-align: left; transition: border-color 140ms ease, color 140ms ease, background 140ms ease, transform 120ms var(--ease-out); }
.search-trigger:active { transform: scale(0.98); }
.search-trigger svg { flex: 0 0 auto; }
.search-trigger kbd { margin-left: auto; padding: 1px 4px; border: 1px solid var(--line); border-radius: 4px; color: var(--text-faint); font-family: ui-monospace, monospace; font-size: 9px; }
.sidebar-nav { flex: 1; overflow-y: auto; margin-top: 23px; padding-left: 12px; scrollbar-width: none; }
.icon-button { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border-radius: 7px; background: transparent; color: var(--text-soft); transition: background 140ms ease, color 140ms ease, transform 120ms var(--ease-out); }
.icon-button:active { transform: scale(0.97); }
.sidebar-nav::-webkit-scrollbar { display: none; }
.nav-group { margin: 0 0 21px; }
.nav-label { margin-bottom: 6px; color: var(--text-faint); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.nav-link { position: relative; display: block; padding: 3px 0; color: var(--text-faint); font-size: 12px; line-height: 1.55; transition: color 140ms ease; }
.nav-link[aria-current="page"] { color: var(--text); font-weight: 650; }
.nav-link[aria-current="page"]::before { position: absolute; top: 50%; left: -13px; width: 2px; height: 17px; border-radius: 999px; background: var(--accent); content: ""; transform: translateY(-50%); }
.sidebar-footer { display: grid; gap: 8px; padding: 17px 0 0 12px; color: var(--text-faint); font-size: 11px; }
.sidebar-footer-row { display: flex; align-items: center; gap: 12px; }
.sidebar-footer .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--line-strong); }
.language-switcher { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 12px; padding-left: 12px; font-size: 11px; }
.language-switcher a { color: var(--text-faint); }
.language-switcher a[aria-current="true"] { color: var(--text); }
.main { min-width: 0; display: flex; flex-direction: column; }
.mobile-bar { display: none; }
.content-wrap { width: min(760px, 100%); padding: 88px 44px 0; }
.page { min-width: 0; }
.article-header { margin-bottom: 38px; }
.breadcrumbs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; color: var(--text-faint); font-size: 11px; }
.breadcrumbs a { color: var(--text-soft); }
.page-meta { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 14px; color: var(--text-faint); font-size: 11px; }
.edit-link { color: var(--text-soft); }
h1, h2, h3, h4 { color: var(--text); text-wrap: balance; }
h1 { margin: 0; font-size: clamp(32px, 4vw, 45px); line-height: 1.08; letter-spacing: -0.055em; }
.home-page h1 { max-width: 680px; font-size: clamp(38px, 5vw, 58px); }
.page-description { max-width: 620px; margin: 17px 0 0; color: var(--text-soft); font-size: 17px; line-height: 1.6; }
.article-body { overflow-wrap: anywhere; color: var(--text-soft); font-size: 15.5px; }
.article-body > :first-child { margin-top: 0; }
.article-body p { margin: 18px 0; }
.article-body strong { color: var(--text); font-weight: 680; }
.article-body em { color: var(--text); }
.article-body a { color: var(--text); text-decoration: underline; text-decoration-color: var(--line-strong); text-underline-offset: 3px; transition: text-decoration-color 140ms ease, color 140ms ease; }
.article-body h2 { display: flex; align-items: center; gap: 12px; margin: 52px 0 20px; font-size: 17px; line-height: 1.3; letter-spacing: -0.025em; }
.article-body h2::after { flex: 1; height: 1px; background: var(--line); content: ""; }
.article-body h3 { margin: 31px 0 10px; font-size: 15px; letter-spacing: -0.01em; }
.article-body h4 { margin: 24px 0 8px; font-size: 14px; }
.article-body ul, .article-body ol { margin: 16px 0; padding-left: 22px; }
.article-body li { margin: 7px 0; padding-left: 3px; }
.article-body li::marker { color: var(--text-faint); }
.article-body hr { margin: 42px 0; border: 0; border-top: 1px solid var(--line); }
.article-body img { display: block; max-width: 100%; height: auto; margin: 28px 0; border: 1px solid var(--line); border-radius: 10px; }
.article-body blockquote { margin: 22px 0; padding: 4px 18px; border-left: 2px solid var(--line-strong); color: var(--text-soft); }
.article-body blockquote p { margin: 8px 0; }
.table-wrap { max-width: 100%; margin: 25px 0; overflow-x: auto; }
.article-body table { width: max-content; min-width: 100%; margin: 0; border-collapse: collapse; font-size: 13px; }
.article-body th { color: var(--text); font-weight: 650; text-align: left; }
.article-body th, .article-body td { padding: 10px 12px; border: 1px solid var(--line); vertical-align: top; }
.article-body tr:nth-child(even) { background: color-mix(in srgb, var(--surface-soft) 50%, transparent); }
.article-body code { padding: 2px 5px; border: 1px solid var(--line); border-radius: 5px; background: var(--surface-soft); color: var(--text); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.83em; }
.code-block { margin: 22px 0; overflow: hidden; border: 1px solid #35312e; border-radius: 9px; background: var(--surface-code); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05); }
.code-toolbar { display: flex; align-items: center; justify-content: space-between; min-height: 34px; padding: 0 10px 0 14px; border-bottom: 1px solid rgba(255,255,255,0.08); color: #928a83; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px; text-transform: lowercase; }
.copy-button { padding: 4px 6px; border-radius: 4px; background: transparent; color: #928a83; font-size: 10px; transition: color 140ms ease, background 140ms ease, transform 120ms var(--ease-out); }
.copy-button:active { transform: scale(0.97); }
.copy-button[data-copied="true"] { color: #91d5ac; }
.code-block pre { margin: 0; padding: 16px 17px 18px; overflow-x: auto; color: #ded7d0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.75; tab-size: 2; }
.code-block code { padding: 0; border: 0; background: transparent; color: inherit; font-size: inherit; }
.code-line-numbers pre code { counter-reset: line; }
.code-line-numbers .code-line { display: block; counter-increment: line; min-height: 1.75em; }
.code-line-numbers .code-line::before { display: inline-block; width: 2.5em; margin-right: 1em; color: #6e6862; content: counter(line); text-align: right; user-select: none; }
.hljs-comment, .hljs-quote { color: var(--code-comment); font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section { color: var(--code-keyword); }
.hljs-string, .hljs-attr, .hljs-template-tag { color: var(--code-string); }
.hljs-number, .hljs-symbol, .hljs-bullet { color: var(--code-number); }
.hljs-title, .hljs-title.class_, .hljs-title.function_ { color: var(--code-title); }
.hljs-built_in, .hljs-type { color: var(--code-built-in); }
.callout { display: grid; gap: 6px; margin: 22px 0; padding: 15px 17px; border: 1px solid color-mix(in srgb, var(--callout-note) 26%, var(--line)); border-left: 3px solid var(--callout-note); border-radius: 9px; background: color-mix(in srgb, var(--callout-note) 8%, var(--surface)); color: var(--text-soft); }
.callout > strong { display: flex; align-items: center; gap: 7px; color: var(--callout-note); font-size: 10px; letter-spacing: 0.09em; text-transform: uppercase; }
.callout > strong::before { width: 7px; height: 7px; border: 2px solid currentColor; border-radius: 50%; background: transparent; content: ""; }
.callout p { margin: 0; }
.callout-tip { border-color: color-mix(in srgb, var(--callout-tip) 26%, var(--line)); border-left-color: var(--callout-tip); background: color-mix(in srgb, var(--callout-tip) 9%, var(--surface)); }
.callout-tip > strong { color: var(--callout-tip); }
.callout-warning { border-color: color-mix(in srgb, var(--callout-warning) 30%, var(--line)); border-left-color: var(--callout-warning); background: color-mix(in srgb, var(--callout-warning) 10%, var(--surface)); }
.callout-warning > strong { color: var(--callout-warning); }
.callout-danger { border-color: color-mix(in srgb, var(--callout-danger) 30%, var(--line)); border-left-color: var(--callout-danger); background: color-mix(in srgb, var(--callout-danger) 10%, var(--surface)); }
.callout-danger > strong { color: var(--callout-danger); }
.article-body .callout a { color: inherit; }

.docs-accordion, .docs-card, .docs-tabs, .docs-code-group, .docs-steps, .docs-table, .docs-image, .docs-video { margin: 24px 0; }
.docs-accordion { overflow: hidden; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); }
.docs-accordion summary { display: flex; align-items: center; gap: 10px; padding: 14px 16px; color: var(--text); cursor: pointer; font-weight: 650; list-style: none; }
.docs-accordion summary::-webkit-details-marker { display: none; }
.docs-accordion summary::before { width: 7px; height: 7px; flex: 0 0 auto; border-right: 1.5px solid var(--text-faint); border-bottom: 1.5px solid var(--text-faint); content: ""; transform: rotate(-45deg); transition: transform 150ms var(--ease-out), border-color 150ms ease; }
.docs-accordion[open] summary { border-bottom: 1px solid var(--line); background: var(--surface-soft); }
.docs-accordion[open] summary::before { border-color: var(--green); transform: rotate(45deg); }
.docs-accordion summary:focus-visible { outline: 2px solid var(--green); outline-offset: -3px; }
.docs-accordion-body { padding: 14px 16px 16px; background: var(--surface-soft); color: var(--text-soft); }
.docs-accordion-body > :first-child { margin-top: 0; }
.docs-accordion-body > :last-child { margin-bottom: 0; }
.docs-tab-list, .docs-code-list { display: flex; gap: 4px; overflow-x: auto; border-bottom: 1px solid var(--line); }
.docs-tab-button, .docs-code-button { flex: 0 0 auto; padding: 8px 11px; border-bottom: 2px solid transparent; background: transparent; color: var(--text-faint); font-size: 12px; transition: color 140ms ease, border-color 140ms ease; }
.docs-tab-button[aria-selected="true"], .docs-code-button[aria-selected="true"] { border-color: var(--green); color: var(--text); }
.docs-tab-panel { padding-top: 2px; }
.docs-tab-panel[hidden], .docs-code-panel[hidden] { display: none; }
.docs-code-group { overflow: hidden; border: 1px solid var(--line); border-radius: 9px; background: var(--surface-code); }
.docs-code-group .docs-code-list { border-color: rgba(255,255,255,.08); padding: 0 7px; }
.docs-code-group .docs-code-button { color: #928a83; }
.docs-code-group .docs-code-button[aria-selected="true"] { color: #f5f1ed; }
.docs-code-panel { padding: 0; }
.docs-code-panel .code-block { margin: 0; border: 0; border-radius: 0; box-shadow: none; }
.docs-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; }
.docs-card { display: grid; gap: 7px; padding: 16px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface-soft); color: var(--text-soft); transition: border-color 150ms ease, color 150ms ease, transform 150ms var(--ease-out); }
.article-body a.docs-card, .article-body a.docs-card:hover { color: var(--text-soft); text-decoration: none; }
.docs-card strong { color: var(--text); font-size: 13px; }
.docs-card-icon { display: inline-grid; width: 28px; height: 28px; place-items: center; border-radius: 7px; background: var(--accent); color: var(--bg); }
.docs-card-icon svg { width: 17px; height: 17px; }
.docs-steps > ol { counter-reset: docs-step; display: grid; gap: 15px; padding: 0; list-style: none; }
.docs-steps > ol > li { position: relative; padding-left: 39px; }
.docs-steps > ol > li::before { position: absolute; top: 1px; left: 0; display: grid; width: 25px; height: 25px; place-items: center; border-radius: 50%; background: var(--accent); color: var(--bg); content: counter(docs-step); counter-increment: docs-step; font-size: 11px; font-weight: 700; }
.docs-table .table-wrap { margin-top: 0; }
.docs-table table { font-size: 13px; }
.docs-version-badge { display: inline-flex; align-items: center; gap: 6px; margin: 0 4px; padding: 3px 7px; border: 1px solid color-mix(in srgb, var(--green) 42%, var(--line)); border-radius: 999px; background: color-mix(in srgb, var(--green) 10%, var(--surface)); color: var(--text); font: 650 11px/1.2 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; vertical-align: middle; }
.docs-version-label { color: var(--green); }
.docs-shortcut-block { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 0 4px; vertical-align: middle; }
.docs-shortcut { display: inline-flex; align-items: center; gap: 4px; }
.docs-shortcut kbd { min-width: 20px; padding: 3px 6px; border: 1px solid var(--line-strong); border-bottom-width: 2px; border-radius: 5px; background: var(--surface-soft); color: var(--text); font: 650 11px/1.1 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; text-align: center; }
.docs-shortcut-plus { color: var(--text-faint); font-size: 11px; }
.docs-shortcut-label { color: var(--text-faint); font-size: 12px; }
.docs-image, .docs-video { display: grid; gap: 8px; }
.docs-image img, .docs-video video { display: block; max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; }
.docs-image figcaption, .docs-video figcaption { color: var(--text-faint); font-size: 12px; text-align: center; }

.toc { margin: 42px 0 0; padding: 18px 0 0; border-top: 1px solid var(--line); }
.toc-title { margin-bottom: 9px; color: var(--text-faint); font-size: 10px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
.toc a { display: block; padding: 3px 0; color: var(--text-faint); font-size: 12px; transition: color 140ms ease; }
.toc a[data-level="3"] { padding-left: 12px; }
.toc a[data-level="4"] { padding-left: 24px; }
.page-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 59px 0 0; padding-top: 18px; border-top: 1px solid var(--line); }
.page-nav a { display: grid; gap: 3px; padding: 11px 13px; border: 1px solid var(--line); border-radius: 7px; color: var(--text-faint); font-size: 11px; transition: border-color 150ms ease, color 150ms ease; }
.page-nav a:last-child { text-align: right; }
.page-nav small { font-size: 10px; }
.page-nav strong { color: var(--text); font-size: 12px; font-weight: 650; }
.page-nav .empty { visibility: hidden; }
.site-footer { width: min(760px, 100%); margin-top: auto; padding: 54px 44px 25px; }
.site-footer-inner { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-top: 17px; border-top: 1px solid var(--line); color: var(--text-faint); font-size: 11px; }
.site-footer-links { display: flex; gap: 14px; }

.mobile-panel { display: none; }
.search-overlay[hidden] { display: none; }
.search-overlay { position: fixed; z-index: 100; inset: 0; display: grid; place-items: start center; padding: 16vh 18px 24px; background: rgba(26, 23, 20, .32); backdrop-filter: blur(5px); }
.search-card { width: min(560px, 100%); overflow: hidden; border: 1px solid var(--line-strong); border-radius: 12px; background: var(--surface); box-shadow: var(--shadow); }
.search-input-row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-bottom: 1px solid var(--line); }
.search-input-row svg { flex: 0 0 auto; color: var(--text-faint); }
.search-input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--text); font-size: 15px; }
.search-input:focus-visible { outline: 0; }
.search-input-row:focus-within { box-shadow: inset 0 0 0 1px var(--line-strong); }
.search-input::placeholder { color: var(--text-faint); }
.search-esc { padding: 3px 6px; border: 1px solid var(--line); border-radius: 5px; color: var(--text-faint); font-family: ui-monospace, monospace; font-size: 10px; }
.search-results { max-height: 340px; overflow-y: auto; padding: 6px; }
.search-result { display: grid; gap: 1px; padding: 10px 11px; border-radius: 7px; }
.search-result[data-selected="true"] { background: var(--surface-soft); }
.search-result strong { color: var(--text); font-size: 13px; }
.search-result span { overflow: hidden; color: var(--text-faint); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
.search-empty { padding: 20px 12px; color: var(--text-faint); font-size: 12px; text-align: center; }

@media (hover: hover) and (pointer: fine) {
  .announcement span { transition: transform 160ms var(--ease-out); }
  .announcement:hover span { transform: translateX(3px); }
  .search-trigger:hover { border-color: var(--line-strong); background: var(--surface-soft); color: var(--text); }
  .icon-button:hover { background: var(--surface-soft); color: var(--text); }
  .nav-link:hover { color: var(--text-soft); }
  .sidebar-footer a:hover, .language-switcher a:hover { color: var(--text-soft); }
  .article-body a:hover { color: var(--green); text-decoration-color: var(--green); }
  .copy-button:hover { background: rgba(255,255,255,0.08); color: #f5f1ed; }
  .docs-tab-button:hover, .docs-code-button:hover { border-color: var(--green); color: var(--text); }
  .docs-card:hover { border-color: var(--line-strong); color: var(--text); transform: translateY(-1px); }
  .toc a:hover { color: var(--text); }
  .page-nav a:hover { border-color: var(--line-strong); color: var(--text); }
  .site-footer a:hover { color: var(--text-soft); }
  .search-result:hover { background: var(--surface-soft); }
}

@media (max-width: 860px) {
  .site-shell { display: block; padding: 0; }
  .sidebar { display: none; }
  .mobile-bar { position: sticky; z-index: 40; top: 31px; display: flex; align-items: center; justify-content: space-between; gap: 12px; height: 58px; padding-right: max(17px, env(safe-area-inset-right)); padding-left: max(17px, env(safe-area-inset-left)); border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(14px); }
  .no-announcement .mobile-bar { top: 0; }
  .mobile-bar .brand { flex: 1 1 auto; font-size: 17px; overflow: hidden; }
  .mobile-bar .brand > span:last-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mobile-bar .brand-mark { width: 24px; height: 24px; border-radius: 6px; }
  .mobile-actions { display: flex; flex: 0 0 auto; gap: 5px; }
  .icon-button { width: 33px; height: 33px; }
  .mobile-panel { position: fixed; z-index: 39; top: 89px; right: 0; bottom: auto; left: 0; display: block; max-height: calc(100dvh - 89px); overflow-y: auto; padding: 14px max(22px, env(safe-area-inset-right)) 19px max(22px, env(safe-area-inset-left)); border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 95%, transparent); box-shadow: var(--shadow); transform-origin: top; }
  .no-announcement .mobile-panel { top: 58px; max-height: calc(100dvh - 58px); }
  .mobile-panel[hidden] { display: none; }
  .mobile-panel .sidebar-nav { margin: 0; padding: 0 0 4px 12px; }
  .mobile-panel .sidebar-footer { display: none; }
  .content-wrap { padding: 57px 22px 0; }
  .site-footer { padding: 50px 22px 22px; }
}

@media (max-width: 620px) {
  .announcement { justify-content: flex-start; padding-right: max(14px, env(safe-area-inset-right)); padding-left: max(14px, env(safe-area-inset-left)); font-size: 10px; }
  .announcement span:last-child { display: none; }
  .content-wrap { padding-top: 42px; }
  h1, .home-page h1 { font-size: 36px; }
  .page-description { font-size: 15px; }
  .article-body { font-size: 15px; }
  .page-nav { grid-template-columns: 1fr; }
  .page-nav a:last-child { text-align: left; }
  .page-nav .empty { display: none; }
  .site-footer-inner { align-items: flex-start; flex-direction: column; }
}

@media (max-width: 380px) {
  .mobile-bar { gap: 7px; padding-right: max(12px, env(safe-area-inset-right)); padding-left: max(12px, env(safe-area-inset-left)); }
  .mobile-actions { gap: 1px; }
  .icon-button { width: 30px; height: 30px; }
  .content-wrap { padding-right: 16px; padding-left: 16px; }
  .site-footer { padding-right: 16px; padding-left: 16px; }
  h1, .home-page h1 { font-size: 32px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
}
`;

function renderIcon(icons: IconSet, name: string, size = 16, className = ""): string {
  return inlineIcon(icons, name, size, className);
}

function renderBrandMark(config: DocsConfig, icons: IconSet, base: string): string {
  const value = config.branding?.logo || config.branding?.icon;
  if (value === false || value === null || value === "") return "";
  if (typeof value === "string" && value.trim().startsWith("<svg")) return `<span class="brand-mark" aria-hidden="true">${value}</span>`;
  if (typeof value === "string" && isAssetIcon(value)) {
    const icon = renderIcon(icons, value, 17);
    if (icon) return `<span class="brand-mark" aria-hidden="true">${icon}</span>`;
    const alt = escapeHtml(asText(config.branding.logoAlt));
    const source = isExternalReference(value) ? value : siteUrl(base, `/${value.replace(/^[/\\]+/, "")}`);
    return `<span class="brand-mark"${alt ? "" : " aria-hidden=\"true\""}><img class="brand-image" src="${escapeHtml(source)}" alt="${alt}"></span>`;
  }
  const icon = renderIcon(icons, value || "notebook", 17);
  if (icon) return `<span class="brand-mark" aria-hidden="true">${icon}</span>`;
  return value ? `<span class="brand-mark brand-mark-text" aria-hidden="true">${escapeHtml(value)}</span>` : "";
}

function renderLogo(name: string, config: DocsConfig, icons: IconSet, base: string): string {
  const title = asText(config.branding?.title) || name;
  const subtitle = asText(config.branding?.subtitle);
  return `${renderBrandMark(config, icons, base)}<span>${escapeHtml(title)}${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ""}</span>`;
}

function renderThemeButton(config: DocsConfig, icons: IconSet, size = 16): string {
  if (config.ui?.themeToggle === false || config.theme?.allowToggle === false) return "";
  const moon = renderIcon(icons, "moon", size);
  const sun = renderIcon(icons, "sun", size);
  const fallback = '<span class="icon-fallback">Theme</span>';
  return `<button class="icon-button" type="button" aria-label="Switch to dark theme" data-theme-toggle><span class="theme-icon" data-theme-icon="light">${moon || fallback}</span><span class="theme-icon" data-theme-icon="dark">${sun || fallback}</span></button>`;
}

function renderSearchButton(config: DocsConfig, icons: IconSet, desktop = false): string {
  if (config.ui?.search === false) return "";
  const icon = renderIcon(icons, "magnifying-glass", desktop ? 14 : 16);
  if (!desktop) return `<button class="icon-button" type="button" aria-label="Search" data-search-open>${icon || '<span class="icon-fallback">Search</span>'}</button>`;
  return `<button class="search-trigger" type="button" data-search-open>${icon}<span>Search docs</span><kbd>/</kbd></button>`;
}

function renderMenuButton(config: DocsConfig, icons: IconSet): string {
  if (config.navigation?.sidebar === false || config.navigation?.sidebarMode === "none") return "";
  const icon = renderIcon(icons, "list", 17);
  return `<button class="icon-button" type="button" aria-label="Open navigation" aria-expanded="false" data-menu-toggle>${icon || '<span class="icon-fallback">Menu</span>'}</button>`;
}

const CLIENT_JS = String.raw`(() => {
  const root = document.documentElement;
  const storageKey = "docshelf-theme";
  const configuredTheme = root.dataset.themeDefault || "light";
  const respectSystem = root.dataset.themeRespectSystem !== "false";
  const savedTheme = localStorage.getItem(storageKey);
  if (savedTheme === "dark" || savedTheme === "light") root.dataset.theme = savedTheme;
  else if (configuredTheme === "system" && respectSystem) root.dataset.theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  else if (configuredTheme === "dark" || configuredTheme === "light") root.dataset.theme = configuredTheme;

  const updateThemeButtons = () => document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const dark = root.dataset.theme === "dark";
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  });

  const setTheme = () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem(storageKey, next);
    updateThemeButtons();
  };
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => button.addEventListener("click", setTheme));
  updateThemeButtons();

  const mobilePanel = document.querySelector("[data-mobile-panel]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  let closeMobile = () => {};
  if (mobilePanel && menuButton) {
    const setMobileOpen = (open, returnFocus = false) => {
      if (open) mobilePanel.removeAttribute("hidden");
      else mobilePanel.setAttribute("hidden", "");
      menuButton.setAttribute("aria-expanded", String(open));
      if (returnFocus) menuButton.focus();
    };
    menuButton.addEventListener("click", () => {
      setMobileOpen(mobilePanel.hasAttribute("hidden"));
    });
    mobilePanel.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMobileOpen(false)));
    closeMobile = () => { if (!mobilePanel.hasAttribute("hidden")) setMobileOpen(false, true); };
  }

  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.closest(".code-block")?.querySelector("code");
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent || "");
        button.textContent = "Copied";
        button.dataset.copied = "true";
        window.setTimeout(() => { button.textContent = "Copy"; delete button.dataset.copied; }, 1400);
      } catch {
        button.textContent = "Select code";
        window.setTimeout(() => { button.textContent = "Copy"; }, 1400);
      }
    });
  });

  const wireTabList = (container, buttonSelector, panelSelector, targetKey) => {
    const buttons = [...container.querySelectorAll(buttonSelector)];
    const activate = (button) => {
      const target = button.dataset[targetKey];
      buttons.forEach((item) => {
        const active = item === button;
        item.setAttribute("aria-selected", String(active));
        item.tabIndex = active ? 0 : -1;
      });
      container.querySelectorAll(panelSelector).forEach((panel) => { panel.hidden = targetKey === "tabTarget" ? panel.id !== target : panel.dataset.codePanel !== target; });
    };
    buttons.forEach((button) => {
      button.addEventListener("click", () => activate(button));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = buttons.indexOf(button);
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1) + buttons.length) % buttons.length;
        buttons[next]?.focus();
        buttons[next]?.click();
      });
    });
  };
  document.querySelectorAll("[data-tabs]").forEach((tabs) => wireTabList(tabs, "[data-tab-target]", "[role=tabpanel]", "tabTarget"));
  document.querySelectorAll("[data-code-group]").forEach((group) => wireTabList(group, "[data-code-target]", "[data-code-panel]", "codeTarget"));

  const overlay = document.querySelector("[data-search-overlay]");
  const input = document.querySelector("[data-search-input]");
  const results = document.querySelector("[data-search-results]");
  let searchIndex = [];
  let selected = 0;
  let searchTrigger = null;
  const updateSearchSelection = () => {
    if (!input) return;
    const active = results?.querySelector("#search-result-" + selected);
    if (active) input.setAttribute("aria-activedescendant", active.id);
    else input.removeAttribute("aria-activedescendant");
  };
  const closeSearch = () => {
    if (overlay) overlay.hidden = true;
    input?.setAttribute("aria-expanded", "false");
    searchTrigger?.focus();
    searchTrigger = null;
  };
  const openSearch = async (trigger) => {
    if (!overlay || !input) return;
    searchTrigger = trigger || document.activeElement;
    overlay.hidden = false;
    input.setAttribute("aria-expanded", "true");
    input.value = "";
    renderResults("");
    input.focus();
    if (!searchIndex.length) {
      try {
        const response = await fetch(overlay.dataset.indexUrl);
        searchIndex = await response.json();
      } catch { searchIndex = []; }
    }
  };
  const renderResults = (query) => {
    if (!results) return;
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const score = (item) => {
      if (!terms.length) return 0;
      const title = String(item.title || "").toLowerCase();
      const description = String(item.description || "").toLowerCase();
      const headings = (item.headings || []).join(" ").toLowerCase();
      const text = String(item.text || "").toLowerCase();
      return terms.reduce((total, term) => total + (title === term ? 100 : 0) + (title.startsWith(term) ? 40 : 0) + (title.includes(term) ? 20 : 0) + (headings.includes(term) ? 10 : 0) + (description.includes(term) ? 5 : 0) + (text.includes(term) ? 1 : 0), 0);
    };
    const matches = searchIndex.map((item) => ({ item, score: score(item) })).filter((entry) => !terms.length || entry.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map((entry) => entry.item);
    selected = 0;
    results.innerHTML = matches.length
      ? matches.map((item, index) => '<a id="search-result-' + index + '" role="option" class="search-result" aria-selected="' + (index === 0) + '" data-selected="' + (index === 0) + '" href="' + item.path + '"><strong>' + escapeHtml(item.title) + '</strong><span>' + escapeHtml(item.description || item.text.slice(0, 120)) + '</span></a>').join("")
      : '<div class="search-empty">No pages found.</div>';
    updateSearchSelection();
  };
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  if (input) input.addEventListener("input", () => renderResults(input.value));
  document.querySelectorAll("[data-search-open]").forEach((button) => button.addEventListener("click", () => openSearch(button)));
  document.querySelectorAll("[data-search-close]").forEach((button) => button.addEventListener("click", closeSearch));
  if (overlay) overlay.addEventListener("click", (event) => { if (event.target === overlay) closeSearch(); });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !typing)) { event.preventDefault(); openSearch(document.activeElement); return; }
    if (event.key === "Escape") {
      if (overlay && !overlay.hidden) closeSearch();
      closeMobile();
      return;
    }
    if (!overlay || overlay.hidden || !results) return;
    const items = [...results.querySelectorAll(".search-result")];
    if (!items.length) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      selected = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (selected + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items.forEach((item, index) => { item.dataset.selected = String(index === selected); item.setAttribute("aria-selected", String(index === selected)); });
      updateSearchSelection();
    }
    if (event.key === "Enter" && items[selected]) { event.preventDefault(); items[selected].click(); }
  });
})();
`;

function asText(value: unknown, fallback = ""): string {
  return value === undefined || value === null ? fallback : String(value);
}

export function parseFrontmatter(source: string): ParsedFrontmatter {
  const normalized = source.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!match) return { data: {}, content: source };

  const data: Frontmatter = {};
  for (const line of (match[1] || "").split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    data[key] = parseScalar(line.slice(separator + 1));
  }
  return { data, content: match[2] || "" };
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1, -1);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try { return JSON.parse(trimmed); } catch { return trimmed; }
  }
  return trimmed;
}

export function slugify(value: unknown): string {
  const slug = String(value)
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z0-9#]+;/gi, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
  return slug || "section";
}

export function routeForSource(sourceRelative: string): string {
  const normalized = sourceRelative.split(sep).join("/");
  const extension = extname(normalized);
  const withoutExtension = extension ? normalized.slice(0, -extension.length) : normalized;
  const base = posix.basename(withoutExtension).toLowerCase();
  const directory = posix.dirname(withoutExtension);
  if (base === "index" || base === "readme") return directory === "." ? "/" : `/${directory}/`;
  return `/${withoutExtension}/`;
}

export function siteUrl(base: string, route = "/"): string {
  const cleanBase = normalizeBase(base);
  const cleanRoute = route === "/" ? "" : route.replace(/^\/+/, "");
  if (!cleanBase && !cleanRoute) return "/";
  return `${cleanBase}/${cleanRoute}`.replace(/\/{2,}/g, "/");
}

function normalizeBase(base: unknown): string {
  const value = asText(base).trim();
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function escapeHtml(value: unknown): string {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
  return asText(value).replace(/[&<>'"]/g, (character) => entities[character] || character);
}

function stripMarkup(value: unknown): string {
  return asText(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function titleFromContent(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m);
  return heading ? stripMarkup(heading[1]) : fallback;
}

async function exists(file: string): Promise<boolean> {
  try { await fs.access(file); return true; } catch { return false; }
}

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  const files = [];
  for (const entry of entries) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(file));
    else files.push(file);
  }
  return files;
}

function localeForSource(sourceRelative: string, config: DocsConfig): { locale: string; contentRelative: string } {
  const parts = sourceRelative.split("/");
  if (config.i18n.enabled && parts.length > 1) {
    const matched = config.i18n.locales.find((locale) => locale.toLowerCase() === parts[0]?.toLowerCase());
    if (matched) return { locale: matched, contentRelative: parts.slice(1).join("/") };
  }
  return { locale: config.i18n.defaultLocale, contentRelative: sourceRelative };
}

function localizedRoute(contentRelative: string, locale: string, config: DocsConfig): string {
  const source = config.i18n.enabled && locale !== config.i18n.defaultLocale ? `${locale}/${contentRelative}` : contentRelative;
  return routeForSource(source);
}

function localizedSlug(value: string, locale: string, config: DocsConfig): string {
  const clean = value.trim().replace(/^\/+|\/+$/g, "");
  const route = clean ? `/${clean}/` : "/";
  return config.i18n.enabled && locale !== config.i18n.defaultLocale && route !== "/" ? `/${locale}${route}` : route;
}

async function readDocuments(docsDirectory: string, config: DocsConfig): Promise<DocsDocument[]> {
  const files = (await walk(docsDirectory)).filter((file) => extname(file).toLowerCase() === ".md");
  const documents = [];
  for (const file of files) {
    const sourceRelative = relative(docsDirectory, file).split(sep).join("/");
    const source = await fs.readFile(file, "utf8");
    const { data, content } = parseFrontmatter(source);
    const stats = await fs.stat(file);
    const localeInfo = localeForSource(sourceRelative, config);
    const fallback = titleFromContent(content, posix.basename(localeInfo.contentRelative).replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    const slug = typeof data.slug === "string" && data.slug.trim() ? data.slug : "";
    const route = slug ? localizedSlug(slug, localeInfo.locale, config) : localizedRoute(localeInfo.contentRelative, localeInfo.locale, config);
    documents.push({
      sourceRelative,
      contentRelative: localeInfo.contentRelative,
      content,
      title: asText(data.title, fallback) || fallback,
      sidebarTitle: asText(data.sidebar_label ?? data.sidebarLabel, asText(data.title, fallback) || fallback),
      description: asText(data.description),
      group: data.group === null ? "" : asText(data.group, "Guides"),
      order: typeof data.order === "number" && Number.isFinite(data.order) ? data.order : 999,
      slug,
      home: data.home === true || route === "/",
      draft: data.draft === true,
      sidebar: data.sidebar !== false,
      toc: typeof data.toc === "boolean" ? data.toc : undefined,
      breadcrumbs: typeof data.breadcrumbs === "boolean" ? data.breadcrumbs : undefined,
      pageNavigation: typeof (data.page_navigation ?? data.pageNavigation) === "boolean" ? Boolean(data.page_navigation ?? data.pageNavigation) : undefined,
      layout: asText(data.layout, "doc"),
      hideTitle: data.hide_title === true || data.hideTitle === true,
      hideFooter: data.hide_footer === true || data.hideFooter === true,
      editLink: typeof data.edit_link === "boolean" || typeof data.edit_link === "string" ? data.edit_link : typeof data.editLink === "boolean" || typeof data.editLink === "string" ? data.editLink : undefined,
      lastUpdated: typeof data.last_updated === "boolean" || typeof data.last_updated === "string" ? data.last_updated : typeof data.lastUpdated === "boolean" || typeof data.lastUpdated === "string" ? data.lastUpdated : undefined,
      canonical: (data.canonical === false ? false : typeof data.canonical === "string" ? data.canonical : undefined) as string | false | undefined,
      ogImage: asText(data.og_image ?? data.ogImage),
      noindex: data.noindex === true,
      lang: asText(data.lang, localeInfo.locale),
      author: asText(data.author),
      lastModified: stats.mtimeMs,
      locale: localeInfo.locale,
      data,
      route,
    });
  }
  return documents
    .filter((document) => !document.draft)
    .sort((a, b) => {
      if (a.home !== b.home) return a.home ? -1 : 1;
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
}

function renderNavigation(documents: DocsDocument[], currentRoute: string, base: string): string {
  const visibleDocuments = documents.filter((document) => document.sidebar);
  const home = visibleDocuments.find((document) => document.home);
  const groups: Array<{ label: string; documents: DocsDocument[] }> = [];
  for (const document of visibleDocuments) {
    if (document.home) continue;
    const label = document.group || "Guides";
    let group = groups.find((item) => item.label === label);
    if (!group) { group = { label, documents: [] }; groups.push(group); }
    group.documents.push(document);
  }
  const groupOrder = new Map([["Start here", 0], ["Guides", 1], ["Reference", 2]]);
  groups.sort((left, right) => (groupOrder.get(left.label) ?? 99) - (groupOrder.get(right.label) ?? 99) || left.label.localeCompare(right.label));
  const homeLink = home ? `<a class="nav-link${home.route === currentRoute ? "" : ""}" href="${siteUrl(base, home.route)}"${home.route === currentRoute ? ' aria-current="page"' : ""}>${escapeHtml(home.title)}</a>` : "";
  const groupLinks = groups.map((group) => `<div class="nav-group"><div class="nav-label">${escapeHtml(group.label)}</div>${group.documents.map((document) => `<a class="nav-link" href="${siteUrl(base, document.route)}"${document.route === currentRoute ? ' aria-current="page"' : ""}>${escapeHtml(document.sidebarTitle)}</a>`).join("")}</div>`).join("");
  return `${homeLink ? `<div class="nav-group">${homeLink}</div>` : ""}${groupLinks}`;
}

function addHeadingIds(html: string): { html: string; headings: Heading[] } {
  const seen = new Map<string, number>();
  const headings: Heading[] = [];
  const output = html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (match: string, level: string, inner: string) => {
    const base = slugify(stripMarkup(inner));
    const count = seen.get(base) || 0;
    seen.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    if (Number(level) >= 2 && Number(level) <= 4) headings.push({ id, level: Number(level), title: stripMarkup(inner) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: output, headings };
}

const HIGHLIGHT_LANGUAGES = ["bash", "css", "diff", "html", "javascript", "json", "markdown", "python", "shell", "sql", "typescript", "xml", "yaml"];

function decodeHtml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function highlightCodeBlocks(html: string, lineNumbers: boolean, enabled: boolean): string {
  if (!enabled) return html;
  return html.replace(/<pre([^>]*)><code(?: class="language-([^"]+)")?>([\s\S]*?)<\/code><\/pre>/g, (_match: string, attributes: string, language: string | undefined, encodedCode: string) => {
    const source = decodeHtml(encodedCode);
    const requested = language?.trim().toLowerCase();
    if (["text", "plain", "plaintext", "txt"].includes(requested || "")) return `<pre${attributes}><code class="language-text">${encodedCode}</code></pre>`;
    const result = requested && hljs.getLanguage(requested)
      ? hljs.highlight(source, { language: requested, ignoreIllegals: true })
      : hljs.highlightAuto(source, HIGHLIGHT_LANGUAGES);
    const detected = result.language || requested || "text";
    const highlighted = lineNumbers && detected !== "text"
      ? source.split("\n").map((line) => `<span class="code-line">${hljs.highlight(line, { language: detected, ignoreIllegals: true }).value || " "}</span>`).join("\n")
      : result.value;
    return `<pre${attributes}><code class="language-${escapeHtml(detected)}">${highlighted}</code></pre>`;
  });
}

function wrapCodeBlocks(html: string, lineNumbers: boolean): string {
  return html.replace(/<pre><code(?: class="language-([^\"]+)")?>([\s\S]*?)<\/code><\/pre>/g, (match: string, language: string | undefined, code: string) => {
    const label = language || "text";
    const className = language ? ` class="language-${escapeHtml(language)}"` : "";
    return `<div class="code-block${lineNumbers ? " code-line-numbers" : ""}"><div class="code-toolbar"><span>${escapeHtml(label)}</span><button class="copy-button" type="button" data-copy>Copy</button></div><pre><code${className}>${code}</code></pre></div>`;
  });
}

function wrapTables(html: string): string {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, '<div class="table-wrap"><table>$1</table></div>');
}

function smartenMarkdown(source: string): string {
  let fence = "";
  return source.replace(/\r\n?/g, "\n").split("\n").map((line) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1] || "";
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = "";
      return line;
    }
    if (fence) return line;
    return line
      .replace(/\.\.\./g, "…")
      .replace(/(^|[\s([<{])\"([^\"\n]+)\"(?=$|[\s\])},.!?:;])/g, "$1“$2”");
  }).join("\n");
}

function renderMarkdown(document: DocsDocument, documents: DocsDocument[], base: string, icons: IconSet = new Map(), config: DocsConfig = DEFAULT_CONFIG): RenderedMarkdown {
  const markdownSource = config.markdown.smartTypography ? smartenMarkdown(document.content) : document.content;
  const normalizedCallouts = markdownSource.replace(/^>\s*\[!(NOTE|TIP|WARNING|DANGER)\]\s*$/gim, "> <strong class=\"callout-label\">$1</strong>");
  let html = renderComponents(normalizedCallouts, {
    markdown: (source) => String(marked.parse(source, { gfm: true, breaks: false })),
    icon: inlineIcon,
    icons,
  });
  const headingResult = config.markdown.headingAnchors ? addHeadingIds(html) : { html, headings: [] };
  html = headingResult.html;
  html = html.replace(/<blockquote>\s*<p><strong class="callout-label">([^<]+)<\/strong>\s*([\s\S]*?)<\/p>\s*([\s\S]*?)<\/blockquote>/g, (_match: string, label: string, firstParagraph: string, remaining: string) => `<aside class="callout callout-${label.toLowerCase()}"><strong>${escapeHtml(label)}</strong><p>${firstParagraph.trim()}</p>${remaining}</aside>`);
  html = highlightCodeBlocks(html, config.markdown.lineNumbers, config.markdown.syntaxHighlighting);
  html = wrapCodeBlocks(html, config.markdown.lineNumbers);
  html = wrapTables(html);
  html = html.replace(/href="([^"]+)"/g, (match: string, href: string) => {
    if (/^(?:https?:|mailto:|tel:|#|\/)/i.test(href)) return match;
    const [linkPath = "", ...hashParts] = href.split("#");
    if (!linkPath.toLowerCase().endsWith(".md")) return match;
    const source = posix.normalize(posix.join(posix.dirname(document.contentRelative), linkPath));
    const target = documents.find((item) => item.locale === document.locale && item.contentRelative === source);
    if (!target) return match;
    const hash = hashParts.length ? `#${hashParts.join("#")}` : "";
    return `href="${siteUrl(base, target.route)}${hash}"`;
  });
  return { html, headings: headingResult.headings };
}

const FRONTMATTER_TYPES: Record<string, string> = {
  title: "string",
  description: "string",
  seo_title: "string",
  seo_description: "string",
  group: "string or null",
  order: "number",
  slug: "string",
  home: "boolean",
  draft: "boolean",
  sidebar: "boolean",
  sidebar_label: "string",
  toc: "boolean",
  breadcrumbs: "boolean",
  page_navigation: "boolean",
  layout: "string",
  hide_title: "boolean",
  hide_footer: "boolean",
  edit_link: "boolean or string",
  last_updated: "boolean or string",
  canonical: "boolean or string",
  og_image: "string",
  noindex: "boolean",
  lang: "string",
  author: "string",
};

function lineForValue(source: string, value: string): number | undefined {
  const index = source.indexOf(value);
  return index < 0 ? undefined : source.slice(0, index).split(/\r?\n/).length;
}

export function validateFrontmatter(source: string, file = "document.md"): ValidationIssue[] {
  const normalized = source.replace(/^\uFEFF/, "");
  const lines = normalized.split(/\r?\n/);
  if ((lines[0] || "").trim() !== "---") return [];
  const closing = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closing < 0) return [{ kind: "frontmatter", file, line: 1, message: "Frontmatter starts with --- but has no closing ---.", }];

  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < closing; index += 1) {
    const line = lines[index] || "";
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator < 0) {
      issues.push({ kind: "frontmatter", file, line: index + 1, message: "Expected a key followed by a colon." });
      continue;
    }
    const key = line.slice(0, separator).trim();
    if (!key) {
      issues.push({ kind: "frontmatter", file, line: index + 1, message: "Frontmatter keys cannot be empty." });
      continue;
    }
    if (seen.has(key)) issues.push({ kind: "frontmatter", file, line: index + 1, message: `Duplicate key \`${key}\`.` });
    seen.add(key);
    const expected = FRONTMATTER_TYPES[key];
    if (!expected) {
      issues.push({ kind: "frontmatter", file, line: index + 1, message: `Unknown key \`${key}\`. Supported keys: ${Object.keys(FRONTMATTER_TYPES).join(", ")}.` });
      continue;
    }
    const value = parseScalar(line.slice(separator + 1));
    const valid = key === "group"
      ? value === null || typeof value === "string"
      : ["title", "description", "seo_title", "seo_description", "slug", "sidebar_label", "layout", "og_image", "lang", "author"].includes(key)
        ? typeof value === "string"
        : key === "order"
          ? typeof value === "number" && Number.isFinite(value)
          : ["edit_link", "last_updated"].includes(key)
            ? typeof value === "boolean" || typeof value === "string"
            : key === "canonical"
              ? value === false || typeof value === "string"
              : typeof value === "boolean";
    if (!valid) issues.push({ kind: "frontmatter", file, line: index + 1, message: `\`${key}\` must be a ${expected}.` });
    if (key === "title" && typeof value === "string" && !value.trim()) issues.push({ kind: "frontmatter", file, line: index + 1, message: "\`title\` cannot be empty." });
  }
  return issues;
}

function isExternalReference(reference: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(reference);
}

function outputPathForReference(outDirectory: string, pathname: string, base: string, route: string, page: boolean): string | undefined {
  let normalized = pathname || "/";
  const cleanBase = normalizeBase(base);
  if (cleanBase && (normalized === cleanBase || normalized.startsWith(`${cleanBase}/`))) normalized = normalized.slice(cleanBase.length) || "/";
  if (!normalized.startsWith("/")) normalized = posix.join(posix.dirname(route), normalized);
  normalized = `/${posix.normalize(normalized).replace(/^\/+/, "")}`;
  if (normalized === "/.") normalized = "/";
  if (page) return routeFile(outDirectory, normalized);
  const root = resolve(outDirectory);
  const target = resolve(outDirectory, ...normalized.replace(/^\/+/, "").split("/"));
  return target === root || target.startsWith(`${root}${sep}`) ? target : undefined;
}

const COMPONENT_KINDS = new Set([
  "note", "tip", "warning", "danger", "callout", "accordion", "details", "tabs", "tab", "code-group", "code",
  "cards", "card", "table", "version", "version-badge", "shortcut", "kbd", "steps", "image", "video",
]);

function componentIssues(source: string, file: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  let inFence = false;
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (inFence) continue;
    const kind = line.match(/^\s*:::\s+([a-z][\w-]*)\b/i)?.[1]?.toLowerCase();
    if (kind && !COMPONENT_KINDS.has(kind)) issues.push({ kind: "component", file, line: index + 1, message: `Unknown component \`${kind}\`.` });
  }
  return issues;
}

function validationLevel(config: DocsConfig, kind: ValidationKind): "error" | "warning" | "ignore" {
  if (kind === "frontmatter") return config.validation.frontmatter;
  if (kind === "link") return config.validation.brokenLinks;
  if (kind === "asset") return config.validation.missingAssets;
  return config.validation.unknownComponents;
}

function addValidationIssue(issues: ValidationIssue[], config: DocsConfig, issue: ValidationIssue): void {
  const level = validationLevel(config, issue.kind);
  if (level === "ignore") return;
  issues.push({ ...issue, severity: level });
}

export async function validateSite({ cwd = process.cwd(), result }: { cwd?: string; result: BuildResult }): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const docsDirectory = resolve(cwd, result.config.paths.docs);
  const files = (await walk(docsDirectory)).filter((file) => extname(file).toLowerCase() === ".md");
  const documents = new Map(result.documents.map((document) => [document.sourceRelative, document]));
  const base = result.config.paths.base;
  const brandAsset = result.config.branding.logo || result.config.branding.icon;
  if (typeof brandAsset === "string" && isAssetIcon(brandAsset) && !isExternalReference(brandAsset)) {
    const publicDirectory = resolve(cwd, "public");
    const target = resolve(publicDirectory, ...brandAsset.replace(/^[/\\]+/, "").replace(/^public[/\\]+/i, "").split(/[\\/]/).filter(Boolean));
    if (!await exists(target)) addValidationIssue(issues, result.config, { kind: "asset", file: "docshelf.toml", message: `Missing branding asset: ${brandAsset}` });
  }

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const sourceRelative = relative(docsDirectory, file).split(sep).join("/");
    for (const issue of validateFrontmatter(source, sourceRelative)) addValidationIssue(issues, result.config, issue);
    for (const issue of componentIssues(source, sourceRelative)) addValidationIssue(issues, result.config, issue);
    const document = documents.get(sourceRelative);
    if (!document) continue;
    const rendered = renderMarkdown(document, result.documents, base, new Map(), result.config);
    for (const match of rendered.html.matchAll(/\b(href|src|poster)="([^"]+)"/g)) {
      const attribute = match[1] || "href";
      const reference = match[2] || "";
      if (!reference || reference.startsWith("#") || isExternalReference(reference)) continue;
      const pathname = reference.split(/[?#]/)[0] || "/";
      const page = attribute === "href" && (!extname(pathname) || pathname.endsWith("/"));
      const target = outputPathForReference(result.outDirectory, pathname, base, document.route, page);
      if (!target || !await exists(target)) {
        addValidationIssue(issues, result.config, {
          kind: attribute === "href" ? "link" : "asset",
          file: sourceRelative,
          line: lineForValue(source, reference),
          message: `${attribute === "href" ? "Broken link" : "Missing asset"}: ${reference}`,
        });
      }
    }
  }
  return issues;
}

function renderToc(headings: Heading[]): string {
  if (!headings.length) return "";
  return `<aside class="toc"><div class="toc-title">On this page</div>${headings.map((heading) => `<a data-level="${heading.level}" href="#${heading.id}">${escapeHtml(heading.title)}</a>`).join("")}</aside>`;
}

function routeFile(outDirectory: string, route: string): string {
  if (route === "/") return join(outDirectory, "index.html");
  return join(outDirectory, route.replace(/^\/+|\/+$/g, ""), "index.html");
}

function renderLanguageSwitcher(config: DocsConfig, document: DocsDocument | undefined, documents: DocsDocument[], base: string): string {
  if (!config.i18n.enabled || config.i18n.locales.length < 2) return "";
  const current = document?.locale || config.i18n.defaultLocale;
  const links = config.i18n.locales.map((locale) => {
    const match = documents.find((item) => item.locale === locale && item.contentRelative === document?.contentRelative)
      || documents.find((item) => item.locale === locale && item.home);
    if (!match) return "";
    const label = config.i18n.names[locale] || locale;
    return `<a href="${siteUrl(base, match.route)}"${locale === current ? ' aria-current="true"' : ""}>${escapeHtml(label)}</a>`;
  }).filter(Boolean).join("");
  return links ? `<nav class="language-switcher" aria-label="Languages">${links}</nav>` : "";
}

function pageOgPath(document: DocsDocument | undefined): string {
  const route = document?.route || "/404/";
  const clean = route.replace(/^\/+|\/+$/g, "");
  return `/og/${clean || "home"}.svg`;
}

function absoluteUrl(config: DocsConfig, base: string, route: string): string {
  const site = config.site.url.replace(/\/$/, "");
  return site ? `${site}${siteUrl(base, route)}` : siteUrl(base, route);
}

function configuredUrl(config: DocsConfig, base: string, value: string): string {
  if (!value) return "";
  return isExternalReference(value) ? value : absoluteUrl(config, base, value);
}

function renderBreadcrumbs(document: DocsDocument | undefined, home: DocsDocument | undefined, base: string): string {
  if (!document || document.home) return "";
  const homeLink = home ? `<a href="${siteUrl(base, home.route)}">${escapeHtml(home.title)}</a>` : `<a href="${siteUrl(base, "/")}">Home</a>`;
  const group = document.group ? `<span aria-hidden="true">/</span><span>${escapeHtml(document.group)}</span>` : "";
  return `<nav class="breadcrumbs" aria-label="Breadcrumbs">${homeLink}${group}<span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(document.title)}</span></nav>`;
}

function renderEditLink(config: DocsConfig, document: DocsDocument | undefined, base: string, enabled: boolean): string {
  if (!document || !enabled || document.editLink === false) return "";
  if (typeof document.editLink === "string") return `<a class="edit-link" href="${escapeHtml(configuredUrl(config, base, document.editLink))}" target="_blank" rel="noreferrer">Edit this page ↗</a>`;
  if (!config.links.edit) return "";
  const prefix = config.links.edit.replace(/\/$/, "");
  return `<a class="edit-link" href="${escapeHtml(`${prefix}/${document.sourceRelative.split("/").map(encodeURIComponent).join("/")}`)}" target="_blank" rel="noreferrer">Edit this page ↗</a>`;
}

function renderLastUpdated(document: DocsDocument | undefined, enabled: boolean): string {
  if (!document || !enabled || document.lastUpdated === false) return "";
  const value = typeof document.lastUpdated === "string" ? document.lastUpdated : new Date(document.lastModified).toISOString().slice(0, 10);
  return `<time class="last-updated" datetime="${escapeHtml(value)}">Updated ${escapeHtml(value)}</time>`;
}

function renderPage({ config, document, documents, localeDocuments, languageDocuments, base, body, headings, icons, customCss = false, notFound = false }: RenderPageOptions): string {
  const currentRoute = document?.route || "/404/";
  const siteName = asText(config.branding?.title) || asText(config.site.name, DEFAULT_CONFIG.site.name);
  const titleTemplate = asText(config.seo.titleTemplate, "%s · docshelf");
  const titleText = notFound ? "Page not found" : asText(document?.data.seo_title ?? document?.data.seoTitle, document?.title || "Documentation");
  const pageTitle = titleTemplate.includes("%s") ? titleTemplate.replace("%s", titleText) : `${titleText} · ${titleTemplate}`;
  const pageDescription = notFound ? "The page you requested does not exist." : asText(document?.description, asText(document?.data.seo_description ?? document?.data.seoDescription, asText(config.seo.description, asText(config.site.description))));
  const ui = { ...DEFAULT_CONFIG.ui, ...(config.ui || {}) };
  const navigation = { ...DEFAULT_CONFIG.navigation, ...(config.navigation || {}) };
  const search = { ...DEFAULT_CONFIG.search, ...(config.search || {}) };
  const showAnnouncement = config.announcement !== null;
  const announcementConfig = config.announcement || { text: "", href: "", tone: "default" as const };
  const defaultTheme = ["light", "dark", "system"].includes(config.theme?.default) ? config.theme.default : "light";
  const home = localeDocuments.find((item) => item.home) || localeDocuments[0] || documents[0];
  const github = asText(config.links.github);
  const npm = asText(config.links.npm);
  const showSidebar = navigation.sidebar !== false && navigation.sidebarMode !== "none";
  const nav = showSidebar ? renderNavigation(localeDocuments, currentRoute, base) : "";
  const indexUrl = siteUrl(base, `/${search.index.replace(/^[/\\]+/, "")}`);
  const customCssPath = config.paths.customCss.replace(/^[/\\]+/, "");
  const customStylesheet = customCss && customCssPath ? `<link rel="stylesheet" href="${siteUrl(base, `/${customCssPath}`)}">` : "";
  const previous = document ? localeDocuments[localeDocuments.indexOf(document) - 1] : undefined;
  const next = document ? localeDocuments[localeDocuments.indexOf(document) + 1] : undefined;
  const pageNavigation = document?.pageNavigation ?? navigation.pageNavigation;
  const pageToc = document?.toc ?? navigation.toc;
  const pageNav = pageNavigation && document && (previous || next) ? `<nav class="page-nav" aria-label="Page navigation">${previous ? `<a href="${siteUrl(base, previous.route)}"><small>Previous</small><strong>← ${escapeHtml(previous.title)}</strong></a>` : '<span class="empty"></span>'}${next ? `<a href="${siteUrl(base, next.route)}"><small>Next</small><strong>${escapeHtml(next.title)} →</strong></a>` : '<span class="empty"></span>'}</nav>` : "";
  const brandAsset = config.branding.logo || config.branding.icon;
  const favicon = typeof brandAsset === "string" && isAssetIcon(brandAsset) ? isExternalReference(brandAsset) ? brandAsset : siteUrl(base, `/${brandAsset.replace(/^[/\\]+/, "")}`) : "";
  const sidebarFooter = ui.sidebarFooter === false ? "" : `<div class="sidebar-footer"><div class="sidebar-footer-row"><span>static by default</span>${ui.themeToggle !== false && config.theme.allowToggle !== false ? `<span class="dot"></span>${renderThemeButton(config, icons, 14)}` : ""}</div><div class="sidebar-footer-row">${github ? `<a href="${github}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ""}${npm ? `<span class="dot"></span><a href="${npm}" target="_blank" rel="noreferrer">npm ↗</a>` : ""}</div></div>`;
  const siteFooter = ui.footer === false || document?.hideFooter ? "" : `<footer class="site-footer"><div class="site-footer-inner"><span>${escapeHtml(siteName)} · MIT</span><span class="site-footer-links">${github ? `<a href="${github}" target="_blank" rel="noreferrer">GitHub</a>` : ""}${npm ? `<a href="${npm}" target="_blank" rel="noreferrer">npm</a>` : ""}</span></div></footer>`;
  const announcementHref = announcementConfig.href ? configuredUrl(config, base, announcementConfig.href) : siteUrl(base, home?.route || "/");
  const announcement = showAnnouncement ? `<a class="announcement announcement-${escapeHtml(announcementConfig.tone)}" href="${escapeHtml(announcementHref)}"><strong>${escapeHtml(siteName)}</strong> · ${escapeHtml(announcementConfig.text)} <span>→</span></a>` : "";
  const searchOverlay = ui.search === false || search.enabled === false ? "" : `<div class="search-overlay" data-search-overlay data-index-url="${indexUrl}" hidden><div class="search-card" role="dialog" aria-modal="true" aria-label="Search documentation"><div class="search-input-row">${renderIcon(icons, "magnifying-glass", 17) || '<span class="icon-fallback">Search</span>'}<input class="search-input" type="search" role="combobox" aria-controls="search-results" aria-expanded="false" placeholder="Search documentation..." autocomplete="off" data-search-input><button class="search-esc" type="button" data-search-close>Esc</button></div><div class="search-results" id="search-results" role="listbox" data-search-results></div></div></div>`;
  const notFoundBody = notFound ? `<div class="article-body"><p>There is no page at this address.</p><p><a href="${siteUrl(base, home?.route || "/")}">Go back home →</a></p></div>` : `<div class="article-body">${body}</div>${pageToc ? renderToc(headings) : ""}${pageNav}`;
  const configuredCanonical = document?.canonical === false ? "" : typeof document?.canonical === "string" ? configuredUrl(config, base, document.canonical) : config.seo.canonical ? absoluteUrl(config, base, document?.route || "/") : "";
  const pageUrl = absoluteUrl(config, base, document?.route || "/");
  const ogImage = document?.ogImage || config.seo.image || pageOgPath(document);
  const ogImageUrl = configuredUrl(config, base, ogImage);
  const pageRobots = document?.noindex ? "noindex,follow" : config.seo.robots;
  const author = document?.author || config.seo.author;
  const alternateLinks = languageDocuments.map((item) => `<link rel="alternate" hreflang="${escapeHtml(item.locale)}" href="${escapeHtml(absoluteUrl(config, base, item.route))}">`).join("");
  const languageSwitcher = renderLanguageSwitcher(config, document, documents, base);
  const structuredData = config.seo.jsonLd ? JSON.stringify({ "@context": "https://schema.org", "@type": "TechArticle", headline: titleText, description: pageDescription, url: pageUrl, inLanguage: document?.lang || config.i18n.defaultLocale, author: author ? { "@type": "Person", name: author } : undefined }).replace(/</g, "\\u003c") : "";
  const themeInit = `<script>try{const r=document.documentElement,s=localStorage.getItem("docshelf-theme"),d=r.dataset.themeDefault,system=r.dataset.themeRespectSystem!=="false";r.dataset.theme=s==="dark"||s==="light"?s:d==="system"&&system?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):d==="dark"?"dark":"light"}catch{}</script>`;
  const breadcrumbsEnabled = document?.breadcrumbs ?? navigation.breadcrumbs;
  const editLinkEnabled = document?.editLink === true || typeof document?.editLink === "string" ? true : navigation.editLink;
  const lastUpdatedEnabled = document?.lastUpdated === true || typeof document?.lastUpdated === "string" ? true : navigation.lastUpdated;
  const breadcrumbs = breadcrumbsEnabled ? renderBreadcrumbs(document, home, base) : "";
  const editLink = renderEditLink(config, document, base, editLinkEnabled);
  const lastUpdated = renderLastUpdated(document, lastUpdatedEnabled);
  const pageHeader = notFound || document?.hideTitle ? "" : `<header class="article-header">${breadcrumbs}<h1>${escapeHtml(document?.title || "Documentation")}</h1><p class="page-description">${escapeHtml(pageDescription)}</p><div class="page-meta">${lastUpdated}${editLink}</div></header>`;

  return `<!doctype html>
<html lang="${escapeHtml(document?.lang || document?.locale || config.i18n.defaultLocale)}" data-theme="${defaultTheme === "dark" ? "dark" : "light"}" data-theme-default="${defaultTheme}" data-theme-respect-system="${config.theme.respectSystem}">
  <head>
    ${themeInit}
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <meta name="description" content="${escapeHtml(pageDescription)}">
    <meta name="robots" content="${escapeHtml(pageRobots)}">
    ${author ? `<meta name="author" content="${escapeHtml(author)}">` : ""}
    ${configuredCanonical ? `<link rel="canonical" href="${escapeHtml(configuredCanonical)}">` : ""}
    ${alternateLinks}
    <meta property="og:type" content="article">
    <meta property="og:title" content="${escapeHtml(pageTitle)}">
    <meta property="og:description" content="${escapeHtml(pageDescription)}">
    <meta property="og:url" content="${escapeHtml(pageUrl)}">
    <meta property="og:image" content="${escapeHtml(ogImageUrl)}">
    <meta name="twitter:card" content="${escapeHtml(config.seo.twitterCard)}">
    <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
    <meta name="twitter:description" content="${escapeHtml(pageDescription)}">
    <meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">
    <meta name="generator" content="docshelf">
    <title>${escapeHtml(pageTitle)}</title>
    ${favicon ? `<link rel="icon" href="${favicon}">` : ""}
    <link rel="stylesheet" href="${siteUrl(base, "/assets/docshelf.css")}">
    ${customStylesheet}
  </head>
  <body class="${[document?.home ? "home-page" : "", showAnnouncement ? "" : "no-announcement", showSidebar ? "" : "no-sidebar", document?.layout ? `layout-${slugify(document.layout)}` : ""].filter(Boolean).join(" ")}">
    ${announcement}
    <header class="mobile-bar">
      <a class="brand" href="${siteUrl(base, home?.route || "/")}">${renderLogo(siteName, config, icons, base)}</a>
      <div class="mobile-actions">
        ${renderSearchButton(config, icons)}
        ${renderThemeButton(config, icons, 16)}
        ${renderMenuButton(config, icons)}
      </div>
    </header>
    <div class="site-shell">
      ${showSidebar ? `<aside class="sidebar">
        <a class="brand" href="${siteUrl(base, home?.route || "/")}">${renderLogo(siteName, config, icons, base)}</a>
        ${renderSearchButton(config, icons, true)}
        ${languageSwitcher}
        <nav class="sidebar-nav" aria-label="Documentation">${nav}</nav>
        ${sidebarFooter}
      </aside>` : ""}
      ${showSidebar ? `<div class="mobile-panel" data-mobile-panel hidden><nav class="sidebar-nav" aria-label="Mobile documentation">${nav}</nav></div>` : ""}
      <main class="main">
        <div class="content-wrap">
          <article class="page">
            ${notFound ? `<header class="article-header"><h1>Page not found</h1><p class="page-description">${escapeHtml(pageDescription)}</p></header>` : pageHeader}
            ${notFoundBody}
          </article>
        </div>
        ${siteFooter}
      </main>
    </div>
    ${searchOverlay}
    ${structuredData ? `<script type="application/ld+json">${structuredData}</script>` : ""}
    <script src="${siteUrl(base, "/assets/docshelf.js")}" defer></script>
  </body>
</html>`;
}

async function copyDirectory(source: string, destination: string): Promise<number> {
  if (!await exists(source)) return 0;
  let copied = 0;
  for (const file of await walk(source)) {
    const target = join(destination, relative(source, file));
    await fs.mkdir(join(target, ".."), { recursive: true });
    await fs.copyFile(file, target);
    copied += 1;
  }
  return copied;
}

function searchItem(document: DocsDocument, rendered: RenderedMarkdown, base: string, includeCode: boolean): SearchItem {
  const searchableHtml = includeCode ? rendered.html : rendered.html.replace(/<pre[\s\S]*?<\/pre>/g, "");
  return {
    title: document.title,
    description: document.description,
    path: siteUrl(base, document.route),
    text: stripMarkup(searchableHtml),
    headings: rendered.headings.map((heading) => heading.title),
    locale: document.locale,
  };
}

function escapeXml(value: unknown): string {
  return asText(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] || character);
}

function ogImageSvg(config: DocsConfig, title: string, description: string): string {
  const siteName = config.branding.title || config.site.name;
  const trim = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#fbfaf8"/><rect x="72" y="72" width="1056" height="486" rx="24" fill="#ffffff" stroke="#e8e4df"/><rect x="112" y="112" width="42" height="42" rx="11" fill="#1f1c19"/><path d="M125 126h16v16h-16z" fill="#fbfaf8"/><text x="176" y="143" fill="#756e67" font-family="ui-sans-serif,system-ui" font-size="22">${escapeXml(trim(siteName, 42))}</text><text x="112" y="285" fill="#262320" font-family="ui-sans-serif,system-ui" font-size="58" font-weight="700">${escapeXml(trim(title, 38))}</text><text x="112" y="340" fill="#756e67" font-family="ui-sans-serif,system-ui" font-size="25">${escapeXml(trim(description, 70))}</text><rect x="112" y="478" width="976" height="1" fill="#e8e4df"/><text x="112" y="520" fill="#aaa39c" font-family="ui-monospace,monospace" font-size="18">${escapeXml(config.site.tagline)}</text></svg>`;
}

function sitemapXml(config: DocsConfig, documents: DocsDocument[], base: string): string {
  const site = config.site.url.replace(/\/$/, "");
  const urls = documents.map((document) => `<url><loc>${escapeXml(`${site}${siteUrl(base, document.route)}`)}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

function rssXml(config: DocsConfig, documents: DocsDocument[], base: string): string {
  const site = config.site.url.replace(/\/$/, "");
  const items = documents.map((document) => `<item><title>${escapeXml(document.title)}</title><link>${escapeXml(`${site}${siteUrl(base, document.route)}`)}</link><guid>${escapeXml(`${site}${siteUrl(base, document.route)}`)}</guid><description>${escapeXml(document.description || config.site.description)}</description></item>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${escapeXml(config.site.name)}</title><link>${escapeXml(site)}</link><description>${escapeXml(config.site.description)}</description>${items}</channel></rss>\n`;
}

export async function loadConfig(cwd = process.cwd()): Promise<DocsConfig> {
  const configFile = join(cwd, "docshelf.toml");
  if (!await exists(configFile)) return mergeConfig();
  try {
    const parsed = load(await fs.readFile(configFile, "utf8"));
    return mergeConfig(parsed);
  } catch (error) {
    if (error instanceof SyntaxParseError) throw new Error(`Invalid docshelf.toml: ${error.message}\nHint: fix the reported line or create a fresh example in another folder with \`docshelf init\`.`);
    throw error;
  }
}

function table(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function validationSetting(value: unknown, fallback: "error" | "warning" | "ignore"): "error" | "warning" | "ignore" {
  return value === "error" || value === "warning" || value === "ignore" ? value : fallback;
}

function mergeConfig(input: unknown = {}): DocsConfig {
  const config = table(input);
  const site = table(config.site);
  const announcement = table(config.announcement);
  const branding = table(config.branding);
  const icons = table(config.icons);
  const theme = table(config.theme);
  const ui = table(config.ui);
  const navigation = table(config.navigation);
  const markdown = table(config.markdown);
  const search = table(config.search);
  const paths = table(config.paths);
  const links = table(config.links);
  const i18n = table(config.i18n);
  const seo = table(config.seo);
  const feeds = table(config.feeds);
  const validation = table(config.validation);
  const locales = Array.isArray(i18n.locales) ? i18n.locales.map(String).filter(Boolean) : DEFAULT_CONFIG.i18n.locales;
  const defaultLocale = asText(i18n.default_locale ?? i18n.defaultLocale, DEFAULT_CONFIG.i18n.defaultLocale);
  const hasAnnouncement = Object.prototype.hasOwnProperty.call(config, "announcement") && Boolean(config.announcement);
  const legacyAnnouncement = typeof site.announcement === "string" ? site.announcement : "";
  const announcementTone: AnnouncementConfig["tone"] = ["default", "info", "success", "warning"].includes(asText(announcement.tone)) ? asText(announcement.tone) as AnnouncementConfig["tone"] : "default";
  const announcementConfig = hasAnnouncement ? {
    text: asText(announcement.text, asText(site.tagline, DEFAULT_CONFIG.site.tagline)),
    href: asText(announcement.href),
    tone: announcementTone,
  } : legacyAnnouncement && ui.announcement !== false ? {
    text: legacyAnnouncement,
    href: "",
    tone: "default" as const,
  } : null;
  return {
    site: {
      name: asText(site.name, DEFAULT_CONFIG.site.name),
      tagline: asText(site.tagline, DEFAULT_CONFIG.site.tagline),
      description: asText(site.description, DEFAULT_CONFIG.site.description),
      url: asText(site.url, DEFAULT_CONFIG.site.url),
    },
    announcement: announcementConfig,
    branding: {
      title: asText(branding.title),
      icon: branding.icon === false ? false : asText(branding.icon, DEFAULT_CONFIG.branding.icon as string),
      logo: asText(branding.logo),
      logoAlt: asText(branding.logo_alt ?? branding.logoAlt),
      subtitle: asText(branding.subtitle),
    },
    icons: {
      enabled: icons.enabled !== false,
      library: asText(icons.library, DEFAULT_CONFIG.icons.library),
      weight: ["thin", "light", "regular", "bold", "fill", "duotone"].includes(asText(icons.weight)) ? asText(icons.weight) as DocsConfig["icons"]["weight"] : DEFAULT_CONFIG.icons.weight,
    },
    theme: {
      default: ["light", "dark", "system"].includes(asText(theme.default)) ? asText(theme.default) as DocsConfig["theme"]["default"] : DEFAULT_CONFIG.theme.default,
      respectSystem: theme.respect_system !== false && theme.respectSystem !== false,
      allowToggle: theme.allow_toggle !== false && theme.allowToggle !== false,
    },
    ui: {
      search: ui.search !== false,
      themeToggle: (ui.theme_toggle ?? ui.themeToggle) !== false,
      footer: ui.footer !== false,
      sidebarFooter: (ui.sidebar_footer ?? ui.sidebarFooter) !== false,
    },
    navigation: {
      sidebar: navigation.sidebar !== false,
      sidebarMode: ["auto", "none"].includes(asText(navigation.sidebar_mode ?? navigation.sidebarMode)) ? asText(navigation.sidebar_mode ?? navigation.sidebarMode) as DocsConfig["navigation"]["sidebarMode"] : DEFAULT_CONFIG.navigation.sidebarMode,
      toc: (navigation.toc ?? ui.toc ?? DEFAULT_CONFIG.navigation.toc) !== false,
      breadcrumbs: navigation.breadcrumbs !== false,
      pageNavigation: (navigation.page_navigation ?? navigation.pageNavigation ?? ui.page_navigation ?? DEFAULT_CONFIG.navigation.pageNavigation) !== false,
      editLink: navigation.edit_link === true || navigation.editLink === true,
      lastUpdated: navigation.last_updated === true || navigation.lastUpdated === true,
    },
    markdown: {
      syntaxHighlighting: markdown.syntax_highlighting !== false && markdown.syntaxHighlighting !== false,
      lineNumbers: markdown.line_numbers === true || markdown.lineNumbers === true,
      headingAnchors: markdown.heading_anchors !== false && markdown.headingAnchors !== false,
      smartTypography: markdown.smart_typography === true || markdown.smartTypography === true,
    },
    search: {
      enabled: search.enabled !== false,
      provider: "local",
      includeCode: search.include_code === true || search.includeCode === true,
      index: asText(search.index, DEFAULT_CONFIG.search.index),
    },
    paths: {
      docs: asText(paths.docs, DEFAULT_CONFIG.paths.docs),
      output: asText(paths.output ?? paths.out, DEFAULT_CONFIG.paths.output),
      base: asText(paths.base, DEFAULT_CONFIG.paths.base),
      customCss: asText(paths.custom_css ?? paths.customCss, DEFAULT_CONFIG.paths.customCss),
    },
    links: {
      github: asText(links.github),
      npm: asText(links.npm),
      edit: asText(links.edit),
    },
    i18n: {
      enabled: i18n.enabled === true,
      defaultLocale,
      locales: locales.includes(defaultLocale) ? locales : [defaultLocale, ...locales],
      names: { ...DEFAULT_CONFIG.i18n.names, ...table(i18n.names) as Record<string, string> },
    },
    seo: {
      titleTemplate: asText(seo.title_template ?? seo.titleTemplate, DEFAULT_CONFIG.seo.titleTemplate),
      image: asText(seo.image),
      description: asText(seo.description),
      author: asText(seo.author),
      twitterCard: seo.twitter_card === "summary" ? "summary" : DEFAULT_CONFIG.seo.twitterCard,
      robots: asText(seo.robots, DEFAULT_CONFIG.seo.robots),
      canonical: seo.canonical !== false,
      jsonLd: seo.json_ld !== false && seo.jsonLd !== false,
      generateOgImage: seo.generate_og_image !== false && seo.generateOgImage !== false,
    },
    feeds: {
      sitemap: feeds.sitemap !== false,
      rss: feeds.rss !== false,
    },
    validation: {
      brokenLinks: validationSetting(validation.broken_links ?? validation.brokenLinks, DEFAULT_CONFIG.validation.brokenLinks),
      missingAssets: validationSetting(validation.missing_assets ?? validation.missingAssets, DEFAULT_CONFIG.validation.missingAssets),
      frontmatter: validationSetting(validation.frontmatter, DEFAULT_CONFIG.validation.frontmatter),
      unknownComponents: validationSetting(validation.unknown_components ?? validation.unknownComponents, DEFAULT_CONFIG.validation.unknownComponents),
    },
  };
}

function applyBuildOverrides(loaded: DocsConfig, overrides: BuildOptions["overrides"] = {}): DocsConfig {
  return {
    ...loaded,
    paths: {
      ...loaded.paths,
      docs: overrides.docs ?? loaded.paths.docs,
      output: overrides.out ?? loaded.paths.output,
      base: overrides.base ?? loaded.paths.base,
    },
  };
}

export async function buildSite({ cwd = process.cwd(), overrides = {} }: BuildOptions = {}): Promise<BuildResult> {
  const startedAt = performance.now();
  const config = applyBuildOverrides(await loadConfig(cwd), overrides);
  const docsDirectory = resolve(cwd, config.paths.docs);
  const outDirectory = resolve(cwd, config.paths.output);
  if (!await exists(docsDirectory)) throw new Error(`Docs directory not found: ${config.paths.docs}\nHint: run \`docshelf init\` or set DOCSHELF_DOCS to the folder containing your Markdown files.`);

  const documents = await readDocuments(docsDirectory, config);
  if (!documents.length) throw new Error(`No Markdown files found in ${config.paths.docs}\nHint: add an index.md file, then run \`docshelf dev\` again.`);
  const base = normalizeBase(config.paths.base);
  const componentIcons = documents.flatMap((document) => [...document.content.matchAll(/\bicon\s*=\s*["']([^"']+)["']/g)].map((match) => match[1] || ""));
  const icons = await loadIcons(config, cwd, componentIcons);
  await fs.rm(outDirectory, { recursive: true, force: true });
  await fs.mkdir(outDirectory, { recursive: true });
  const assets = await copyDirectory(join(cwd, "public"), outDirectory);
  await fs.mkdir(join(outDirectory, "assets"), { recursive: true });
  await fs.writeFile(join(outDirectory, "assets", "docshelf.css"), DEFAULT_CSS);
  await fs.writeFile(join(outDirectory, "assets", "docshelf.js"), CLIENT_JS);

  const customCss = await exists(join(cwd, "public", config.paths.customCss));
  const search: SearchItem[] = [];
  for (const document of documents) {
    const localeDocuments = documents.filter((item) => item.locale === document.locale);
    const languageDocuments = documents.filter((item) => item.contentRelative === document.contentRelative);
    const rendered = renderMarkdown(document, documents, base, icons, config);
    const page = renderPage({ config, document, documents, localeDocuments, languageDocuments, base, body: rendered.html, headings: rendered.headings, icons, customCss });
    const target = routeFile(outDirectory, document.route);
    await fs.mkdir(join(target, ".."), { recursive: true });
    await fs.writeFile(target, page);
    search.push(searchItem(document, rendered, base, config.search.includeCode));
    if (config.seo.generateOgImage) {
      const ogTarget = join(outDirectory, pageOgPath(document).replace(/^\/+/, ""));
      await fs.mkdir(join(ogTarget, ".."), { recursive: true });
      await fs.writeFile(ogTarget, ogImageSvg(config, document.title, document.description));
    }
  }

  const defaultDocuments = documents.filter((item) => item.locale === config.i18n.defaultLocale);
  const notFound = renderPage({ config, documents, localeDocuments: defaultDocuments, languageDocuments: [], base, body: "", headings: [], icons, customCss, notFound: true });
  await fs.writeFile(join(outDirectory, "404.html"), notFound);
  if (config.seo.generateOgImage) {
    const ogTarget = join(outDirectory, pageOgPath(undefined).replace(/^\/+/, ""));
    await fs.mkdir(join(ogTarget, ".."), { recursive: true });
    await fs.writeFile(ogTarget, ogImageSvg(config, "Page not found", "The page you requested does not exist."));
  }
  const searchIndexPath = config.search.index.replace(/^[/\\]+/, "");
  await fs.mkdir(join(outDirectory, searchIndexPath, ".."), { recursive: true });
  await fs.writeFile(join(outDirectory, searchIndexPath), `${JSON.stringify(search, null, 2)}\n`);
  await fs.writeFile(join(outDirectory, ".nojekyll"), "");
  const site = config.site.url.replace(/\/$/, "");
  if (site && config.feeds.sitemap) await fs.writeFile(join(outDirectory, "sitemap.xml"), sitemapXml(config, documents, base));
  if (site && config.feeds.rss) await fs.writeFile(join(outDirectory, "rss.xml"), rssXml(config, documents, base));
  if (site) await fs.writeFile(join(outDirectory, "robots.txt"), `User-agent: *\nAllow: /\n${config.feeds.sitemap ? `Sitemap: ${site}/sitemap.xml\n` : ""}`);
  return { config, documents, outDirectory, files: documents.length + assets, assets, durationMs: Math.round(performance.now() - startedAt) };
}

export interface InitResult {
  created: string[];
  detected: string[];
}

export async function initProject({ cwd = process.cwd(), force = false }: { cwd?: string; force?: boolean } = {}): Promise<InitResult> {
  const created: string[] = [];
  const detected: string[] = [];
  for (const name of ["package.json", "docs", "docshelf.toml"]) {
    if (await exists(join(cwd, name))) detected.push(name);
  }
  for (const [name, content] of Object.entries(STARTER_FILES)) {
    const target = join(cwd, name);
    if (!force && await exists(target)) continue;
    await fs.mkdir(join(target, ".."), { recursive: true });
    await fs.writeFile(target, content);
    created.push(name);
  }
  return { created, detected };
}

function mimeType(file: string): string {
  return ({
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
  })[extname(file).toLowerCase()] || "application/octet-stream";
}

async function serveFile(request: IncomingMessage, response: ServerResponse, outDirectory: string, base: string): Promise<void> {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  let pathname = decodeURIComponent(requestUrl.pathname);
  const cleanBase = normalizeBase(base);
  if (cleanBase && (pathname === cleanBase || pathname.startsWith(`${cleanBase}/`))) pathname = pathname.slice(cleanBase.length) || "/";
  const parts = pathname.split("/").filter(Boolean);
  const candidate = resolve(outDirectory, ...parts);
  const root = resolve(outDirectory);
  if (candidate !== root && !candidate.toLowerCase().startsWith(`${root.toLowerCase()}${sep}`)) {
    response.writeHead(400); response.end("Bad request"); return;
  }

  let file = candidate;
  try {
    const stats = await fs.stat(file);
    if (stats.isDirectory()) file = join(file, "index.html");
  } catch {
    if (!extname(file)) file = join(file, "index.html");
  }
  let status = 200;
  if (!await exists(file)) {
    file = join(outDirectory, "404.html");
    status = 404;
  }
  response.setHeader("content-type", mimeType(file));
  response.writeHead(status);
  response.end(await fs.readFile(file));
}

const WATCH_IGNORED = new Set([".git", "node_modules", "dist", "build", ".cache", ".tmp", "tmp", "temp"]);

function ignoredWatchPath(file: string): boolean {
  return file.split(/[\\/]/).some((part) => WATCH_IGNORED.has(part) || part.endsWith(".tmp") || part.endsWith("~"));
}

async function watchDirectoryTree(root: string, onChange: () => void): Promise<() => void> {
  const watchers = new Map<string, FSWatcher>();
  const addDirectory = async (directory: string): Promise<void> => {
    if (ignoredWatchPath(directory) || watchers.has(directory)) return;
    const stats = await fs.stat(directory).catch(() => undefined);
    if (!stats?.isDirectory()) return;
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const watcher = watch(directory, (_event, filename) => {
      const name = filename?.toString() || "";
      const changed = name ? join(directory, name) : directory;
      if (ignoredWatchPath(changed)) return;
      onChange();
      if (name) void addDirectory(changed);
    });
    watcher.on("error", () => watchers.delete(directory));
    watchers.set(directory, watcher);
    await Promise.all(entries.filter((entry) => entry.isDirectory()).map((entry) => addDirectory(join(directory, entry.name))));
  };
  await addDirectory(root);
  return () => {
    for (const watcher of watchers.values()) watcher.close();
    watchers.clear();
  };
}

async function watchProject(cwd: string, config: DocsConfig, onChange: () => void): Promise<() => void> {
  const stops: Array<() => void> = [];
  for (const root of [resolve(cwd, config.paths.docs), resolve(cwd, "public")]) {
    if (await exists(root)) stops.push(await watchDirectoryTree(root, onChange));
  }
  const configWatcher = watch(cwd, (_event, filename) => {
    if (filename?.toString() === "docshelf.toml") onChange();
  });
  configWatcher.on("error", () => configWatcher.close());
  stops.push(() => configWatcher.close());
  return () => stops.splice(0).forEach((stop) => stop());
}

function openBrowser(url: string): void {
  const command = process.platform === "win32" ? "cmd" : process.platform === "darwin" ? "open" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const browser = spawn(command, args, { detached: true, stdio: "ignore" });
  browser.on("error", () => console.error(`${warning("!")} Could not open the browser automatically. Open ${url} manually.`));
  browser.unref();
}

export async function serveSite({ cwd = process.cwd(), mode = "preview", overrides = {}, port = 4173, host = "localhost", open = false }: ServeOptions = {}): Promise<void> {
  const initialBuild = mode === "dev" ? await buildSite({ cwd, overrides }) : undefined;
  let config = initialBuild?.config || applyBuildOverrides(await loadConfig(cwd), overrides);
  let outDirectory = initialBuild?.outDirectory || resolve(cwd, config.paths.output);
  if (!await exists(outDirectory)) throw new Error(`Build output not found: ${config.paths.output}\nHint: run \`docshelf build\` before \`docshelf preview\`.`);

  const server = createServer((request, response) => {
    serveFile(request, response, outDirectory, config.paths.base).catch((error) => {
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(error.message);
    });
  });
  await new Promise<void>((resolveServer, reject) => {
    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        reject(new Error(`Port ${port} is already in use on ${host}. Choose another port with --port.`));
        return;
      }
      reject(error);
    };
    server.once("error", onError);
    server.listen({ port, host }, () => {
      server.off("error", onError);
      resolveServer();
    });
  });
  const shownHost = host === "0.0.0.0" ? "localhost" : host;
  const localUrl = `http://${shownHost}:${port}${siteUrl(config.paths.base, "/")}`;
  console.log(`\n${heading(`docshelf ${mode}`)}`);
  console.log(`  ${success("local")}  ${localUrl}`);
  console.log(`  ${muted("source")} ${config.paths.docs}`);
  if (mode === "dev") console.log(`  ${muted("stop")}   Ctrl+C`);
  if (open) openBrowser(localUrl);

  let stopWatching: () => void = () => undefined;
  if (mode === "dev") {
    let timer: NodeJS.Timeout | undefined;
    let building = false;
    let queued = false;
    const rebuild = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void runBuild(), 120);
    };
    const runBuild = async (): Promise<void> => {
      if (building) {
        queued = true;
        return;
      }
      building = true;
      try {
        const result = await buildSite({ cwd, overrides });
        config = result.config;
        outDirectory = result.outDirectory;
        stopWatching();
        stopWatching = await watchProject(cwd, config, rebuild);
        console.log(`${success("✓")} Rebuilt ${result.documents.length} pages, ${result.assets} assets in ${result.durationMs} ms`);
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : String(caught);
        console.error(`${error("×")} Build failed\n${message.split("\n").map((line) => `  ${line}`).join("\n")}`);
      } finally {
        building = false;
        if (queued) {
          queued = false;
          rebuild();
        }
      }
    };
    stopWatching = await watchProject(cwd, config, rebuild);
  }
  await new Promise<void>((resolveServer) => {
    const close = () => {
      stopWatching();
    server.close(() => resolveServer());
    };
    process.once("SIGINT", close);
    process.once("SIGTERM", close);
  });
}

export { DEFAULT_CSS, CLIENT_JS };
