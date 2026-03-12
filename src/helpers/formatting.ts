/**
 * Converts a hex color string from RRGGBBAA to Compose format 0xAARRGGBB.
 * Input hex should be 8 characters (RRGGBBAA) without prefix.
 */
export function toComposeColorHex(hex: string): string {
  const clean = hex.replace(/^#/, "")
  if (clean.length < 8) {
    return `0xFF${clean.substring(0, 6).toUpperCase()}`
  }
  const red = clean.substring(0, 2)
  const green = clean.substring(2, 4)
  const blue = clean.substring(4, 6)
  const alpha = clean.substring(6, 8)
  return `0x${alpha}${red}${green}${blue}`.toUpperCase()
}
