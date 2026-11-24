# Releasing Setup Emberpost

The `Release` workflow follows Setup Anvil's semantic-release model. Each push
to `main` runs continuous integration and verifies the committed JavaScript
bundle before semantic-release evaluates the commits.

## Required repository settings

1. Add `main` branch protection with the TypeScript, action, bundled JavaScript,
   and CodeQL checks required.
2. In **Settings > Actions > General**, leave the default workflow token at read
   access. The release job grants its own narrowly scoped write permissions.
3. Create the `dependencies` label used by the Emberpost updater pull request.

The initial release uses the version in `package.json`. Later releases are
selected from conventional commits by semantic-release. Stable releases also
create or move the floating `v0` compatibility tag.

Never move an exact semantic version tag. Consumers that need an immutable
reference should pin the full release commit SHA.
