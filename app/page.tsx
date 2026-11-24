import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PlantaShell } from './planta-shell'

export default async function HomePage() {
  const markup = await readFile(join(process.cwd(), 'public/planta/dashboard.html'), 'utf8')
  return <PlantaShell markup={markup} />
}
