export type ThemeMode = "light" | "dark" | "system";
export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
export type TwitterCard = "summary" | "summary_large_image";
export type ValidationLevel = "error" | "warning" | "ignore";

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
}

export interface AnnouncementConfig {
  text: string;
  href: string;
  tone: "default" | "info" | "success" | "warning";
}

export interface BrandingConfig {
  title: string;
  icon: string | false;
  logo: string;
  logoAlt: string;
  subtitle: string;
}

export interface IconConfig {
  enabled: boolean;
  library: "phosphor" | string;
  weight: IconWeight;
}

export interface ThemeConfig {
  default: ThemeMode;
  respectSystem: boolean;
  allowToggle: boolean;
}

export interface UiConfig {
  search: boolean;
  themeToggle: boolean;
  footer: boolean;
  sidebarFooter: boolean;
}

export interface NavigationConfig {
  sidebar: boolean;
  sidebarMode: "auto" | "none";
  toc: boolean;
  breadcrumbs: boolean;
  pageNavigation: boolean;
  editLink: boolean;
  lastUpdated: boolean;
}

export interface MarkdownConfig {
  syntaxHighlighting: boolean;
  lineNumbers: boolean;
  headingAnchors: boolean;
  smartTypography: boolean;
}

export interface SearchConfig {
  enabled: boolean;
  provider: "local";
  includeCode: boolean;
  index: string;
}

export interface PathsConfig {
  docs: string;
  output: string;
  base: string;
  customCss: string;
}

export interface LinksConfig {
  github: string;
  npm: string;
  edit: string;
}

export interface I18nConfig {
  enabled: boolean;
  defaultLocale: string;
  locales: string[];
  names: Record<string, string>;
}

export interface SeoConfig {
  titleTemplate: string;
  image: string;
  description: string;
  author: string;
  twitterCard: TwitterCard;
  robots: string;
  canonical: boolean;
  jsonLd: boolean;
  generateOgImage: boolean;
}

export interface FeedsConfig {
  sitemap: boolean;
  rss: boolean;
}

export interface ValidationConfig {
  brokenLinks: ValidationLevel;
  missingAssets: ValidationLevel;
  frontmatter: ValidationLevel;
  unknownComponents: ValidationLevel;
}

export type Frontmatter = Record<string, unknown>;

export interface ParsedFrontmatter {
  data: Frontmatter;
  content: string;
}

export interface DocsConfig {
  site: SiteConfig;
  announcement: AnnouncementConfig | null;
  branding: BrandingConfig;
  icons: IconConfig;
  theme: ThemeConfig;
  ui: UiConfig;
  navigation: NavigationConfig;
  markdown: MarkdownConfig;
  search: SearchConfig;
  paths: PathsConfig;
  links: LinksConfig;
  i18n: I18nConfig;
  seo: SeoConfig;
  feeds: FeedsConfig;
  validation: ValidationConfig;
}

export interface DocsDocument {
  sourceRelative: string;
  contentRelative: string;
  content: string;
  title: string;
  sidebarTitle: string;
  description: string;
  group: string;
  order: number;
  slug: string;
  home: boolean;
  draft: boolean;
  sidebar: boolean;
  toc: boolean | undefined;
  breadcrumbs: boolean | undefined;
  pageNavigation: boolean | undefined;
  layout: string;
  hideTitle: boolean;
  hideFooter: boolean;
  editLink: boolean | string | undefined;
  lastUpdated: boolean | string | undefined;
  canonical: string | false | undefined;
  ogImage: string;
  noindex: boolean;
  lang: string;
  author: string;
  lastModified: number;
  locale: string;
  data: Frontmatter;
  route: string;
}

export interface Heading {
  id: string;
  level: number;
  title: string;
}

export interface SearchItem {
  title: string;
  description: string;
  path: string;
  text: string;
  headings: string[];
  locale: string;
}

export interface RenderedMarkdown {
  html: string;
  headings: Heading[];
}

export interface BuildOverrides {
  base?: string;
  docs?: string;
  out?: string;
}

export interface BuildOptions {
  cwd?: string;
  overrides?: BuildOverrides;
}

export interface BuildResult {
  config: DocsConfig;
  documents: DocsDocument[];
  outDirectory: string;
  files: number;
  assets: number;
  durationMs: number;
}

export type ValidationKind = "frontmatter" | "link" | "asset" | "component";

export interface ValidationIssue {
  kind: ValidationKind;
  file: string;
  line?: number;
  message: string;
  severity?: Exclude<ValidationLevel, "ignore">;
}

export interface ServeOptions extends BuildOptions {
  mode?: "dev" | "preview";
  port?: number;
  host?: string;
  open?: boolean;
}

export interface RenderPageOptions {
  config: DocsConfig;
  document?: DocsDocument;
  documents: DocsDocument[];
  localeDocuments: DocsDocument[];
  languageDocuments: DocsDocument[];
  base: string;
  body: string;
  headings: Heading[];
  icons: Map<string, string>;
  customCss?: boolean;
  notFound?: boolean;
}
