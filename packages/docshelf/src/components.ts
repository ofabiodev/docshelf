import type { IconSet } from "./icons.js";

interface MarkdownBlock {
  type: "markdown";
  value: string;
}

interface ComponentBlock {
  type: "component";
  kind: string;
  attributes: Record<string, string | boolean>;
  children: Block[];
}

type Block = MarkdownBlock | ComponentBlock;

export interface ComponentRenderOptions {
  markdown: (source: string) => string;
  icon?: (icons: IconSet, name: string, size: number) => string;
  icons?: IconSet;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

function safeUrl(value: string): string {
  const url = value.trim();
  return /^(?:javascript:|data:|vbscript:)/i.test(url) ? "#" : url || "#";
}

function parseAttributes(source: string): Record<string, string | boolean> {
  const attributes: Record<string, string | boolean> = {};
  const pattern = /([\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+)))?/g;
  for (const match of source.matchAll(pattern)) {
    const key = match[1];
    if (!key) continue;
    attributes[key] = match[2] ?? match[3] ?? match[4] ?? true;
  }
  return attributes;
}

function parseHeader(source: string): { kind: string; attributes: Record<string, string | boolean> } {
  const match = source.trim().match(/^([a-z][\w-]*)(?:\s+([\s\S]*))?$/i);
  if (!match?.[1]) return { kind: "content", attributes: {} };
  const kind = match[1].toLowerCase();
  const attributes = parseAttributes(match[2] || "");
  const firstBare = (match[2] || "").trim().match(/^(?:"([^"]+)"|'([^']+)'|([^\s]+))/);
  if (firstBare && !Object.keys(attributes).some((key) => match[2]?.trim().startsWith(`${key}=`))) {
    const value = firstBare[1] || firstBare[2] || firstBare[3];
    if (value) attributes.label = value;
  }
  return { kind, attributes };
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const parseSequence = (start: number, nested: boolean): { blocks: Block[]; index: number; closed: boolean } => {
    const blocks: Block[] = [];
    const markdown: string[] = [];
    let inFence = false;
    const flushMarkdown = () => {
      if (markdown.length) blocks.push({ type: "markdown", value: markdown.splice(0).join("\n") });
    };

    for (let index = start; index < lines.length; index += 1) {
      const line = lines[index] || "";
      if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
      if (!inFence && /^\s*:::\s*$/.test(line)) {
        flushMarkdown();
        return { blocks, index: index + 1, closed: true };
      }
      const opening = !inFence ? line.match(/^\s*:::\s+(.+?)\s*$/) : null;
      if (opening) {
        flushMarkdown();
        const header = parseHeader(opening[1] || "content");
        const child = parseSequence(index + 1, true);
        if (!child.closed) {
          markdown.push(line, ...lines.slice(index + 1));
          flushMarkdown();
          return { blocks, index: lines.length, closed: !nested };
        }
        blocks.push({ type: "component", kind: header.kind, attributes: header.attributes, children: child.blocks });
        index = child.index - 1;
        continue;
      }
      markdown.push(line);
    }
    flushMarkdown();
    return { blocks, index: lines.length, closed: !nested };
  };
  return parseSequence(0, false).blocks;
}

function blockText(blocks: Block[]): string {
  return blocks.map((block) => block.type === "markdown" ? block.value : "").join("\n").trim();
}

function renderChildren(blocks: Block[], options: ComponentRenderOptions, renderBlock: (block: ComponentBlock) => string): string {
  return blocks.map((block) => block.type === "markdown" ? options.markdown(block.value) : renderBlock(block)).join("");
}

function attributeText(attributes: Record<string, string | boolean>, key: string, fallback = ""): string {
  const value = attributes[key];
  return typeof value === "string" ? value : fallback;
}

function isTrue(attributes: Record<string, string | boolean>, key: string): boolean {
  return attributes[key] === true || attributes[key] === "true" || attributes[key] === "open";
}

