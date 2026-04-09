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
  "100": "Thin",
  "200": "ExtraLight",
  "300": "Light",
  "400": "Normal",
  "500": "Medium",
  "600": "SemiBold",
  "700": "Bold",
  "800": "ExtraBold",
  "900": "Black",
}

function mapFontWeight(subfamily: string): string {
  return `FontWeight.${FONT_WEIGHT_MAP[subfamily] ?? "Normal"}`
}

function resolveTypographyData(
  token: TypographyToken,
  fontFamilyVariable: string
): TypographyData | null {
  try {
    const value = token.value
    const name = token.name
      .split(/[^a-zA-Z0-9]+/)
      .filter(Boolean)
      .map((word, i) =>
        i === 0
          ? word.charAt(0).toLowerCase() + word.slice(1).toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join("") || "unnamed"

    // Use the token's fontFamily from Supernova (support .text, .value, or string), converted to a Kotlin variable name.
    const familyText = (
      (value.fontFamily as { text?: string; value?: string } | undefined)?.text ??
      (value.fontFamily as { text?: string; value?: string } | undefined)?.value ??
      (typeof value.fontFamily === "string" ? value.fontFamily : "")
    ).trim()
    const fontFamily = familyText
      ? fontFamilyTextToVariableName(familyText)
      : fontFamilyVariable

    const weightText = (
      (value.fontWeight as { text?: string })?.text ??
      (typeof value.fontWeight === "string" ? value.fontWeight : "")
    ).trim()
    const fontWeight = mapFontWeight(weightText)

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

/**
 * Converts Supernova fontFamily.text (e.g. "Google Sans Flex") to a Kotlin
 * variable name (e.g. "googleSansFlex"). No suffix added—only what comes from the token.
 */
function fontFamilyTextToVariableName(text: string): string {
  const parts = text
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
  if (parts.length === 0) return "fontFamily"
  return parts
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toLowerCase() + word.slice(1).toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("")
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
    if (token.brandId !== brandId) continue
    if (!isInTypographyGroup(token, tokenGroups)) continue
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
      if (token.brandId !== brandId) continue
      if (!isInTypographyGroup(token, tokenGroups)) continue
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
