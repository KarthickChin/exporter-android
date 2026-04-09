import {
  Token,
  TokenGroup,
  TokenTheme,
  TokenType,
  TypographyToken,
} from "@supernovaio/sdk-exporters"

export interface TypographyData {
  name: string
  fontFamily: string
  fontSize: string
  letterSpacing: string
  fontWeight: string
  lineHeight: string
}

export interface TypographyMaps {
  keys: string[]
  mobileMap: Record<string, TypographyData>
  tabletMap: Record<string, TypographyData>
}

const FONT_WEIGHT_MAP: Record<string, string> = {
  // Numeric weights
  "100": "Thin",
  "200": "ExtraLight",
  "300": "Light",
  "400": "Normal",
  "500": "Medium",
  "600": "SemiBold",
  "700": "Bold",
  "800": "ExtraBold",
  "900": "Black",
  // Supernova non-standard weights (Google Sans Flex tokens)
  "19": "Light",
  "20": "Medium",
  // Text-based weights (lowercase for case-insensitive lookup)
  "thin": "Thin",
  "extralight": "ExtraLight",
  "extra-light": "ExtraLight",
  "ultralight": "ExtraLight",
  "light": "Light",
  "normal": "Normal",
  "regular": "Normal",
  "book": "Normal",
  "medium": "Medium",
  "semibold": "SemiBold",
  "semi-bold": "SemiBold",
  "demibold": "SemiBold",
  "bold": "Bold",
  "extrabold": "ExtraBold",
  "extra-bold": "ExtraBold",
  "ultrabold": "ExtraBold",
  "black": "Black",
  "heavy": "Black",
}

function mapFontWeight(weightText: string): string {
  const key = weightText.toLowerCase().trim()
  return `FontWeight.${FONT_WEIGHT_MAP[key] ?? "Normal"}`
}

function resolveTypographyData(
  token: TypographyToken,
  fontFamilyVariable: string
): TypographyData | null {
  try {
    const value = token.value
    console.log(`[TYPO_DEBUG] token.name="${token.name}" brandId="${token.brandId}" parentGroupId="${token.parentGroupId}" fontFamily=${JSON.stringify(value.fontFamily)} fontWeight=${JSON.stringify(value.fontWeight)} fontSize=${JSON.stringify(value.fontSize)} lineHeight=${JSON.stringify(value.lineHeight)}`)
    const name = token.name
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((word, i) =>
        i === 0
          ? word.charAt(0).toLowerCase() + word.slice(1).toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join("") || "unnamed"

    const fontFamily = fontFamilyVariable
    const fontWeight = mapFontWeight(value.fontWeight.text)

    const letterSpacing = `${value.letterSpacing.measure}.sp`
    const fontSize = `${value.fontSize.measure}.sp`
    const lineHeight =
      value.lineHeight != null
        ? `${value.lineHeight.measure}.sp`
        : "TextUnit.Unspecified"

    const data: TypographyData = {
      name,
      fontFamily,
      fontSize,
      letterSpacing,
      fontWeight,
      lineHeight,
    }
    return data
  } catch (e) {
    console.error("Error processing typography token:", e)
    return null
  }
}

function isInTypographyGroup(token: Token, tokenGroups: TokenGroup[]): boolean {
  return tokenGroups.some((g) => g.id === token.parentGroupId)
}

export function groupTypography(
  themes: TokenTheme[],
  allTokens: Token[],
  brandId: string,
  tokenGroups: TokenGroup[],
  fontFamilyVariable: string,
  computeTokensByTheme: (allTokens: Token[], tokens: Token[], themes: TokenTheme[]) => Token[]
): TypographyMaps {
  const keys = new Set<string>()
  const mobileMap: Record<string, TypographyData> = {}
  const tabletMap: Record<string, TypographyData> = {}

  const brandThemes = themes.filter((t) => t.brandId === brandId)
  const mobileTheme = brandThemes.find((t) => t.name.trim() === "Mobile")
  const tabletTheme = brandThemes.find((t) => t.name.trim() === "Tablet")

  const sourceTokens = mobileTheme
    ? computeTokensByTheme(allTokens, allTokens, [mobileTheme])
    : allTokens

  for (const token of sourceTokens) {
    if (token.tokenType !== TokenType.typography) continue
    const data = resolveTypographyData(token as TypographyToken, fontFamilyVariable)
    if (!data) continue
    if (keys.has(data.name)) continue
    keys.add(data.name)
    mobileMap[data.name] = data
  }

  if (tabletTheme) {
    const tabletResolved = computeTokensByTheme(allTokens, allTokens, [tabletTheme])
    for (const token of tabletResolved) {
      if (token.tokenType !== TokenType.typography) continue
      const data = resolveTypographyData(token as TypographyToken, fontFamilyVariable)
      if (!data) continue
      const mobile = mobileMap[data.name]
      if (!mobile) continue
      if (
        data.fontSize !== mobile.fontSize ||
        data.letterSpacing !== mobile.letterSpacing ||
        data.lineHeight !== mobile.lineHeight ||
        data.fontWeight !== mobile.fontWeight
      ) {
        tabletMap[data.name] = data
      }
    }
  }

  return {
    keys: Array.from(keys),
    mobileMap,
    tabletMap,
  }
}
