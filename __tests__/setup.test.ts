import { buildInstallArgs, parseInstalledVersion } from '../src/setup.js'

describe('installation arguments', () => {
  it('installs an exact version using a selected Python', () => {
    expect(buildInstallArgs('emberpost==0.3.0', '3.14')).toEqual([
      'tool',
      'install',
      '--managed-python',
      '--no-config',
      '--python',
      '3.14',
      'emberpost==0.3.0'
    ])
  })

  it('allows uv to select Python when no override is supplied', () => {
    expect(buildInstallArgs('emberpost', '')).toEqual([
      'tool',
      'install',
      '--managed-python',
      '--no-config',
      'emberpost'
    ])
  })
})

describe('installed version parsing', () => {
  it('reads the Emberpost CLI version output', () => {
    expect(parseInstalledVersion('emberpost 0.3.0\n')).toBe('0.3.0')
  })

  it('rejects unexpected output', () => {
    expect(() => parseInstalledVersion('unknown')).toThrow(
      'Unexpected Emberpost version output'
    )
  })
})
