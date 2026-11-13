import { useMemo, useState } from 'react'
import { simulateDraw, theoreticalDraw } from '~/common/draw'
import { frenchCommunePopulations } from '~/common/frenchCommunes'
import { Button } from './Button'
import { fieldClass } from './fill'

const COMMUNES = frenchCommunePopulations()

function formatCount(value: number): string {
  return value.toLocaleString('fr-FR')
}

function readPercent(raw: string): number | null {
  const text = raw.trim().replace(',', '.')
  if (!text) return null
  const value = Number(text)
  if (!Number.isFinite(value)) return null
  return Math.min(100, Math.max(0, value))
}

function readMinimum(raw: string): number {
  const text = raw.trim().replace(',', '.')
  if (!text) return 0
  const value = Math.floor(Number(text))
  if (!Number.isFinite(value) || value < 0) return 0
  return value
}

export function DrawPanel() {
  const [percentText, setPercentText] = useState('')
  const [minimumText, setMinimumText] = useState('')
  const [simulation, setSimulation] = useState<number[] | null>(null)
  const percent = readPercent(percentText)
  const minimum = readMinimum(minimumText)
  const theoretical = useMemo(
    () => (percent === null ? null : theoreticalDraw(COMMUNES, percent, minimum)),
    [percent, minimum],
  )
  const populationTotal = COMMUNES.reduce((sum, commune) => sum + commune.population, 0)
  const theoreticalTotal = theoretical?.reduce((sum, count) => sum + count, 0) ?? null
  const simulationTotal = simulation?.reduce((sum, count) => sum + count, 0) ?? null

  function simulate() {
    if (percent === null) return
    setSimulation(simulateDraw(COMMUNES, percent, minimum))
  }

  return (
    <section className="grid gap-3" role="tabpanel">
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight">Tirage au sort</h2>
      <p className="text-sm leading-relaxed text-muted">
        Le pourcentage fixe un quota, réparti au prorata des habitants. Une commune en dessous du minimum est remontée,
        et le total peut alors dépasser le quota.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-bold">
          % de la population totale
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.1"
            value={percentText}
            onChange={(event) => {
              setPercentText(event.target.value)
              setSimulation(null)
            }}
            className={`min-h-11 rounded-xl px-3 text-base font-semibold outline-none focus:border-leaf ${fieldClass(percent !== null, false)}`}
          />
        </label>
        <label className="grid gap-1 text-sm font-bold">
          Minimum par commune
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={minimumText}
            onChange={(event) => {
              setMinimumText(event.target.value)
              setSimulation(null)
            }}
            className={`min-h-11 rounded-xl px-3 text-base font-semibold outline-none focus:border-leaf ${fieldClass(minimumText.trim() !== '', true)}`}
          />
        </label>
      </div>
      <Button onClick={simulate} disabled={percent === null}>
        Simuler un tirage
      </Button>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full table-fixed border-collapse text-left text-sm">
          <colgroup>
            <col />
            <col className="w-[4.25rem]" />
            <col className="w-[4.25rem]" />
            <col className="w-[4.25rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th className="px-2 py-2 text-left font-bold">Commune</th>
              <th className="px-1 py-2 text-right font-bold" title="Habitants">
                Hab.
              </th>
              <th className="px-1 py-2 text-right font-bold" title="Nombre théorique moyen de tirés au sort">
                Moyen
              </th>
              <th className="px-1 py-2 text-right font-bold" title="Simulation de tirage au sort">
                Tirage
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-line bg-mist font-extrabold">
              <th className="px-2 py-2 text-left">Total</th>
              <td className="px-1 py-2 text-right tabular-nums">{formatCount(populationTotal)}</td>
              <td className="px-1 py-2 text-right tabular-nums">{theoreticalTotal === null ? '—' : formatCount(theoreticalTotal)}</td>
              <td className="px-1 py-2 text-right tabular-nums">{simulationTotal === null ? '—' : formatCount(simulationTotal)}</td>
            </tr>
            {COMMUNES.map((commune, index) => (
              <tr key={commune.name} className="border-b border-line last:border-b-0">
                <th className="p-0 text-left font-semibold">
                  <div className="scroll-top">
                    <span className="scroll-top-inner px-2 py-2" title={commune.name}>
                      {commune.name}
                    </span>
                  </div>
                </th>
                <td className="px-1 py-2 text-right tabular-nums">{formatCount(commune.population)}</td>
                <td className="px-1 py-2 text-right tabular-nums">
                  {theoretical === null ? '—' : formatCount(theoretical[index])}
                </td>
                <td className="px-1 py-2 text-right tabular-nums">
                  {simulation === null ? '—' : formatCount(simulation[index])}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
