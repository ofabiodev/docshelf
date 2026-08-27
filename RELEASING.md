# Releasing docshelf

This guide is for maintainers. Users only need the installation and usage instructions in the README.

## One-time setup

The repository must be public and GitHub Actions must have read and write permissions. Enable the setting that allows GitHub Actions to create and approve pull requests.

In the npm settings for the `docshelf` package, add a GitHub Actions trusted publisher:

```text
Account or organization: ofabiodev
Repository: docshelf
Workflow filename: cd_publish.yml
Environment: leave empty
Allowed action: npm publish
```

The publish workflow uses npm Trusted Publishing through OIDC. It does not need an `NPM_TOKEN` or a long-lived npm publish token.

## Normal release

Use Conventional Commits on `main`:

```text
fix: correct an output path
feat: add a new component
feat!: change the configuration format
```

Release Please creates or updates a release pull request. It does not publish immediately.

Review the release pull request, then merge it. The merge creates the Git tag and GitHub Release. The publish job then builds `packages/docshelf` and publishes the new version to npm.

Version effects:

| Commit | Release |
| --- | --- |
| `fix:` | Patch |
| `feat:` | Minor |
| `feat!:` or a breaking-change footer | Major |

The package version is stored in `packages/docshelf/package.json`. The generated changelog is written to `packages/docshelf/CHANGELOG.md`.

## First package publication

If the npm package does not exist yet, publish the initial version interactively from `packages/docshelf` using npm with 2FA. After that, configure Trusted Publishing for subsequent releases.

Do not publish the same package version twice. Do not create a second release tag for an existing version.

## Workflows

| Workflow | Purpose |
| --- | --- |
| `.github/workflows/cd_publish.yml` | Release Please and npm publication |
| `.github/workflows/cd_pages.yml` | Build and deploy the documentation site |

Check workflow runs after merging the Release Please pull request. A successful package publication should show the new version at the npm package page and the new tag under GitHub Releases.

## Troubleshooting

### Release Please does not create a pull request

Check that the commit uses a supported Conventional Commit type and that the workflow has permission to create pull requests.

### npm authentication fails

Check that the Trusted Publisher uses the exact repository and workflow filename:

```text
ofabiodev/docshelf
cd_publish.yml
```

The workflow must keep `id-token: write`, and it must run on a GitHub-hosted runner.

### The package version already exists

Increase the package version through the Release Please flow. npm does not allow an existing version to be published again.
