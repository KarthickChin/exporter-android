import {
  ColorToken,
  Token,
  TokenTheme,
  TokenType,
  ElementProperty,
  ElementPropertyOption,
} from "@supernovaio/sdk-exporters"

export const ColorStylesEnum = {
  COLOR_STYLES: "Color Styles",
  EVE_COLOR_STYLES: "Eve Color Styles",
} as const

export interface ColorData {
  themeId: string
  hex: string
  style: string
  name: string
}

export type GroupedColorMap = Record<string, ColorData[]>

function colorValueToHex8(token: ColorToken): string {
  const { r, g, b } = token.value.color
  const opacity = token.value.opacity?.measure ?? 1
  const alpha = Math.round(opacity * 255)
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0")
  return `${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alpha)}`
}

function getColorStyle(token: Token): string | null {
  if (!token.propertyValues || !token.properties) {
    return null
  }
  const collectionId = token.propertyValues["collection"]
  if (!collectionId) {
    return null
  }
  const collectionProperty = token.properties.find(
    (prop: ElementProperty) => prop.codeName === "collection"
  )
  if (!collectionProperty?.options) {
    return null
  }
  const matched = collectionProperty.options.find(
    (opt: ElementPropertyOption) =>
      opt.id === collectionId &&
      (opt.name === ColorStylesEnum.COLOR_STYLES ||
        opt.name === ColorStylesEnum.EVE_COLOR_STYLES)
  )
  return matched ? matched.name : null
}

function getColorName(token: Token): string {
  if (token.origin?.name) {
    return token.origin.name.replace(/\//g, "")
  }
  return token.name
}

function buildColorName(
  token: Token,
  colorStyle: string,
  brand: string
): string {
  const baseName = getColorName(token)
  const anyToken = token as any

  if (baseName.includes("GradientBase")) {
    return baseName.replace(
      "GradientBase",
      colorStyle === ColorStylesEnum.EVE_COLOR_STYLES ? brand + "GB" : "Gb"
    )
  }

  if (baseName.includes("Alpha")) {
    if (colorStyle === ColorStylesEnum.EVE_COLOR_STYLES) {
      return brand + token.name
    }
    const parentName = anyToken.parent?.name ?? ""
    return parentName + token.name
  }

  if (colorStyle === ColorStylesEnum.EVE_COLOR_STYLES) {
    return brand + token.name
  }

  return token.name
}

export function groupTokensByTheme(
  themes: TokenTheme[],
  brand: string
): GroupedColorMap {
  const tokenMap: GroupedColorMap = {}

  for (const theme of themes) {
    const themeName = theme.name.trim()
    if (themeName !== "Dark" && themeName !== "Light") {
      continue
    }

    for (const token of theme.overriddenTokens) {
      if (token.tokenType !== TokenType.color) continue

      const colorStyle = getColorStyle(token)
      if (!colorStyle) continue

      const hex = colorValueToHex8(colorToken)
      const name = buildColorName(token, colorStyle, brand)

      if (!tokenMap[name]) {
        tokenMap[name] = []
      }
      tokenMap[name].push({
        themeId: themeName,
        hex,
        style: colorStyle,
        name,
      })
    }
  }

  return tokenMap
}

export function getColorsFor(
  colorMap: GroupedColorMap,
  colorName: string,
  themeId: string
): ColorData | null {
  const entries = colorMap[colorName]
  if (!entries || entries.length === 0) return null
  return entries.find((e) => e.themeId === themeId) ?? entries[0]
}

export function isColorThemed(
  colorMap: GroupedColorMap,
  colorName: string
): boolean {
  const entries = colorMap[colorName]
  if (!entries) return false

  let darkHex: string | null = null
  let lightHex: string | null = null

  for (const entry of entries) {
    if (entry.themeId === "Dark") darkHex = entry.hex
    if (entry.themeId === "Light") lightHex = entry.hex
    if (darkHex && lightHex) break
  }

  return darkHex !== null && lightHex !== null && darkHex !== lightHex
}

export function isColorStylesToken(
  colorMap: GroupedColorMap,
  colorName: string
): boolean {
  const entries = colorMap[colorName]
  if (!entries) return false
  return entries.some(
    (e) =>
      e.style === ColorStylesEnum.COLOR_STYLES ||
      e.style === ColorStylesEnum.EVE_COLOR_STYLES
  )
}
