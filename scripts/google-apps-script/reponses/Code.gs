/**
 * Script du tableur PUBLIC. Une seule feuille : Réponses.
 * Collez ce fichier dans Extensions → Apps Script, ouvert depuis CE tableur.
 * Déployer → Application Web → Exécuter en tant que : Moi → Qui a accès : Tout le monde.
 * L'URL /exec va dans VITE_SHEETS_WEBAPP_URL.
 *
 * Ce script n'ouvre aucun autre fichier. Il n'a pas la liste des enquêteurs
 * ni de quoi identifier une personne. Un nom, une adresse, un téléphone
 * ou des coordonnées reçus par erreur sont ignorés, pas écrits.
 * Le même code n'ajoute pas une seconde ligne.
 * action=code répond seulement si ce code est déjà dans la feuille, sans renvoyer la ligne.
 * Après une modification : Déployer → Gérer les déploiements → crayon → Nouvelle version.
 */
const TAB_NAME = 'Réponses'

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {}
  var callback = String(params.callback || '')
  var payload
  try {
    if (String(params.action || '') === 'code') payload = lookupCode(params.code)
    else payload = { ok: true, service: 'questionnaire-mobilite-reponses' }
  } catch (error) {
    payload = { ok: false, stored: false, error: String(error && error.message ? error.message : error).slice(0, 180) }
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]{0,40}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ')').setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    )
  }
  return json(payload)
}

function lookupCode(code) {
  var text = String(code || '').trim()
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(text)) return { ok: true, stored: false }
  var sheet = spreadsheet().getSheetByName(TAB_NAME)
  if (!sheet) return { ok: true, stored: false }
  return { ok: true, stored: hasCode(sheet, readHeaders(sheet), text) }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}')
    if (body.kind === 'ping') return json({ ok: true, service: 'questionnaire-mobilite-reponses' })
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
        }).filter(function (header) {
          return !isPrivateHeader(header)
        }),
        withoutPrivate(body.row),
      )
    } finally {
      lock.releaseLock()
    }
    return json({ ok: true })
  } catch (error) {
    return json({ ok: false, error: String(error && error.message ? error.message : error).slice(0, 180) })
  }
}

function spreadsheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet()
  if (!book) throw new Error('Ouvrez le script depuis le tableur des réponses.')
  return book
}

function isPrivateHeader(header) {
  var name = String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return (
    name === 'adresse' ||
    name === 'email' ||
    name === 'mail' ||
    name === 'adresse mail' ||
    name === 'adresse_mail' ||
    name === 'nom' ||
    name === 'prenom' ||
    name === 'complement' ||
    name === "complement d'adresse" ||
    name === 'latitude' ||
    name === 'longitude' ||
    name === 'telephone' ||
    name === 'numero de telephone'
  )
}

function withoutPrivate(row) {
  const clean = {}
  Object.keys(row || {}).forEach(function (key) {
    if (!isPrivateHeader(key)) clean[key] = row[key]
  })
  return clean
}

function responseSheet() {
  const book = spreadsheet()
  let sheet = book.getSheetByName(TAB_NAME)
  if (!sheet) sheet = book.insertSheet(TAB_NAME)
  return sheet
}

function sameHeaders(current, next) {
  if (current.length !== next.length) return false
  for (let i = 0; i < current.length; i++) {
    if (current[i] !== next[i]) return false
  }
  return true
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

function hasCode(sheet, headers, code) {
  let column = -1
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'id') column = i
  }
  if (column === -1) return false
  const last = sheet.getLastRow()
  if (last < 2) return false
  const values = sheet.getRange(2, column + 1, last - 1, 1).getValues()
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim() === code) return true
  }
  return false
}

function writeRow(headersFromClient, row) {
  const code = String(row && row.id ? row.id : '').trim()
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) throw new Error('Code illisible.')
  const sheet = responseSheet()
  const wanted = headersFromClient.filter(Boolean)
  if (!wanted.length) throw new Error('En-têtes manquants.')
  let headers = readHeaders(sheet)
  if (!sameHeaders(headers, wanted)) {
    sheet.clear()
    sheet.getRange(1, 1, 1, wanted.length).setValues([wanted])
    sheet.setFrozenRows(1)
    headers = wanted
  }
  if (hasCode(sheet, headers, code)) return
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
