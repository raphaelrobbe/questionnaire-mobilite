import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const root = join(process.cwd(), 'build/client')

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(path)))
    else files.push(path)
  }
  return files
}

const paths = (await walk(root))
  .map((file) => relative(root, file).split('\\').join('/'))
  .filter((file) => {
    const name = file.split('/').pop() ?? ''
    // Le QR se charge au clic, puis le service worker le range. Il n’entre pas dans la première visite.
    return file !== 'sw.js' && file !== 'precache.json' && !file.endsWith('.map') && !name.startsWith('qr-')
  })
  .sort()

await writeFile(join(root, 'precache.json'), JSON.stringify(paths))

const swPath = join(root, 'sw.js')
const version = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
const source = await readFile(swPath, 'utf8')
if (!source.includes('__CACHE_VERSION__')) throw new Error('La version du cache est absente de sw.js')
await writeFile(swPath, source.replaceAll('__CACHE_VERSION__', version))
