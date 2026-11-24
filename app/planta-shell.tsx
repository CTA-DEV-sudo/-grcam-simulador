'use client'

import { useEffect, useRef } from 'react'

type PlantaShellProps = {
  markup: string
  simulation?: boolean
}

const dashboardScripts = ['/planta/sa-data.js', '/planta/dashboard.js']
const simulationScripts = [
  '/planta/vendor/three.min.js',
  '/planta/vendor/OrbitControls.js',
  '/planta/vendor/RoomEnvironment.js',
  '/planta/vendor/RoundedBoxGeometry.js',
  '/planta/world.js',
  '/planta/scenes.js',
  '/planta/sa-data.js',
  '/planta/engine.js',
]

export function PlantaShell({ markup, simulation = false }: PlantaShellProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    const root = rootRef.current
    if (!root) return

    root.innerHTML = markup
    const scripts = simulation ? simulationScripts : dashboardScripts
    const loadOnce = new Set([
      '/planta/vendor/three.min.js',
      '/planta/vendor/OrbitControls.js',
      '/planta/vendor/RoomEnvironment.js',
      '/planta/vendor/RoundedBoxGeometry.js',
      '/planta/world.js',
      '/planta/scenes.js',
      '/planta/sa-data.js',
    ])
    const browserWindow = window as Window & { __plantaScriptLoads?: Map<string, Promise<void>> }
    const scriptLoads = browserWindow.__plantaScriptLoads ??= new Map<string, Promise<void>>()

    const loadScript = (src: string, once: boolean) => {
      const existingLoad = once ? scriptLoads.get(src) : undefined
      if (existingLoad) return existingLoad

      const load = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = src
        script.dataset.plantaScript = 'true'
        script.onload = () => {
          script.remove()
          resolve()
        }
        script.onerror = () => {
          script.remove()
          reject(new Error(`Não foi possível carregar ${src}`))
        }
        document.body.appendChild(script)
      })

      if (once) scriptLoads.set(src, load)
      load.catch(() => {
        if (once && scriptLoads.get(src) === load) scriptLoads.delete(src)
      })
      return load
    }

    const initialize = async () => {
      try {
        for (const src of scripts) {
          if (cancelled) return
          await loadScript(src, loadOnce.has(src))
        }
      } catch (error) {
        if (!cancelled) console.error(error)
      }
    }

    void initialize()
    return () => {
      cancelled = true
      root.replaceChildren()
    }
  }, [markup, simulation])

  return <div ref={rootRef} className={simulation ? 'planta-root planta-simulation' : 'planta-root'} />
}
