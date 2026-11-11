/** Lit une réponse SMTP terminée. `null` s’il manque encore une ligne. */
export function takeSmtpReply(buffer: string): { code: number; text: string; rest: string } | null {
  let offset = 0
  while (offset < buffer.length) {
    const nl = buffer.indexOf('\r\n', offset)
    if (nl < 0) return null
    const line = buffer.slice(offset, nl)
    const finished = /^\d{3} /.test(line) || /^\d{3}$/.test(line)
    if (finished || !/^\d{3}-/.test(line)) {
      return { code: finished ? Number(line.slice(0, 3)) : 0, text: buffer.slice(0, nl), rest: buffer.slice(nl + 2) }
    }
    offset = nl + 2
  }
  return null
}
