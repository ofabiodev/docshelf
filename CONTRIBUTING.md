# Contributing to docshelf

Thanks for helping improve docshelf. Keep changes focused, readable, and easy to test.

## Repository layout

| Folder | Purpose |
| --- | --- |
| `packages/docshelf` | The publishable CLI and generator package |
| `apps/docs` | The documentation site built with docshelf |
| `scripts` | Repository development helpers |
| `.github/workflows` | Continuous integration and deployment workflows |

## Development setup

Requirements:

- [Bun](https://bun.sh/)
- Node.js for the package build scripts

Install dependencies and start the documentation site:

```bash
bun install
bun run dev
```

The development server watches the package, Markdown files, public assets, and `docshelf.toml`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `bun run dev` | Start the example documentation site |
| `bun run check` | Run type checks, tests, and documentation validation |
| `bun run build` | Build the package and example documentation site |
| `bun run build:package` | Build only the package |
| `bun run test` | Run package tests |
| `bun run typecheck` | Check package types |

The example site is written to `apps/docs/dist`.

## Pull requests

Before opening a pull request:

1. Run `bun run check`.
2. Run `bun run build` when changing the generator or build output.
3. Update documentation when changing public commands, configuration, or components.
4. Keep commits focused on one change.

Use a clear pull request description with the problem, the change, and the verification performed.

## Issues

Use the standard labels where possible: `bug`, `enhancement`, `documentation`, `dependencies`, `good first issue`, and `help wanted`.
