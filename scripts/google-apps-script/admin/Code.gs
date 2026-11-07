/**
 * Script du tableur PRIVÉ. Feuilles : Enquêteurs, Communes, Adresses mail.
 * Collez ce fichier dans Extensions → Apps Script, ouvert depuis CE tableur.
 * Déployer → Application Web → Exécuter en tant que : Moi → Qui a accès : Tout le monde.
 * L'URL /exec va dans VITE_ADMIN_WEBAPP_URL.
 *
 * Ce script n'ouvre aucun autre fichier. Il ne reçoit pas les réponses du questionnaire.
 * La feuille Adresses mail relie l'adresse au code à 8 caractères.
 * Le même code n'ajoute pas une seconde adresse.
 * Après une modification : Déployer → Gérer les déploiements → crayon → Nouvelle version.
 */
const MAIL_TAB = 'Adresses mail'
const INTERVIEWERS_TAB = 'Enquêteurs'
const COMMUNES_TAB = 'Communes'
const INTERVIEWER_HEADER = 'Prénom Nom'
const DEVICE_HEADER = 'Identifiants appareils autorisés'
const ADMIN_HEADER = 'Admin'
const COMMUNE_HEADER = 'Nom commune'

function doGet(e) {
  var params = e && e.parameter ? e.parameter : {}
  var callback = String(params.callback || '')
  var payload
  try {
    var action = String(params.action || '')
    if (action === 'add' || action === 'remove') payload = changeDevices(params, action)
    else payload = readConfig(params.device, params.who)
  } catch (error) {
    payload = { ok: false, error: String(error && error.message ? error.message : error).slice(0, 180) }
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]{0,40}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(payload) + ')').setMimeType(
      ContentService.MimeType.JAVASCRIPT,
    )
  }
  return json(payload)
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData && e.postData.contents ? e.postData.contents : '{}')
    if (body.kind === 'ping') return json({ ok: true, service: 'questionnaire-mobilite-admin' })
    if (body.kind !== 'mail') return json({ ok: false, error: 'Envoi ignoré.' })
    assertDevice(body)
    const lock = LockService.getScriptLock()
    lock.waitLock(15000)
    try {
      writeMail(body)
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
  if (!book) throw new Error('Ouvrez le script depuis le tableur privé.')
  return book
}

function readConfig(device, who) {
  const communesSheet = spreadsheet().getSheetByName(COMMUNES_TAB)
  if (!communesSheet) return { ok: false, error: 'Feuille Communes introuvable.' }
  const loaded = loadInterviewers()
  return {
    ok: true,
    service: 'questionnaire-mobilite',
    interviewers: presentInterviewers(loaded.people, normalizeDevice(device), String(who || '').trim()),
    communes: columnByHeader(communesSheet, COMMUNE_HEADER),
  }
}

function changeDevices(params, action) {
  const device = normalizeDevice(params.device)
  const who = String(params.who || '').trim()
  const interviewer = String(params.interviewer || '').trim()
  const target = normalizeDevice(params.target)
  if (!device || !who) throw new Error('Administration refusée.')
  if (!target) throw new Error('Identifiant illisible.')
  const lock = LockService.getScriptLock()
  lock.waitLock(15000)
  try {
    const loaded = loadInterviewers()
    if (!isAdmin(loaded.people, who, device)) throw new Error('Administration refusée.')
    let person = null
    for (let i = 0; i < loaded.people.length; i++) {
      if (loaded.people[i].name === interviewer) person = loaded.people[i]
    }
    if (!person) throw new Error('Enquêteur introuvable.')
    const devices = person.devices.slice()
    const index = devices.indexOf(target)
    if (action === 'add' && index === -1) devices.push(target)
    if (action === 'remove' && index !== -1) devices.splice(index, 1)
    loaded.sheet.getRange(person.sheetRow, loaded.deviceCol).setValue(formatDevices(devices))
    SpreadsheetApp.flush()
    return readConfig(device, who)
  } finally {
    lock.releaseLock()
  }
}

