import { useState } from 'react'
import { PrivacyNotice } from './PrivacyNotice'
import { TreatmentRegister } from './TreatmentRegister'

const tabs = [
  { id: 'personnelles', label: 'Protection des données personnelles' },
  { id: 'registre', label: 'Registre des traitements' },
] as const

export function PrivacyScreen() {
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('personnelles')

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Protection des données</h1>
        <div className="mt-3 flex gap-1" role="tablist" aria-label="Protection des données">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-3 py-2 text-center text-sm font-bold leading-tight ${
                tab === item.id ? 'bg-pine text-paper' : 'text-muted hover:bg-mist hover:text-ink'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'personnelles' ? (
        <section className="rounded-[28px] border border-line bg-card px-4 py-4" role="tabpanel">
          <PrivacyNotice />
        </section>
      ) : (
        <section role="tabpanel">
          <TreatmentRegister />
        </section>
      )}
    </div>
  )
}