function renderCode(value: string, language: string, label: string): string {
  const match = value.trim().match(/^(```|~~~)([^\n]*)\n([\s\S]*?)\n\1\s*$/);
  const code = match ? match[3] || "" : value.trim();
  const info = match?.[2]?.trim().replace(/\s*\[([^\]]+)\]/, "") || language;
  const className = info ? ` class="language-${escapeHtml(info)}"` : "";
  return `<div class="code-block"><div class="code-toolbar"><span>${escapeHtml(label || info || "text")}</span><button class="copy-button" type="button" data-copy>Copy</button></div><pre data-component-code><code${className}>${escapeHtml(code)}\n</code></pre></div>`;
}

export function renderComponents(source: string, options: ComponentRenderOptions): string {
  const blocks = parseBlocks(source);
  let componentId = 0;

  const renderBlock = (block: ComponentBlock): string => {
    const { kind, attributes, children } = block;
    const body = () => renderChildren(children, options, renderBlock);
    if (["note", "tip", "warning", "danger", "callout"].includes(kind)) {
      const type = kind === "callout" ? attributeText(attributes, "type", "note") : kind;
      const title = attributeText(attributes, "title", type);
      return `<aside class="callout callout-${escapeHtml(type)}"><strong>${escapeHtml(title)}</strong>${body()}</aside>`;
    }
    if (kind === "accordion" || kind === "details") {
      const title = attributeText(attributes, "title", attributeText(attributes, "label", "Details"));
      return `<details class="docs-accordion"${isTrue(attributes, "open") ? " open" : ""}><summary>${escapeHtml(title)}</summary><div class="docs-accordion-body">${body()}</div></details>`;
    }
    if (kind === "tabs") {
      const tabs = children.filter((child): child is ComponentBlock => child.type === "component" && child.kind === "tab");
      if (!tabs.length) return `<div class="docs-tabs">${body()}</div>`;
      const id = `tabs-${componentId += 1}`;
      return `<div class="docs-tabs" data-tabs="${id}"><div class="docs-tab-list" role="tablist">${tabs.map((tab, index) => {
        const tabId = `${id}-tab-${index + 1}`;
        return `<button type="button" class="docs-tab-button" role="tab" tabindex="${index === 0 ? 0 : -1}" aria-selected="${index === 0}" aria-controls="${tabId}-panel" id="${tabId}" data-tab-target="${tabId}-panel">${escapeHtml(attributeText(tab.attributes, "label", `Tab ${index + 1}`))}</button>`;
      }).join("")}</div>${tabs.map((tab, index) => {
        const tabId = `${id}-tab-${index + 1}`;
        return `<div class="docs-tab-panel" role="tabpanel" id="${tabId}-panel" aria-labelledby="${tabId}"${index === 0 ? "" : " hidden"}>${renderChildren(tab.children, options, renderBlock)}</div>`;
      }).join("")}</div>`;
    }
    if (kind === "code-group") {
      const codes = children.filter((child): child is ComponentBlock => child.type === "component" && child.kind === "code");
      if (!codes.length) return `<div class="docs-code-group">${body()}</div>`;
      const id = `code-group-${componentId += 1}`;
      return `<div class="docs-code-group" data-code-group="${id}"><div class="docs-code-list" role="tablist">${codes.map((code, index) => `<button type="button" class="docs-code-button" role="tab" tabindex="${index === 0 ? 0 : -1}" aria-selected="${index === 0}" aria-controls="${id}-${index}-panel" id="${id}-${index}-tab" data-code-target="${id}-${index}">${escapeHtml(attributeText(code.attributes, "label", attributeText(code.attributes, "name", `Example ${index + 1}`)))}</button>`).join("")}</div>${codes.map((code, index) => `<div class="docs-code-panel" id="${id}-${index}-panel" role="tabpanel" aria-labelledby="${id}-${index}-tab" data-code-panel="${id}-${index}"${index === 0 ? "" : " hidden"}>${renderCode(blockText(code.children), attributeText(code.attributes, "language", ""), attributeText(code.attributes, "label", ""))}</div>`).join("")}</div>`;
    }
    if (kind === "cards") {
      const cards = children.filter((child): child is ComponentBlock => child.type === "component" && child.kind === "card");
      return `<div class="docs-cards">${cards.length ? cards.map((card) => {
        const href = attributeText(card.attributes, "href");
        const title = attributeText(card.attributes, "title", attributeText(card.attributes, "label", ""));
        const iconName = attributeText(card.attributes, "icon");
        const icon = options.icon && options.icons && iconName ? options.icon(options.icons, iconName, 17) : "";
        const content = renderChildren(card.children, options, renderBlock);
        const inner = `${icon ? `<span class="docs-card-icon">${icon}</span>` : ""}${title ? `<strong>${escapeHtml(title)}</strong>` : ""}${content}`;
        return href ? `<a class="docs-card" href="${escapeHtml(safeUrl(href))}">${inner}</a>` : `<article class="docs-card">${inner}</article>`;
      }).join("") : body()}</div>`;
    }
    if (kind === "card") {
      const href = attributeText(attributes, "href");
      return href ? `<a class="docs-card" href="${escapeHtml(safeUrl(href))}">${body()}</a>` : `<article class="docs-card">${body()}</article>`;
    }
    if (kind === "table") return `<div class="docs-table">${body()}</div>`;
    if (kind === "version" || kind === "version-badge") {
      const version = attributeText(attributes, "version", attributeText(attributes, "value", attributeText(attributes, "label")));
      const prefix = attributeText(attributes, "prefix", "v");
      return `<span class="docs-version-badge"><span class="docs-version-label">${escapeHtml(prefix)}</span>${escapeHtml(version || blockText(children) || "latest")}</span>`;
    }
    if (kind === "shortcut" || kind === "kbd") {
      const rawKeys = attributeText(attributes, "keys", attributeText(attributes, "key", attributeText(attributes, "shortcut", "")));
      const keys = (rawKeys || (!attributes.keys && !attributes.key && !attributes.shortcut ? attributeText(attributes, "label", blockText(children)) : "⌘ K")).split(/\s*\+\s*|\s+/).filter(Boolean);
      const label = attributeText(attributes, "description", attributeText(attributes, "title", attributes.keys || attributes.key || attributes.shortcut ? attributeText(attributes, "label") : ""));
      const ariaKeys = keys.map((key) => ({ "⌘": "Meta", "⌥": "Alt", "⇧": "Shift", Ctrl: "Control" }[key] || key)).join("+");
      return `<span class="docs-shortcut-block"><span class="docs-shortcut" aria-keyshortcuts="${escapeHtml(ariaKeys)}">${keys.map((key, index) => `${index ? '<span class="docs-shortcut-plus">+</span>' : ""}<kbd>${escapeHtml(key)}</kbd>`).join("")}</span>${label ? `<span class="docs-shortcut-label">${escapeHtml(label)}</span>` : ""}</span>`;
    }
    if (kind === "steps") return `<div class="docs-steps">${body()}</div>`;
    if (kind === "image") {
      const src = safeUrl(attributeText(attributes, "src"));
      const alt = attributeText(attributes, "alt", attributeText(attributes, "title", ""));
      const caption = attributeText(attributes, "caption");
      return `<figure class="docs-image"><img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}"${attributeText(attributes, "width") ? ` width="${escapeHtml(attributeText(attributes, "width"))}"` : ""} loading="lazy">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    }
    if (kind === "video") {
      const src = safeUrl(attributeText(attributes, "src"));
      const poster = attributeText(attributes, "poster");
      const caption = attributeText(attributes, "caption");
      return `<figure class="docs-video"><video controls preload="metadata"${poster ? ` poster="${escapeHtml(safeUrl(poster))}"` : ""}><source src="${escapeHtml(src)}"></video>${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
    }
    if (kind === "tab" || kind === "code") return body();
    return `<div class="docs-component docs-${escapeHtml(kind)}">${body()}</div>`;
  };

  return renderChildren(blocks, options, renderBlock);
}
