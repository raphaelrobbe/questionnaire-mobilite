export function TestBanner() {
  return (
    <>
      <p className="invisible px-4 py-2.5 text-center text-base font-extrabold tracking-wide" aria-hidden="true">
        Mode test
      </p>
      <p data-test-banner className="fixed inset-x-0 top-0 z-30 bg-test px-4 py-2.5 text-center text-base font-extrabold tracking-wide text-test-ink">
        Mode test
      </p>
    </>
  )
}

export function TestChip() {
  return (
    <span className="inline-flex min-h-7 items-center rounded-full bg-test px-2.5 text-xs font-extrabold text-test-ink">Mode test</span>
  )
}