function loadInterviewers() {
  const sheet = spreadsheet().getSheetByName(INTERVIEWERS_TAB)
  if (!sheet) throw new Error('Feuille Enquêteurs introuvable.')
  const lastRow = sheet.getLastRow()
  const lastCol = sheet.getLastColumn()
  if (!lastRow || !lastCol) throw new Error('Colonne « Prénom Nom » introuvable.')
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
  const nameIndex = headerIndex(headers, INTERVIEWER_HEADER)
  const deviceIndex = headerIndex(headers, DEVICE_HEADER)
  const adminIndex = headerIndex(headers, ADMIN_HEADER)
  if (nameIndex === -1) throw new Error('Colonne « Prénom Nom » introuvable.')
  if (deviceIndex === -1) throw new Error('Colonne « Identifiants appareils autorisés » introuvable.')
  if (adminIndex === -1) throw new Error('Colonne « Admin » introuvable.')
  const people = []
  if (lastRow >= 2) {
    const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()
    const seen = {}
    for (let row = 0; row < values.length; row++) {
      const name = String(values[row][nameIndex] || '').trim().slice(0, 120)
      if (!name || seen[name]) continue
      seen[name] = true
      people.push({
        name: name,
        admin: String(values[row][adminIndex] || '').trim().toLowerCase() === 'oui',
        devices: parseDevices(values[row][deviceIndex]),
        sheetRow: row + 2,
      })
      if (people.length >= 400) break
    }
  }
  return { sheet: sheet, deviceCol: deviceIndex + 1, people: people }
}

function presentInterviewers(people, device, who) {
  const reveal = isAdmin(people, who, device)
  return people.map(function (person) {
    const item = {
      name: person.name,
      admin: person.admin,
      authorized: Boolean(device) && person.devices.indexOf(device) !== -1,
    }
    if (reveal) item.devices = person.devices
    return item
  })
}

function isAdmin(people, who, device) {
  if (!who || !device) return false
  for (let i = 0; i < people.length; i++) {
    if (people[i].name === who && people[i].admin && people[i].devices.indexOf(device) !== -1) return true
  }
  return false
}

function assertDevice(row) {
  const name = String(row.enqueteur || '').trim()
  const device = normalizeDevice(row.appareil)
  if (!name || !device) throw new Error('Appareil non autorisé.')
  const people = loadInterviewers().people
  for (let i = 0; i < people.length; i++) {
    if (people[i].name === name && people[i].devices.indexOf(device) !== -1) return
  }
  throw new Error('Appareil non autorisé.')
}

function headerIndex(headers, name) {
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim() === name) return i
  }
  return -1
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

function formatDevices(devices) {
  if (!devices.length) return '[]'
  return '[' + devices.join(', ') + ']'
}

function normalizeDevice(value) {
  var text = String(value || '').trim().toLowerCase()
  if (text.charAt(0) === '[' && text.charAt(text.length - 1) === ']') text = text.substring(1, text.length - 1).trim()
  if (!text || text.length > 80 || /[\s,;\[\]]/.test(text)) return ''
  return text
}

function columnByHeader(sheet, header) {
  const lastRow = sheet.getLastRow()
  const lastCol = sheet.getLastColumn()
  if (!lastRow || !lastCol) return []
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
  let index = -1
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || '').trim() === header) index = i
  }
  if (index === -1 || lastRow < 2) return []
  const values = sheet.getRange(2, index + 1, lastRow - 1, 1).getValues()
  const seen = {}
  const list = []
  for (let row = 0; row < values.length; row++) {
    const text = String(values[row][0] || '').trim().slice(0, 120)
    if (!text || seen[text]) continue
    seen[text] = true
    list.push(text)
    if (list.length >= 400) break
  }
  return list
}

function writeMail(body) {
  const adresse = String(body && body.adresse ? body.adresse : '').trim().toLowerCase().slice(0, 120)
  const code = String(body && body.code ? body.code : '').trim()
  if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code)) throw new Error('Code illisible.')
  if (!adresse || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) throw new Error('Adresse mail illisible.')
  const sheet = mailSheet()
  let headers = readHeaders(sheet)
  if (!headers.length) {
    headers = ['code', 'horodatage_utc', 'adresse', 'recontact', 'collectif']
    sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    sheet.setFrozenRows(1)
  }
  if (headers.indexOf('code') === -1) throw new Error('Colonne « code » introuvable.')
  if (hasCode(sheet, headers, code)) return
  const record = {
    code: code,
    horodatage_utc: new Date().toISOString(),
    adresse: adresse,
    recontact: body.recontact === 'oui' ? 'oui' : 'non',
    collectif: body.collectif === 'oui' ? 'oui' : 'non',
  }
  const values = headers.map(function (header) {
    return record[header] || ''
  })
  sheet.appendRow(values)
}

function mailSheet() {
  const book = spreadsheet()
  let sheet = book.getSheetByName(MAIL_TAB)
  if (!sheet) sheet = book.insertSheet(MAIL_TAB)
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

function hasCode(sheet, headers, code) {
  let column = -1
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'code') column = i
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

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON)
}
