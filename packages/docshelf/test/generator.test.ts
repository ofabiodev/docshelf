import test from "node:test";
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseArgs, run } from "../src/cli.js";
import { DEFAULT_CSS, buildSite, initProject, loadConfig, parseFrontmatter, renderComponents, routeForSource, siteUrl, slugify, validateFrontmatter, validateSite } from "../src/index.js";

test("parses command options without a parser dependency", () => {
  assert.deepEqual(parseArgs(["--help"]), { help: true });
  assert.deepEqual(parseArgs(["--base", "/docs", "--port=4173", "--open"]), { base: "/docs", port: 4173, open: true });
});

test("initializes around an existing project without replacing files", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.writeFile(join(cwd, "package.json"), "{}\n");
    await fs.mkdir(join(cwd, "docs"));
    await fs.writeFile(join(cwd, "docs", "index.md"), "# Keep this page\n");
    const result = await initProject({ cwd });
    assert.deepEqual(result.detected, ["package.json", "docs"]);
    assert.ok(result.created.includes("docshelf.toml"));
    assert.ok(result.created.includes(".gitignore"));
    assert.equal(await fs.readFile(join(cwd, "docs", "index.md"), "utf8"), "# Keep this page\n");
    assert.equal(await fs.readFile(join(cwd, ".gitignore"), "utf8"), "node_modules/\ndist/\n");
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("uses ambient build settings for CI", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  const previousOut = process.env.DOCSHELF_OUT;
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.writeFile(join(cwd, "docs", "index.md"), "---\ntitle: Home\n---\n\nHello\n");
    process.env.DOCSHELF_OUT = "site-output";
    assert.equal(await run(["build"], cwd), 0);
    assert.ok(await fs.stat(join(cwd, "site-output", "index.html")));
  } finally {
    if (previousOut === undefined) delete process.env.DOCSHELF_OUT;
    else process.env.DOCSHELF_OUT = previousOut;
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("parses the small frontmatter contract", () => {
  const result = parseFrontmatter(`---\ntitle: "Install"\norder: 2\nhome: true\n---\n\nBody`);
  assert.deepEqual(result.data, { title: "Install", order: 2, home: true });
  assert.equal(result.content, "Body");
});

test("reports invalid frontmatter with useful locations", () => {
  const issues = validateFrontmatter("---\ntitle: \norder: many\nunknown: true\ntitle: Again\n---\n\nBody", "docs/example.md");
  assert.equal(issues.length, 4);
  assert.match(issues[0]?.message || "", /title/);
  assert.equal(issues[0]?.line, 2);
  assert.match(issues[1]?.message || "", /order/);
  assert.match(issues[2]?.message || "", /Unknown key/);
  assert.match(issues[3]?.message || "", /Duplicate/);
});

test("maps Markdown files to clean static routes", () => {
  assert.equal(routeForSource("index.md"), "/");
  assert.equal(routeForSource("guides/install.md"), "/guides/install/");
  assert.equal(routeForSource("guides/index.md"), "/guides/");
});

test("keeps anchors and project-site bases predictable", () => {
  assert.equal(slugify("Hello, world!"), "hello-world");
  assert.equal(siteUrl("/docshelf", "/guides/install/"), "/docshelf/guides/install/");
  assert.equal(siteUrl("", "/"), "/");
});

test("keeps narrow layouts inside the viewport", () => {
  assert.match(DEFAULT_CSS, /100dvh/);
  assert.match(DEFAULT_CSS, /safe-area-inset/);
  assert.match(DEFAULT_CSS, /table-wrap/);
  assert.match(DEFAULT_CSS, /max-width: 380px/);
});

test("renders the official Phosphor asset and configurable UI", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.writeFile(join(cwd, "docshelf.toml"), `[site]\nname = "fallback"\nannouncement = false\n\n[branding]\ntitle = "Acme Docs"\nicon = "rocket"\n\n[icons]\nweight = "duotone"\n\n[theme]\ndefault = "dark"\n\n[ui]\nannouncement = true\nsearch = false\ntheme_toggle = false\ntoc = false\npage_navigation = false\nfooter = false\nsidebar_footer = false\n`);
    await fs.writeFile(join(cwd, "docs", "index.md"), "---\ntitle: Home\n---\n\n## Hello\n");
    await buildSite({ cwd });
    const html = await fs.readFile(join(cwd, "dist", "index.html"), "utf8");
    const css = await fs.readFile(join(cwd, "dist", "assets", "docshelf.css"), "utf8");
    assert.match(html, /data-theme="dark"/);
    assert.match(html, /Acme Docs/);
    assert.match(html, /viewBox="0 0 256 256"/);
    assert.match(html, /opacity="0.2"/);
    assert.match(html, /<meta name="color-scheme" content="light dark">/);
    assert.match(css, /\.icon \{ fill: currentColor; \}/);
    assert.match(css, /\.article-body a\.docs-card/);
    assert.doesNotMatch(html, /__simple_docs/);
    assert.doesNotMatch(html, /class="announcement"/);
    assert.doesNotMatch(html, /data-search-overlay/);
    assert.doesNotMatch(html, /data-theme-toggle/);
    assert.doesNotMatch(html, /tiny static docs/);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("can disable the built-in icon package", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.writeFile(join(cwd, "docshelf.toml"), "[icons]\nenabled = false\n");
    await fs.writeFile(join(cwd, "docs", "index.md"), "---\ntitle: Home\n---\n\nHello\n");
    await buildSite({ cwd });
    const html = await fs.readFile(join(cwd, "dist", "index.html"), "utf8");
    assert.doesNotMatch(html, /<svg class="icon"/);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("renders the real Markdown components and generated metadata", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.writeFile(join(cwd, "docshelf.toml"), `[site]\nname = "Components"\nurl = "https://docs.example.com"\n\n[i18n]\nenabled = true\ndefault_locale = "en"\nlocales = ["en", "pt-BR"]\n`);
    await fs.mkdir(join(cwd, "docs", "en"));
    await fs.mkdir(join(cwd, "docs", "pt-BR"));
    const content = `---\ntitle: Components\ndescription: Every component.\n---\n\n::: accordion title="More" open\nDetails.\n:::\n\n\`\`\`ts\nconst answer = 42;\n\`\`\`\n\n::: tabs\n::: tab npm\nNpm content.\n:::\n::: tab Bun\nBun content.\n:::\n:::\n\n::: cards\n::: card title="Start" href="guide.md" icon="rocket"\nCard.\n:::\n:::\n\n::: table\n| Name | Type |\n| --- | --- |\n| id | string |\n:::\n\n::: image src="/diagram.png" alt="Diagram" caption="A diagram"\n:::\n\n::: video src="/demo.mp4" caption="A demo"\n:::\n`;
    await fs.writeFile(join(cwd, "docs", "en", "index.md"), content);
    await fs.writeFile(join(cwd, "docs", "pt-BR", "index.md"), content.replace("Components", "Componentes"));
    const result = await buildSite({ cwd });
    assert.equal(result.assets, 0);
    assert.ok(result.durationMs >= 0);
    const html = await fs.readFile(join(cwd, "dist", "index.html"), "utf8");
    assert.match(html, /docs-accordion/);
    assert.match(html, /docs-tabs/);
    assert.match(html, /docs-cards/);
    assert.match(html, /docs-table/);
    assert.doesNotMatch(html, /docs-file-tree|docs-api-table|docs-properties/);
    assert.match(html, /hljs-keyword/);
    assert.match(html, /docs-image/);
    assert.match(html, /docs-video/);
    assert.match(html, /hreflang="pt-BR"/);
    assert.match(html, /og:image/);
    assert.match(await fs.readFile(join(cwd, "dist", "sitemap.xml"), "utf8"), /https:\/\/docs\.example\.com/);
    assert.match(await fs.readFile(join(cwd, "dist", "rss.xml"), "utf8"), /<rss/);
    assert.match(await fs.readFile(join(cwd, "dist", "search-index.json"), "utf8"), /Every component/);
    assert.equal((await loadConfig(cwd)).paths.output, "dist");
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("renders table, version, and shortcut components", () => {
  const source = [
    "::: table",
    "| Name | Type |",
    "| --- | --- |",
    "| size | string |",
    ":::",
    "",
    "::: version version=\"1.2.0\" prefix=\"since\"",
    ":::",
    "",
    "::: shortcut keys=\"Ctrl+K\" label=\"Open search\"",
    ":::",
  ].join("\n");
  const html = renderComponents(source, { markdown: (value) => value });
  assert.match(html, /docs-table/);
  assert.doesNotMatch(html, /docs-properties|docs-property-required/);
  assert.match(html, /docs-version-badge/);
  assert.match(html, /docs-shortcut/);
});

test("finds broken links and missing assets", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.mkdir(join(cwd, "public"));
    await fs.writeFile(join(cwd, "docs", "index.md"), "---\ntitle: Home\n---\n\n[Missing](missing.md)\n\n![Missing](/missing.png)\n");
    const result = await buildSite({ cwd });
    const issues = await validateSite({ cwd, result });
    assert.equal(issues.length, 2);
    assert.equal(issues[0]?.kind, "link");
    assert.equal(issues[1]?.kind, "asset");
    assert.match(issues[0]?.message || "", /missing\.md/);
    assert.match(issues[1]?.message || "", /missing\.png/);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("uses organized config sections, custom branding assets, and page frontmatter", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.mkdir(join(cwd, "public"));
    await fs.writeFile(join(cwd, "public", "logo.svg"), '<svg viewBox="0 0 10 10"><path fill="currentColor" d="M0 0h10v10H0z"/></svg>');
    await fs.writeFile(join(cwd, "docshelf.toml"), `[announcement]\ntext = "New release"\n\n[branding]\nicon = "logo.svg"\n\n[theme]\ndefault = "system"\nrespect_system = false\nallow_toggle = false\n\n[navigation]\ntoc = false\nbreadcrumbs = false\npage_navigation = false\n\n[markdown]\nline_numbers = true\n\n[seo]\nauthor = "Docs team"\n\n[validation]\nbroken_links = "warning"\n`);
    await fs.writeFile(join(cwd, "docs", "index.md"), `---\ntitle: Home\nslug: /start/\nsidebar_label: Start\nlayout: showcase\nhide_footer: true\nnoindex: true\n---\n\n# Hello\n\n\`\`\`ts\nconst answer = 42\n\`\`\`\n`);
    const result = await buildSite({ cwd });
    const html = await fs.readFile(join(cwd, "dist", "start", "index.html"), "utf8");
    assert.match(html, /New release/);
    assert.match(html, /viewBox="0 0 10 10"/);
    assert.match(html, /data-theme-respect-system="false"/);
    assert.doesNotMatch(html, /data-theme-toggle/);
    assert.match(html, /name="robots" content="noindex,follow"/);
    assert.match(html, /name="author" content="Docs team"/);
    assert.match(html, /code-line-numbers/);
    assert.doesNotMatch(html, /class="breadcrumbs"/);
    assert.doesNotMatch(html, /class="site-footer"/);
    assert.equal(result.documents[0]?.sidebarTitle, "Start");
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test("applies validation levels from docshelf.toml", async () => {
  const cwd = await fs.mkdtemp(join(tmpdir(), "docshelf-"));
  try {
    await fs.mkdir(join(cwd, "docs"));
    await fs.writeFile(join(cwd, "docshelf.toml"), "[validation]\nbroken_links = \"warning\"\n");
    await fs.writeFile(join(cwd, "docs", "index.md"), "---\ntitle: Home\n---\n\n[Missing](missing.md)\n");
    const result = await buildSite({ cwd });
    const issues = await validateSite({ cwd, result });
    assert.equal(issues.length, 1);
    assert.equal(issues[0]?.severity, "warning");
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});
