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

    const fontFamily = fontFamilyVariable

    let fontWeight = "FontWeight.Normal"
    const familyText = value.fontFamily.text
    if (familyText.includes("Cyr Semibold")) {
      fontWeight = "FontWeight.SemiBold"
    } else if (familyText.includes("Cyr Medium")) {
      fontWeight = "FontWeight.Medium"
    } else if (familyText.includes("Cyr Book") && value.fontWeight.text === "19") {
      fontWeight = "FontWeight.Light"
    } else if (familyText.includes("Cyr Book")) {
      fontWeight = "FontWeight.Normal"
    }

    const letterSpacing = `${value.letterSpacing.measure}.sp`
    const fontSize = `${value.fontSize.measure}.sp`
    const lineHeight =
      value.lineHeight != null
        ? `${value.lineHeight.measure}.sp`
        : "TextUnit.Unspecified"

    return { name, fontFamily, fontSize, letterSpacing, fontWeight, lineHeight }
  } catch (e) {
    console.error("Error processing typography token:", e)
    return null
  }
}

const TYPOGRAPHY_COLLECTION = "Typography"

function isInTypographyGroup(token: Token, tokenGroups: TokenGroup[]): boolean {
  const group = tokenGroups.find((g) => g.id === token.parentGroupId)
  if (!group) return false
  const fullPath = [...(group.path || []), group.name].join("/")
  return (
    fullPath === TYPOGRAPHY_COLLECTION ||
    fullPath.startsWith(TYPOGRAPHY_COLLECTION + "/")
  )
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

  if (!mobileTheme) {
    return { keys: [], mobileMap, tabletMap }
  }

  const mobileResolved = computeTokensByTheme(allTokens, allTokens, [mobileTheme])

  for (const token of mobileResolved) {
    if (token.tokenType !== TokenType.typography) continue
    if (token.brandId !== brandId) continue
    if (!isInTypographyGroup(token, tokenGroups)) continue
    const data = resolveTypographyData(token as TypographyToken, fontFamilyVariable)
    if (!data) continue
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

  return { keys: Array.from(keys), mobileMap, tabletMap }
}
