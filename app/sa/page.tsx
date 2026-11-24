import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PlantaShell } from '../planta-shell'

export default async function SimulationPage() {
  const markup = await readFile(join(process.cwd(), 'public/planta/simulation.html'), 'utf8')
  return <PlantaShell markup={markup} simulation />
}
