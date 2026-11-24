import * as core from '@actions/core'
import { constants } from 'node:fs'
import { access, mkdtemp, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'
import { captureProcess, inheritProcess } from './process.js'

const EXACT_VERSION =
  /^\d+\.\d+\.\d+(?:(?:a|b|rc)\d+)?(?:\.post\d+)?(?:\.dev\d+)?$/
const PYTHON_VERSION = /^(?:cpython@)?\d+(?:\.\d+){0,2}$/

async function findExecutable(name: string): Promise<string> {
  for (const directory of (process.env.PATH || '').split(delimiter)) {
    if (!directory) continue
    const candidate = join(directory, name)
    try {
      await access(candidate, constants.X_OK)
      return await realpath(candidate)
    } catch {
      // Continue searching PATH.
    }
  }
  throw new Error(`${name} is unavailable after setup`)
}

export function buildInstallArgs(
  requirement: string,
  pythonVersion: string
): string[] {
  const args = ['tool', 'install', '--managed-python', '--no-config']
  if (pythonVersion) args.push('--python', pythonVersion)
  args.push(requirement)
  return args
}

export function parseInstalledVersion(output: string): string {
  const match = /^emberpost (\S+)\s*$/.exec(output)
  if (!match || !EXACT_VERSION.test(match[1])) {
    throw new Error(`Unexpected Emberpost version output: ${output.trim()}`)
  }
  return match[1]
}

export async function run(): Promise<void> {
  try {
    if (process.platform !== 'linux' && process.platform !== 'darwin') {
      throw new Error(
        'setup-emberpost currently supports Linux and macOS runners'
      )
    }

    const requestedVersion = core
      .getInput('emberpost-version', { required: true })
      .trim()
    const pythonVersion = core.getInput('python-version').trim()
    if (
      requestedVersion !== 'latest' &&
      !EXACT_VERSION.test(requestedVersion)
    ) {
      throw new Error(
        'emberpost-version must be an exact version such as 0.3.0, or "latest"'
      )
    }
    if (pythonVersion && !PYTHON_VERSION.test(pythonVersion)) {
      throw new Error('python-version must be a version such as 3.14 or 3.14.1')
    }

    const runnerTemp = process.env.RUNNER_TEMP || tmpdir()
    const runtimeDirectory = await mkdtemp(
      join(resolve(runnerTemp), 'setup-emberpost-')
    )
    const toolDirectory = join(runtimeDirectory, 'tools')
    const binDirectory = join(runtimeDirectory, 'bin')
    const uv = await findExecutable('uv')
    const requirement =
      requestedVersion === 'latest'
        ? 'emberpost'
        : `emberpost==${requestedVersion}`
    const uvEnvironment = {
      ...process.env,
      UV_TOOL_BIN_DIR: binDirectory,
      UV_TOOL_DIR: toolDirectory
    }

    core.info(`Installing ${requirement} in an isolated environment`)
    const installExitCode = await inheritProcess(
      uv,
      buildInstallArgs(requirement, pythonVersion),
      uvEnvironment
    )
    if (installExitCode !== 0) {
      throw new Error(
        `uv failed to install ${requirement} (exit code ${installExitCode})`
      )
    }

    const executable = join(binDirectory, 'emberpost')
    await access(executable, constants.X_OK)
    const versionResult = await captureProcess(executable, ['--version'])
    if (versionResult.exitCode !== 0) {
      throw new Error(
        `emberpost --version failed (exit code ${versionResult.exitCode}): ${versionResult.stderr.trim()}`
      )
    }
    const installedVersion = parseInstalledVersion(versionResult.stdout)

    core.addPath(binDirectory)
    core.setOutput('emberpost-version', installedVersion)
    core.info(`Installed Emberpost ${installedVersion}`)
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error))
  }
}
