import { promises as fs } from "node:fs";
import { extname, resolve, sep } from "node:path";
import type { DocsConfig, IconWeight } from "./types.js";

export type IconSet = Map<string, string>;

const uiIcons = [
  "arrow-left",
  "arrow-right",
  "arrow-up-right",
  "book-open",
  "list",
  "magnifying-glass",
  "moon",
  "notebook",
  "rocket",
  "sparkle",
  "sun",
  "x",
] as const;

function iconFileName(name: string, weight: IconWeight): string {
  return weight === "regular" ? `${name}.svg` : `${name}-${weight}.svg`;
}

async function readAsset(name: string, weight: IconWeight): Promise<string | undefined> {
  const specifier = `@phosphor-icons/core/${weight}/${iconFileName(name, weight)}`;
  try {
    const resolved = await import.meta.resolve(specifier);
    return await fs.readFile(new URL(resolved), "utf8");
  } catch {
    return undefined;
  }
}

export function isAssetIcon(value: string): boolean {
  return /^(?:[./\\]|.*\.(?:svg|png|jpe?g|gif|webp|ico)(?:$|[?#]))/i.test(value.trim());
}

function assetReference(value: string): string {
  return value.trim().replace(/^[/\\]+/, "").replace(/^public[/\\]+/i, "");
}

function isExternalAsset(value: string): boolean {
  return /^(?:https?:)?\/\//i.test(value.trim());
}

async function readPublicSvg(cwd: string, reference: string): Promise<string | undefined> {
  if (extname(reference.split(/[?#]/)[0] || "").toLowerCase() !== ".svg") return undefined;
  const publicDirectory = resolve(cwd, "public");
  const target = resolve(publicDirectory, ...assetReference(reference).split(/[\\/]/).filter(Boolean));
  if (target !== publicDirectory && !target.toLowerCase().startsWith(`${publicDirectory.toLowerCase()}${sep}`)) return undefined;
  try { return await fs.readFile(target, "utf8"); } catch { return undefined; }
}

export async function loadIcons(config: DocsConfig, cwd = process.cwd(), extraNames: string[] = []): Promise<IconSet> {
  const customEntries: Array<readonly [string, string]> = [];
  const brandingIcon = config.branding.logo || config.branding.icon;
  if (typeof brandingIcon === "string" && isAssetIcon(brandingIcon) && !isExternalAsset(brandingIcon)) {
    const svg = await readPublicSvg(cwd, brandingIcon);
    if (svg) customEntries.push([brandingIcon, svg]);
  }

  if (!config.icons.enabled || config.icons.library !== "phosphor") return new Map(customEntries);

  const names = new Set<string>(uiIcons);
  if (typeof brandingIcon === "string" && !brandingIcon.trim().startsWith("<svg") && !isAssetIcon(brandingIcon)) names.add(brandingIcon);
  for (const name of extraNames) {
    if (isAssetIcon(name) && !isExternalAsset(name)) {
      const svg = await readPublicSvg(cwd, name);
      if (svg) customEntries.push([name, svg]);
    } else if (/^[a-z0-9-]+$/i.test(name)) names.add(name);
  }

  const entries = await Promise.all([...names].map(async (name) => [name, await readAsset(name, config.icons.weight)] as const));
  return new Map([...customEntries, ...entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1]))]);
}

export function inlineIcon(icons: IconSet, name: string, size: number, className = ""): string {
  const source = icons.get(name);
  if (!source) return "";
  const opening = source.match(/^<svg\b([^>]*)>/i)?.[1] || "";
  const viewBox = opening.match(/\bviewBox="([^"]+)"/i)?.[1] || "0 0 256 256";
  const body = source.replace(/^<svg\b[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
  const classes = ["icon", className].filter(Boolean).join(" ");
  return `<svg class="${classes}" width="${size}" height="${size}" viewBox="${viewBox}" aria-hidden="true">${body}</svg>`;
}
