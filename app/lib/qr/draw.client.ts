import { encode } from 'uqr'

/** SVG du QR-code. Le texte n’est pas écrit en clair : seuls les modules noirs le portent. */
export function deviceQrSvg(value: string): string {
  const qr = encode(value, { ecc: 'M', border: 2 })
  const cells: string[] = []
  for (let y = 0; y < qr.size; y++) {
    const row = qr.data[y]
    if (!row) continue
    for (let x = 0; x < qr.size; x++) {
      if (row[x]) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`)
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${qr.size} ${qr.size}" shape-rendering="crispEdges" role="img"><rect width="100%" height="100%" fill="#fff"/>${cells.join('')}</svg>`
}
