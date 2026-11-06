export async function readSheetResult(response: Response): Promise<void> {
  if (response.type === 'opaque' || !response.ok) {
    throw new Error(response.ok ? 'Réponse illisible.' : `Le service a répondu ${response.status}.`)
  }
  const text = await response.text()
  const trimmed = text.trim()
  if (!trimmed) throw new Error('Le service a renvoyé une réponse vide.')
  if (trimmed.startsWith('<')) {
    throw new Error('Le script a renvoyé une page HTML. Redéployez l’application web.')
  }
  let data: { ok?: unknown; error?: unknown }
  try {
    data = JSON.parse(trimmed) as { ok?: unknown; error?: unknown }
  } catch {
    throw new Error('Le script n’a pas renvoyé de JSON. Vérifiez le déploiement.')
  }
  if (data.ok !== true) {
    const reason = typeof data.error === 'string' ? data.error.replace(/\s+/g, ' ').slice(0, 180) : ''
    throw new Error(reason || 'Le tableur a refusé la ligne.')
  }
}
