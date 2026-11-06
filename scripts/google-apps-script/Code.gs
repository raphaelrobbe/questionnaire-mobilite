/**
 * Collez ce fichier dans Extensions → Apps Script DU tableur (pas un script autonome).
 * Déployer → Nouveau déploiement → Application Web.
 *   Exécuter en tant que : Moi
 *   Qui a accès : Tout le monde
 * L'URL se termine par /exec. C'est elle qu'on colle dans Réglages.
 *
 * TOKEN : laissez vide, ou mettez un mot partagé avec les enquêteurs
 * (Réglages → Jeton). Toute personne qui a l'URL peut ajouter une ligne.
 */
const SHEET_ID = ''
const TAB_NAME = 'Réponses'
const TOKEN = ''

function doGet() {
  return json({ ok: true, service: 'questionnaire-mobilite' })
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}')
    if (!authorized(body)) return json({ ok: false, error: 'Jeton refusé.' })
    if (body.kind === 'ping') return json({ ok: true, service: 'questionnaire-mobilite' })
    if (body.kind !== 'response') return json({ ok: false, error: 'Envoi ignoré.' })
    if (!body.row || typeof body.row !== 'object' || !Array.isArray(body.headers)) {
      return json({ ok: false, error: 'Ligne illisible.' })
    }
    const lock = LockService.getScriptLock()
    lock.waitLock(15000)
    try {
      writeRow(
        body.headers.map(function (header) {
          return String(header)
        }),
        body.row,
      )
    } finally {
      lock.releaseLock()
    }
    return json({ ok: true })
  } catch (error) {
    return json({ ok: false, error: String(error && error.message ? error.message : error).slice(0, 180) })
  }
}

function authorized(body) {
  if (!TOKEN) return true
  return Boolean(body && body.token === TOKEN)
}

function responseSheet() {
  const book = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet()
  if (!book) throw new Error('Ouvrez le script depuis le tableur, ou renseignez SHEET_ID.')
  let sheet = book.getSheetByName(TAB_NAME)
  if (!sheet) sheet = book.insertSheet(TAB_NAME)
  return sheet
}

function readHeaders(sheet) {
  if (sheet.getLastRow() === 0) return []
  const width = Math.max(sheet.getLastColumn(), 1)
  const values = sheet
    .getRange(1, 1, 1, width)
    .getValues()[0]
    .map(function (value) {
      return String(value || '').trim()
    })
  while (values.length && !values[values.length - 1]) values.pop()
  if (values.some(function (value) { return !value })) return []
  return values
}

function writeRow(headersFromClient, row) {
  const sheet = responseSheet()
  let headers = readHeaders(sheet)
  if (!headers.length) {
    headers = headersFromClient.filter(Boolean)
    if (!headers.length) throw new Error('En-têtes manquants.')
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
  } else {
    const missing = headersFromClient.filter(function (header) {
      return header && headers.indexOf(header) === -1
    })
    if (missing.length) {
      sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing])
      headers = headers.concat(missing)
    }
  }
  const values = headers.map(function (header) {
    const value = row[header]
    if (value === null || value === undefined) return ''
    return String(value).slice(0, 5000)
  })
  sheet.appendRow(values)
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}
