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
  sourceFontFamily?: string
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
  // Supernova non-standard weights (Sharp Grotesk grade numbers that
  // leak into Google Sans Flex tokens). Grade 19 = Book = Normal (400);
  // Grade 20 = Medium variant = Medium (500).
  "19": "Normal",
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
    const sourceFontFamily = (value.fontFamily as any)?.text ?? ""
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

    const round = (n: number) => parseFloat(n.toFixed(2))
    const letterSpacing = `${round(value.letterSpacing.measure)}.sp`
    const fontSize = `${round(value.fontSize.measure)}.sp`
    const lineHeight =
      value.lineHeight != null
        ? `${round(value.lineHeight.measure)}.sp`
        : "TextUnit.Unspecified"

    const data: TypographyData = {
      name,
      fontFamily,
      fontSize,
      letterSpacing,
      fontWeight,
      lineHeight,
      sourceFontFamily,
    }
    return data
  } catch (e) {
    console.error("Error processing typography token:", e)
    return null
  }
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

  // Find Mobile/Tablet themes: first try the export brandId, then fall back
  // to any brand that has them (handles brandId mismatch with Supernova)
  let brandThemes = themes.filter((t) => t.brandId === brandId)
  if (!brandThemes.some((t) => t.name.trim() === "Mobile" || t.name.trim() === "Mobile (Android)")) {
    console.log(`[TYPO] No mobile theme for brandId=${brandId}, searching all brands...`)
    brandThemes = themes
  }

  // Prefer "Mobile (Android)" for this Android exporter, fall back to "Mobile"
  const mobileTheme = brandThemes.find((t) => t.name.trim() === "Mobile (Android)")
    ?? brandThemes.find((t) => t.name.trim() === "Mobile")
  // Tablet theme must be from the same brand as the mobile theme
  const mobileBrandId = mobileTheme?.brandId
  const tabletTheme = brandThemes.find((t) => t.name.trim() === "Tablet" && t.brandId === mobileBrandId)
    ?? brandThemes.find((t) => t.name.trim() === "Tablet")
  console.log(`[TYPO] Using mobileTheme="${mobileTheme?.name ?? "NOT FOUND"}" (brandId=${mobileTheme?.brandId}) tabletTheme="${tabletTheme?.name ?? "NOT FOUND"}" (brandId=${tabletTheme?.brandId})`)

  const sourceTokens = mobileTheme
    ? computeTokensByTheme(allTokens, allTokens, [mobileTheme])
    : allTokens

  const TARGET_FONT = "Google Sans Flex"
  const filterBrandId = mobileBrandId
  console.log(`[TYPO] Filtering tokens to brandId=${filterBrandId}`)
  let skippedDesktop = 0
  let skippedBrand = 0
  let skippedFont = 0
  for (const token of sourceTokens) {
    if (token.tokenType !== TokenType.typography) continue
    const originPath = token.origin?.name ?? ""
    if (originPath.startsWith("Desktop/")) {
      skippedDesktop++
      continue
    }
    const anyToken = token as any
    if (filterBrandId && anyToken.brandId && anyToken.brandId !== filterBrandId) {
      skippedBrand++
      continue
    }
    const typoToken = token as TypographyToken
    const sourceFontFamily = (typoToken.value.fontFamily as any)?.text ?? ""
    if (sourceFontFamily && sourceFontFamily !== TARGET_FONT) {
      skippedFont++
      continue
    }
    const data = resolveTypographyData(typoToken, fontFamilyVariable)
    if (!data) continue
    keys.add(data.name)
    mobileMap[data.name] = data
  }
  console.log(`[TYPO] Filtered: skippedDesktop=${skippedDesktop} skippedBrand=${skippedBrand} skippedFont=${skippedFont}`)
  console.log(`[TYPO] mobileMap: ${Object.keys(mobileMap).length} tokens`)

  const byFont: Record<string, string[]> = {}
  for (const [name, data] of Object.entries(mobileMap)) {
    const font = data.sourceFontFamily || "unknown"
    if (!byFont[font]) byFont[font] = []
    byFont[font].push(name)
  }
  for (const [font, names] of Object.entries(byFont)) {
    console.log(`[TYPO] Font "${font}" (${names.length} tokens): ${names.join(", ")}`)
  }

  if (tabletTheme) {
    const tabletResolved = computeTokensByTheme(allTokens, allTokens, [tabletTheme])
    for (const token of tabletResolved) {
      if (token.tokenType !== TokenType.typography) continue
      const originPath = token.origin?.name ?? ""
      if (originPath.startsWith("Desktop/")) continue
      const anyToken = token as any
      if (filterBrandId && anyToken.brandId && anyToken.brandId !== filterBrandId) continue
      const typoToken = token as TypographyToken
      const tabletFontFamily = (typoToken.value.fontFamily as any)?.text ?? ""
      if (tabletFontFamily && tabletFontFamily !== TARGET_FONT) continue
      const data = resolveTypographyData(typoToken, fontFamilyVariable)
      if (!data) continue
      const mobile = mobileMap[data.name]
      if (!mobile) continue
      const differs = data.fontSize !== mobile.fontSize ||
        data.letterSpacing !== mobile.letterSpacing ||
        data.lineHeight !== mobile.lineHeight ||
        data.fontWeight !== mobile.fontWeight
      if (differs) {
        console.log(`[TYPO] tablet diff: "${data.name}" mobile=${mobile.fontSize}/${mobile.fontWeight} tablet=${data.fontSize}/${data.fontWeight}`)
        tabletMap[data.name] = data
      }
    }
    console.log(`[TYPO] tabletMap: ${Object.keys(tabletMap).length} diffs found`)
  } else {
    console.log(`[TYPO] No tablet theme — skipping tablet processing`)
  }

  return {
    keys: Array.from(keys),
    mobileMap,
    tabletMap,
  }
}
