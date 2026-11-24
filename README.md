# Setup Emberpost

Set up an isolated [Emberpost](https://github.com/JSChronicles/emberpost) CLI in
GitHub Actions.

## Usage

```yaml
permissions:
  contents: read

steps:
  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1

  - name: Set up Emberpost
    uses: JSChronicles/setup-emberpost@v0

  - name: Post the on-call schedule
    env:
      PAGERDUTY_API_KEY_EXAMPLE_PAGERDUTY_COM: ${{ secrets.PAGERDUTY_API_KEY_EXAMPLE_PAGERDUTY_COM }}
      SLACK_API_KEY_EXAMPLE_SLACK_COM: ${{ secrets.SLACK_API_KEY_EXAMPLE_SLACK_COM }}
    run: emberpost --schedule-file schedules/oncall.yaml --frequency daily
```

## Version selection

By default, the action installs the latest stable Emberpost release from PyPI.
Choose an exact version for reproducible workflow runs:

```yaml
- uses: JSChronicles/setup-emberpost@v0
  with:
    emberpost-version: '0.3.0'
```

The selected version is available as the `emberpost-version` action output.
An optional Python override is also supported:

```yaml
- uses: JSChronicles/setup-emberpost@v0
  with:
    emberpost-version: '0.3.0'
    python-version: '3.14'
```

## Platforms

The pre-1.0 releases support GitHub-hosted and compatible self-hosted Linux and
macOS runners. The composite action uses GitHub's `$/dist/setup`
self-reference, which is available on GitHub.com but not GitHub Enterprise
Server.

## Security

- Emberpost is installed into a private uv-managed tool environment.
- Consumer uv project configuration is ignored with `--no-config`.
- Child processes receive argument arrays with `shell: false`.
- The action itself needs no GitHub token. Begin with `contents: read` and add
  only the permissions required by your workflow.

For hardened workflows, pin this action and all other actions to full commit
SHAs instead of floating tags.

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

## Release versioning

Every change pushed to `main` is tested before semantic-release decides whether
to publish. Conventional `feat` commits and breaking changes increment the
pre-1.0 minor version; `fix`, `perf`, `revert`, and dependency commits increment
the patch version. The release workflow moves the `v0` compatibility tag after
each stable release.

## License

MIT
