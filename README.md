# Setup Emberpost

Set up an isolated [Emberpost](https://github.com/JSChronicles/emberpost) CLI in
GitHub Actions. The action installs Emberpost into a private uv-managed
environment and adds the CLI to `PATH` for subsequent workflow steps.

The workflow continues to use normal Emberpost commands. There are no action
inputs for commands, arguments, schedule files, frequencies, or provider
credentials.

## Usage

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

  - name: Set up Emberpost
    uses: JSChronicles/setup-emberpost@v0

  - name: Run Emberpost
    env:
      PAGERDUTY_API_KEY_EXAMPLE_PAGERDUTY_COM: ${{ secrets.PAGERDUTY_API_KEY_EXAMPLE_PAGERDUTY_COM }}
      SLACK_API_KEY_EXAMPLE_SLACK_COM: ${{ secrets.SLACK_API_KEY_EXAMPLE_SLACK_COM }}
    run: emberpost --schedule-file schedules/oncall.yaml --frequency daily
```

Multiple schedule files retain their supplied order:

```yaml
- name: Set up Emberpost
  uses: JSChronicles/setup-emberpost@v0

- name: Run Emberpost
  run: >
    emberpost --schedule-file
    schedules/platform.yaml schedules/security.yaml
    --frequency weekly
```

Other commands remain ordinary Emberpost CLI invocations:

```yaml
- run: emberpost --schedule-file schedules/oncall.yaml --frequency daily --dry-run
- run: emberpost --help
- run: emberpost --version
```

The setup action does not inspect schedule YAML or receive PagerDuty, Slack, or
Microsoft Teams credentials. Configure provider credentials on the step that
runs Emberpost.

## Version selection

By default, the action installs the latest stable Emberpost release from PyPI.
Choose an exact version for reproducible workflow runs:

```yaml
- uses: JSChronicles/setup-emberpost@v0
  with:
    emberpost-version: '0.3.0'
```

Set `emberpost-version: latest` explicitly to document the default behavior.
The resolved version can change between otherwise identical workflow runs.

The selected version is available as the `emberpost-version` action output.

uv normally selects and, when needed, downloads a compatible managed Python.
An optional override is available for older Emberpost releases or unusual
runners:

```yaml
- uses: JSChronicles/setup-emberpost@v0
  with:
    emberpost-version: '0.3.0'
    python-version: '3.14'
```

## Schedules and credentials

Schedule files remain part of the checked-out repository and are passed to the
Emberpost CLI normally. The action does not copy, rewrite, validate, or discover
schedule files. Multiple files and their ordering are controlled by the CLI
arguments in the calling workflow.

Provider credentials also remain workflow-owned. Store them as GitHub Actions
secrets and expose only the environment variables required by each Emberpost
destination. The setup step itself needs no provider credentials.

A complete scheduled workflow checks out the repository before setup and then
invokes Emberpost as usual:

```yaml
name: Emberpost

on:
  workflow_dispatch:
  schedule:
    - cron: '30 9 * * 1-5'

permissions:
  contents: read

jobs:
  post:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
      - uses: JSChronicles/setup-emberpost@v0
        with:
          emberpost-version: '0.3.0'
      - name: Run Emberpost
        env:
          PAGERDUTY_API_KEY_EXAMPLE_PAGERDUTY_COM: ${{ secrets.PAGERDUTY_API_KEY_EXAMPLE_PAGERDUTY_COM }}
          SLACK_API_KEY_EXAMPLE_SLACK_COM: ${{ secrets.SLACK_API_KEY_EXAMPLE_SLACK_COM }}
        run: emberpost --schedule-file schedules/oncall.yaml --frequency daily
```

## How setup works

The action installs Emberpost into a private uv-managed environment. It places
the environment's executable directory on `PATH` for later workflow steps.

During setup, the bundled action:

1. validates the Emberpost and optional Python version inputs;
2. creates a private runtime directory under the runner's temporary directory;
3. invokes `uv tool install --managed-python --no-config` with `emberpost` or
   the selected exact version;
4. runs the installed executable by absolute path to read its version;
5. publishes the exact installed version as the action output; and
6. adds the private executable directory to `PATH`.

The action does not implement Emberpost command semantics, parse schedules,
select a frequency, or manage provider authentication. Emberpost remains
authoritative for configuration validation and execution.

## Platforms

The pre-1.0 releases support GitHub-hosted and compatible self-hosted Linux and
macOS runners. Windows is not currently supported.

The composite action uses GitHub's `$/dist/setup` self-reference. This feature
is available on GitHub.com but not on GitHub Enterprise Server.

## Security

- CLI arguments are passed as an array with `shell: false`.
- Version inputs are validated before they are included in a requirement.
- Consumer uv project configuration is ignored for the private environment.
- Emberpost is installed into a private uv-managed tool environment.
- The Emberpost executable is invoked by absolute path during verification.
- The action does not read schedule files or provider credentials.
- The action itself needs no GitHub token. Start with `contents: read` and add
  only permissions required by the calling workflow.

For hardened workflows, pin this action and all other actions to full commit
SHAs instead of floating major tags.

## Release versioning

Setup Emberpost is currently pre-1.0. Every change pushed to `main` is tested
and the committed bundle is verified before semantic-release decides whether
to publish a release. Conventional `feat` commits and breaking changes
increment the minor version; `fix`, `perf`, `revert`, and dependency commits
increment the patch version. Other commit types do not publish a release.

Use `JSChronicles/setup-emberpost@v0` for convenient updates that remain
compatible within the pre-1.0 release line. The release workflow automatically
moves this major-version tag after publishing each stable release.

For a fixed semantic release, use `JSChronicles/setup-emberpost@v0.1.0`. For
the strongest supply-chain guarantee, pin the full commit SHA for that release:

```yaml
- uses: JSChronicles/setup-emberpost@<full-release-commit-sha> # v0.1.0
```

Backwards-compatible fixes and features can update `v0`. Potentially breaking
changes may be released as a new `0.x.0` version. Once the public interface and
behavior are stable, the project will promote to `v1.0.0` and add a floating
`v1` tag.

## Development

This repository requires Node.js 26 and npm.

```bash
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The bundled entry point under `dist/` is committed. CI rebuilds it and fails if
generated output differs from source.

## License

MIT
