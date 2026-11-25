/** Utilidades de color para las líneas del mapa. */

function hexRgb(hex: string): [number, number, number] | null {
  const limpio = hex.replace('#', '')
  if (!/^[0-9a-f]{6}$/i.test(limpio)) return null
  return [
    parseInt(limpio.slice(0, 2), 16) / 255,
    parseInt(limpio.slice(2, 4), 16) / 255,
    parseInt(limpio.slice(4, 6), 16) / 255,
  ]
}

function rgbHex(r: number, g: number, b: number): string {
  const canal = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${canal(r)}${canal(g)}${canal(b)}`
}

function hslDeHex(hex: string) {
  const rgb = hexRgb(hex)
  if (!rgb) return null
  const [r, g, b] = rgb
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s, l }
}

function hslAHex(h: number, s: number, l: number): string {
  const hue = (((h % 360) + 360) % 360) / 360
  const nuevaL = Math.min(0.52, Math.max(0.32, l))
  const nuevaS = Math.min(0.9, Math.max(0.5, s))
  const c = (1 - Math.abs(2 * nuevaL - 1)) * nuevaS
  const x = c * (1 - Math.abs(((hue * 6) % 2) - 1))
  const m = nuevaL - c / 2
  const sector = Math.floor(hue * 6) % 6
  const partes: [number, number, number][] = [
    [c, x, 0], [x, c, 0], [0, c, x],
    [0, x, c], [x, 0, c], [c, 0, x],
  ]
  const [r, g, b] = partes[sector]
  return rgbHex(r + m, g + m, b + m)
}

/** Ajusta el color de la línea para que sea visible sobre el mapa. */
export function colorLegible(hex: string): string {
  const hsl = hslDeHex(hex)
  return hsl ? hslAHex(hsl.h, hsl.s, hsl.l) : '#7B82A0'
}

/** Color complementario para distinguir el sentido de retorno. */
export function colorComplementario(hex: string): string {
  const hsl = hslDeHex(hex)
  return hsl ? hslAHex(hsl.h + 180, hsl.s, hsl.l) : '#9BA3C0'
}
