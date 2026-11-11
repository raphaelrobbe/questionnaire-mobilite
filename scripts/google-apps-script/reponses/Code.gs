/**
 * Script du tableur PUBLIC. Feuille Réponses, et Réponses TEST pour le mode test.
 * Collez ce fichier dans Extensions → Apps Script, ouvert depuis CE tableur.
 * Déployer → Application Web → Exécuter en tant que : Moi → Qui a accès : Tout le monde.
 * L'URL /exec va dans VITE_SHEETS_WEBAPP_URL.
 *
 * Avant d'écrire dans Réponses, il vérifie l'identifiant d'appareil dans le
 * fichier privé. L'identifiant de ce fichier se règle dans les propriétés du
 * script, sous le nom ADMIN_SPREADSHEET_ID (la partie de son adresse entre
 * /d/ et /edit). Il ne figure pas dans ce code. Sans cette propriété, ou si
 * l'appareil n'est pas dans Enquêteurs, la ligne est refusée et la feuille
 * n'est pas modifiée. Une fiche de test n'est écrite que dans Réponses TEST.
 * Un nom, une adresse, un téléphone ou des coordonnées reçus par erreur sont
 * ignorés, pas écrits.
 * Le même code n'ajoute pas une seconde ligne.
 * action=code répond seulement si ce code est déjà dans la feuille, sans renvoyer la ligne.
 * Après une modification : Déployer → Gérer les déploiements → crayon → Nouvelle version.
 */
const TAB_NAME = 'Réponses'
const TEST_TAB_NAME = 'Réponses TEST'

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {}
  var callback = String(params.callback || '')
  var payload
  try {
    if (String(params.action || '') === 'code') payload = lookupCode(params.code, String(params.test || '') === '1')
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

function lookupCode(code, test) {
  var text = String(code || '').trim()
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(text)) return { ok: true, stored: false }
  var sheet = spreadsheet().getSheetByName(test ? TEST_TAB_NAME : TAB_NAME)
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
    const test = body.test === true
    if (!test) assertAuthorizedDevice(body.row.appareil)
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
        test,
      )
    } finally {
      lock.releaseLock()
    }
    return json({ ok: true })
  } catch (error) {
    return json({ ok: false, error: String(error && error.message ? error.message : error).slice(0, 180) })
  }
}

function assertAuthorizedDevice(value) {
  const device = normalizeDevice(value)
  if (!device) throw new Error('Appareil non autorisé.')
  const id = String(PropertiesService.getScriptProperties().getProperty('ADMIN_SPREADSHEET_ID') || '').trim()
  if (!id) throw new Error('Fichier admin non configuré.')
  const book = SpreadsheetApp.openById(id)
  const sheet = book.getSheetByName('Enquêteurs')
  if (!sheet) throw new Error('Feuille Enquêteurs introuvable.')
  const lastRow = sheet.getLastRow()
  const lastCol = sheet.getLastColumn()
  if (lastRow < 2 || !lastCol) throw new Error('Appareil non autorisé.')
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
  let deviceCol = -1
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim() === 'Identifiants appareils autorisés') deviceCol = i
  }
  if (deviceCol === -1) throw new Error('Colonne « Identifiants appareils autorisés » introuvable.')
  const values = sheet.getRange(2, deviceCol + 1, lastRow - 1, 1).getValues()
  for (let row = 0; row < values.length; row++) {
    const devices = parseDevices(values[row][0])
    if (devices.indexOf(device) !== -1) return
  }
  throw new Error('Appareil non autorisé.')
}

function normalizeDevice(value) {
  var text = String(value || '').trim().toLowerCase()
  if (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') text = text.substring(1, text.length - 1).trim()
  if (!text || text.length > 80 || /[\s,;\[\]]/.test(text)) return ''
  return text
}

function parseDevices(value) {
  const text = String(value || '').trim()
  if (!text || text === '[]') return []
  const wrapped = text.charAt(0) === '[' && text.charAt(text.length - 1) === ']'
  const inner = wrapped ? text.substring(1, text.length - 1).trim() : text
  if (!inner) return []
  const parts = wrapped ? inner.split(',') : [inner]
  const seen = {}
  const list = []
  for (let i = 0; i < parts.length; i++) {
    const id = normalizeDevice(parts[i])
    if (!id || seen[id]) continue
    seen[id] = true
    list.push(id)
  }
  return list
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
    name === 'civilite' ||
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

function responseSheet(test) {
  const book = spreadsheet()
  const name = test ? TEST_TAB_NAME : TAB_NAME
  let sheet = book.getSheetByName(name)
  if (!sheet) sheet = book.insertSheet(name)
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

function writeRow(headersFromClient, row, test) {
  const code = String(row && row.id ? row.id : '').trim()
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) throw new Error('Code illisible.')
  const sheet = responseSheet(test === true)
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
