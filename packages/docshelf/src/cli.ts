import { buildSite, initProject, serveSite, validateSite } from "./generator.js";
import { error, heading, info, muted, success, warning } from "./terminal.js";
import type { BuildOptions } from "./types.js";

export interface CliOptions {
  force?: boolean;
  help?: boolean;
  open?: boolean;
  base?: string;
  docs?: string;
  out?: string;
  port?: number;
  host?: string;
}

export function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index] || "";
    if (argument === "--force") options.force = true;
    else if (argument === "--open") options.open = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument.startsWith("--base=")) options.base = argument.slice(7);
    else if (argument === "--base") options.base = requireValue(args, ++index, argument);
    else if (argument.startsWith("--docs=")) options.docs = argument.slice(7);
    else if (argument === "--docs") options.docs = requireValue(args, ++index, argument);
    else if (argument.startsWith("--out=")) options.out = argument.slice(6);
    else if (argument === "--out") options.out = requireValue(args, ++index, argument);
    else if (argument.startsWith("--port=")) options.port = parsePort(argument.slice(7));
    else if (argument === "--port") options.port = parsePort(requireValue(args, ++index, argument));
    else if (argument.startsWith("--host=")) options.host = argument.slice(7);
    else if (argument === "--host") options.host = requireValue(args, ++index, argument);
    else throw new Error(`Unknown option: ${argument}. Run \`docshelf --help\` to see available options.`);
  }
  return options;
}

function requireValue(args: string[], index: number, option: string): string {
  const value = args[index];
  if (!value || value.startsWith("--")) throw new Error(`${option} needs a value. Run \`docshelf --help\` for examples.`);
  return value;
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${value}. Use a number between 1 and 65535.`);
  return port;
}

function environmentValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function environmentPort(): number | undefined {
  const value = environmentValue("DOCSHELF_PORT");
  return value ? parsePort(value) : undefined;
}

function environmentOpen(): boolean {
  return ["1", "true", "yes"].includes((process.env.DOCSHELF_OPEN || "").toLowerCase());
}

function overridesFrom(options: CliOptions): BuildOptions["overrides"] {
  return {
    base: options.base ?? environmentValue("DOCSHELF_BASE"),
    docs: options.docs ?? environmentValue("DOCSHELF_DOCS"),
    out: options.out ?? environmentValue("DOCSHELF_OUT"),
  };
}

function printBuildSummary(result: Awaited<ReturnType<typeof buildSite>>, action = "Built"): void {
  console.log(`\n${heading(`docshelf ${action.toLowerCase()}`)}`);
  console.log(`${success("✓")} ${action} successfully`);
  console.log(`  ${muted("pages")}   ${result.documents.length}`);
  console.log(`  ${muted("assets")}  ${result.assets}`);
  console.log(`  ${muted("output")}  ${result.config.paths.output}/`);
  console.log(`  ${muted("time")}    ${result.durationMs} ms`);
}

function printIssues(result: Awaited<ReturnType<typeof buildSite>>, issues: Awaited<ReturnType<typeof validateSite>>): number {
  const errors = issues.filter((issue) => issue.severity !== "warning");
  console.error(`\n${errors.length ? error("×") : warning("!")} ${issues.length} validation issue${issues.length === 1 ? "" : "s"}`);
  for (const issue of issues) {
    const marker = issue.severity === "warning" ? warning("!") : error("×");
    console.error(`  ${marker} ${issue.file}${issue.line ? `:${issue.line}` : ""} · ${issue.message}`);
  }
  if (errors.length) console.error(`  ${muted("hint")} Fix the errors above, then run \`docshelf check\` again.`);
  else console.error(`  ${muted("hint")} Warnings do not block the build, but should be reviewed.`);
  console.error(`  ${muted("pages")} ${result.documents.length}`);
  return errors.length ? 1 : 0;
}

export async function run(argv: string[], cwd = process.cwd()): Promise<number> {
  const explicitCommand = argv[0] && !argv[0].startsWith("-") ? argv[0] : undefined;
  const command = explicitCommand || "build";
  const rawArgs = explicitCommand ? argv.slice(1) : argv;

  try {
    const options = parseArgs(rawArgs);
    if (options.help || command === "help") {
      printHelp();
      return 0;
    }

    if (command === "init") {
      const result = await initProject({ cwd, force: options.force });
      console.log(`\n${heading("docshelf init")}`);
      result.detected.forEach((file) => console.log(`  ${info("·")} Detected existing ${file}`));
      if (!result.created.length) {
        console.log(`${info("·")} Nothing to create. Existing files were preserved.`);
        console.log(`  ${muted("hint")} Edit docs/index.md, then run \`docshelf dev\`.`);
        return 0;
      }
      console.log(`${success("✓")} Created ${result.created.length} file${result.created.length === 1 ? "" : "s"}`);
      result.created.forEach((file) => console.log(`  ${muted(file)}`));
      console.log(`  ${muted("next")} Run \`docshelf dev\` to preview your site.`);
      return 0;
    }

    if (command === "build") {
      printBuildSummary(await buildSite({ cwd, overrides: overridesFrom(options) }));
      return 0;
    }

    if (command === "check") {
      const result = await buildSite({ cwd, overrides: overridesFrom(options) });
      const issues = await validateSite({ cwd, result });
      if (issues.length) return printIssues(result, issues);
      printBuildSummary(result, "Checked");
      return 0;
    }

    if (command === "dev" || command === "preview") {
      await serveSite({
        cwd,
        mode: command,
        port: options.port ?? environmentPort() ?? 4173,
        host: options.host ?? environmentValue("DOCSHELF_HOST") ?? "localhost",
        open: options.open || environmentOpen(),
        overrides: overridesFrom(options),
      });
      return 0;
    }

    throw new Error(`Unknown command: ${command}. Run \`docshelf --help\` to see the five available commands.`);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    console.error(`\n${error("×")} ${heading("docshelf error")}`);
    message.split("\n").forEach((line) => console.error(`  ${line}`));
    return 1;
  }
}

function printHelp(): void {
  console.log(`${heading("docshelf")}  A dead-simple documentation framework with minimal setup, beautiful design, and effortless deployment.

Usage:
  docshelf init                 Create starter files without replacing your work
  docshelf dev                  Build, serve, and watch your docs
  docshelf check                Validate the site before publishing
  docshelf build                Generate static HTML in dist/
  docshelf preview              Serve an existing build

Options:
  --base <path>                 Deployment base path, for example /my-repo
  --docs <path>                 Markdown source directory (default: docs)
  --out <path>                  Build output directory (default: dist)
  --port <number>               Local server port (default: 4173)
  --host <hostname>             Local server host (default: localhost)
  --open                        Open the local site in your browser
  --force                       Let init replace starter files
  -h, --help                    Show this help

Environment:
  DOCSHELF_BASE, DOCSHELF_DOCS, DOCSHELF_OUT
  DOCSHELF_PORT, DOCSHELF_HOST, DOCSHELF_OPEN

Examples:
  npx docshelf init
  npx docshelf dev --open
  npx docshelf check && npx docshelf build
`);
}
