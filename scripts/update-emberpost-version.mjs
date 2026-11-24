import { readFile, writeFile } from 'node:fs/promises'

const [version] = process.argv.slice(2)
const exactVersion = /^\d+\.\d+\.\d+$/

if (!version || !exactVersion.test(version)) {
  throw new Error('usage: node scripts/update-emberpost-version.mjs <x.y.z>')
}

const compatibilityPath = '.github/emberpost-compatibility.json'
const compatibility = JSON.parse(await readFile(compatibilityPath, 'utf8'))
const previousVersion = compatibility.emberpost_version

if (!exactVersion.test(previousVersion || '')) {
  throw new Error(
    `${compatibilityPath} does not contain a stable Emberpost version`
  )
}

compatibility.emberpost_version = version
await writeFile(
  compatibilityPath,
  `${JSON.stringify(compatibility, null, 2)}\n`,
  'utf8'
)

const readmePath = 'README.md'
const readme = await readFile(readmePath, 'utf8')
if (!readme.includes(previousVersion)) {
  throw new Error(`${readmePath} does not contain Emberpost ${previousVersion}`)
}
await writeFile(readmePath, readme.replaceAll(previousVersion, version))

console.log(
  `Updated the tested Emberpost version from ${previousVersion} to ${version}`
)
