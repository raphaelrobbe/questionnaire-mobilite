export type EndpointKind = 'google-script' | 'future-api'

export type EndpointIssue = 'empty' | 'invalid' | 'sheet-link' | 'refused'

export type ClassifiedEndpoint =
  | { ok: true; url: string; kind: EndpointKind }
  | { ok: false; reason: EndpointIssue }

export function classifyEndpoint(raw: string): ClassifiedEndpoint {
  const value = raw.trim()
  if (!value) return { ok: false, reason: 'empty' }
  if (value.startsWith('/api/')) {
    if (value.length > 200 || value.includes('..') || value.includes('\\') || value.includes('//') || /[\s?#]/.test(value)) {
      return { ok: false, reason: 'invalid' }
    }
    return { ok: true, url: value, kind: 'future-api' }
  }
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return { ok: false, reason: 'invalid' }
  }
  if (parsed.username || parsed.password) return { ok: false, reason: 'refused' }
  if (parsed.protocol !== 'https:') return { ok: false, reason: 'refused' }
  if (parsed.hostname === 'docs.google.com') return { ok: false, reason: 'sheet-link' }
  const googleScript = parsed.hostname === 'script.google.com' || parsed.hostname === 'script.googleusercontent.com'
  if (!googleScript) return { ok: false, reason: 'refused' }
  if (!parsed.pathname.includes('/macros/s/') || !parsed.pathname.endsWith('/exec')) return { ok: false, reason: 'invalid' }
  return { ok: true, url: parsed.toString(), kind: 'google-script' }
}

export function endpointMessage(reason: EndpointIssue): string {
  switch (reason) {
    case 'empty':
      return 'Aucun tableur n’est branché.'
    case 'invalid':
      return 'Cette adresse n’est pas une URL de script Google qui se termine par /exec.'
    case 'sheet-link':
      return 'Ceci est le lien du tableur. Il faut l’URL de déploiement du script, celle qui se termine par /exec.'
    case 'refused':
      return 'Seuls un script Google (script.google.com) ou une future route /api/… sont acceptés.'
  }
}

export function assertEndpoint(raw: string): { url: string; kind: EndpointKind } {
  const result = classifyEndpoint(raw)
  if (!result.ok) throw new Error(endpointMessage(result.reason))
  return result
}

export function endpointHint(raw: string): { tone: 'muted' | 'ok' | 'warn'; text: string } {
  const result = classifyEndpoint(raw)
  if (result.ok) {
    if (result.kind === 'google-script') {
      return { tone: 'ok', text: 'Adresse acceptée. Les envois iront vers le script Google.' }
    }
    return { tone: 'ok', text: 'Route locale acceptée, pour le jour où un serveur répondra sur /api/.' }
  }
  if (result.reason === 'empty') return { tone: 'muted', text: 'Sans adresse, les réponses restent sur l’appareil.' }
  return { tone: 'warn', text: endpointMessage(result.reason) }
}
