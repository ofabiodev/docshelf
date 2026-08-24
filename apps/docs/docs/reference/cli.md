---
title: CLI
description: The five commands and a few flags that cover the full workflow.
slug: /cli/
group: Reference
order: 3
---

## Commands

| Command | Purpose |
| --- | --- |
| `docshelf init` | Create starter files without replacing existing work |
| `docshelf dev` | Build, serve, and watch the site |
| `docshelf check` | Validate pages, links, assets, and components |
| `docshelf build` | Generate the static site |
| `docshelf preview` | Serve an existing build |

The normal workflow is:

```text
init → dev → check → build → preview
```

There is no separate compile command for site authors. The package handles its own build.

## Options

```text
--base <path>       Deployment prefix, for example /my-repo
--docs <path>       Markdown source directory (default: docs)
--out <path>        Build output directory (default: dist)
--port <number>     Local server port (default: 4173)
--host <hostname>   Local server host (default: localhost)
--open              Open the local site in your browser
--force             Let init replace starter files
--help              Show help
```

Command-line options take priority over environment values. This keeps local commands readable and CI configuration easy:

```text
DOCSHELF_BASE=/my-repo
DOCSHELF_DOCS=content
DOCSHELF_OUT=public-site
DOCSHELF_PORT=4173
DOCSHELF_HOST=0.0.0.0
DOCSHELF_OPEN=true
```

For example:

```bash
DOCSHELF_BASE=/docs docshelf build
```

On PowerShell:

```powershell
$env:DOCSHELF_BASE = "/docs"
docshelf build
```

## Project scripts

Add only the commands you use to `package.json`:

```json
{
  "scripts": {
    "dev": "docshelf dev",
    "check": "docshelf check",
    "build": "docshelf build",
    "preview": "docshelf preview"
  }
}
```

## Terminal output

Successful builds show pages, copied public assets, output path, and elapsed time:

```text
docshelf build
✓ Built successfully
  pages   9
  assets  3
  output  dist/
  time    148 ms
```

Errors and warnings use different markers. Errors include a suggested next step. Set `NO_COLOR=1` when logs are going to CI or a file.
