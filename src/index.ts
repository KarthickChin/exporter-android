import {
  Supernova,
  PulsarContext,
  RemoteVersionIdentifier,
  AnyOutputFile,
  TokenType,
} from "@supernovaio/sdk-exporters"
import { FileHelper } from "@supernovaio/export-helpers"
import { groupTokensByTheme, GroupedColorMap } from "./helpers/color-helpers"
import { groupTypography } from "./helpers/typography-helpers"
import { generateComposeColors } from "./generators/compose-colors"
import { generateStoryColors } from "./generators/story-colors"
import { generateTypography } from "./generators/typography"
import { ExporterConfig } from "./config"

const exportConfiguration = Pulsar.exportConfig<ExporterConfig>()

Pulsar.export(
  async (sdk: Supernova, context: PulsarContext): Promise<Array<AnyOutputFile>> => {
    const remoteVersionIdentifier: RemoteVersionIdentifier = {
      designSystemId: context.dsId,
      versionId: context.versionId,
    }

    const diag: string[] = []
    diag.push(`=== Exporter Diagnostics ===`)
    diag.push(`dsId: ${context.dsId}`)
    diag.push(`versionId: ${context.versionId}`)
    diag.push(`brandId: ${context.brandId}`)
    diag.push("")

    const allTokens = await sdk.tokens.getTokens(remoteVersionIdentifier)
    const brands = await sdk.brands.getBrands(remoteVersionIdentifier)
    const themes = await sdk.tokens.getTokenThemes(remoteVersionIdentifier)

    diag.push(`Total tokens: ${allTokens.length}`)
    const typoTokens = allTokens.filter((t) => t.tokenType === TokenType.typography)
    const typoTokenCount = typoTokens.length
    diag.push(`Typography tokens (all): ${typoTokenCount}`)
    diag.push(`Brands: ${brands.map((b) => `${b.name} (${b.id})`).join(", ")}`)
    diag.push(`Themes: ${themes.length}`)
    diag.push("")

    for (const theme of themes) {
      const overrideCount = theme.overriddenTokens.length
      const typoOverrides = theme.overriddenTokens.filter(
        (t) => t.tokenType === TokenType.typography
      )
      const colorOverrides = theme.overriddenTokens.filter(
        (t) => t.tokenType === TokenType.color
      )
      diag.push(
        `Theme "${theme.name}" (brand: ${theme.brandId}) — ` +
          `overrides: ${overrideCount}, color: ${colorOverrides.length}, typography: ${typoOverrides.length}`
      )
      if (typoOverrides.length > 0) {
        for (const t of typoOverrides.slice(0, 3)) {
          diag.push(`  sample typo token: "${t.name}" origin=${JSON.stringify(t.origin?.name ?? null)}`)
        }
        if (typoOverrides.length > 3) {
          diag.push(`  ... and ${typoOverrides.length - 3} more`)
        }
      }
    }
    diag.push("")

    const tokenCollections = await sdk.tokens.getTokenCollections(remoteVersionIdentifier)
    diag.push(`Token collections (${tokenCollections.length}):`)
    for (const col of tokenCollections) {
      const anyCol = col as any
      diag.push(`  id=${anyCol.id} name="${anyCol.name}" codeName="${anyCol.codeName ?? "(n/a)"}"`)
    }
    diag.push("")

    const tokenGroups = await sdk.tokens.getTokenGroups(remoteVersionIdentifier, {
      type: TokenType.typography,
    })
    diag.push(`Token groups (typography): ${tokenGroups.length} total`)
    if (typoTokenCount > 0 && tokenGroups.length > 0) {
      const groupById = new Map(tokenGroups.map((g) => [g.id, g]))
      const sampleTypoForGroups = typoTokens.slice(0, 5)
      diag.push(`Typography tokens: group name and parent chain (first 5):`)
      for (const t of sampleTypoForGroups) {
        const chain: string[] = []
        let g = t.parentGroupId ? groupById.get(t.parentGroupId) : undefined
        for (let i = 0; i < 5 && g; i++) {
          chain.push(g.name)
          g = g.parentGroupId ? groupById.get(g.parentGroupId) : undefined
        }
        diag.push(`  "${t.name}" → group: ${chain.length > 0 ? chain.join(" → ") : "(no group)"}`)
      }
      const groupsContainingTypo = tokenGroups.filter(
        (g) => typoTokens.some((t) => t.parentGroupId === g.id)
      )
      diag.push(`Groups containing typography tokens (first 10):`)
      for (const g of groupsContainingTypo.slice(0, 10)) {
        const count = typoTokens.filter((t) => t.parentGroupId === g.id).length
        diag.push(`  id=${g.id} name="${g.name}" typography tokens=${count}`)
      }
    }
    diag.push("")

    if (typoTokenCount > 0) {
      const sampleTypo = allTokens
        .filter((t) => t.tokenType === TokenType.typography)
        .slice(0, 5)
      diag.push(`Detailed typography token diagnostics (first 5):`)
      for (const t of sampleTypo) {
        diag.push(`--- Token: "${t.name}" id=${t.id} ---`)
        diag.push(`  collectionId: ${t.collectionId === null ? "null" : t.collectionId === undefined ? "undefined" : t.collectionId}`)
        diag.push(`  brandId: ${t.brandId}`)
        diag.push(`  parentGroupId: ${t.parentGroupId}`)
        diag.push(`  origin: ${t.origin?.name ?? "null"}`)
        diag.push(`  propertyValues keys: [${Object.keys(t.propertyValues ?? {}).join(", ")}]`)
      }
      diag.push("")
    }

    let colorMap: GroupedColorMap = {}
    for (const brand of brands) {
      const brandThemes = themes.filter((t) => t.brandId === brand.id)
      const brandColorMap = groupTokensByTheme(brandThemes, brand.name)
      colorMap = { ...colorMap, ...brandColorMap }
    }

    diag.push(`Color map keys: ${Object.keys(colorMap).length}`)

    const fontFamilyVariable =
      exportConfiguration.fontFamilyVariable ?? "sharpGFontFamily"
    const typoResult = groupTypography(
      themes,
      allTokens,
      context.brandId ?? "",
      tokenGroups,
      fontFamilyVariable,
      (all, tokens, th) => sdk.tokens.computeTokensByApplyingThemes(all, tokens, th)
    )

    diag.push(`Typography keys: ${typoResult.keys.length}`)
    diag.push(`Typography mobile entries: ${Object.keys(typoResult.mobileMap).length}`)
    diag.push(`Typography tablet entries: ${Object.keys(typoResult.tabletMap).length}`)
    if (typoResult.keys.length > 0) {
      diag.push(`Sample keys: ${typoResult.keys.slice(0, 5).join(", ")}`)
    }

    const outputFiles: AnyOutputFile[] = []

    outputFiles.push(
      FileHelper.createTextFile({
        relativePath: exportConfiguration.composeColorsPath ?? "./",
        fileName: exportConfiguration.composeColorsFileName ?? "ExportedColor.kt",
        content: generateComposeColors(
          colorMap,
          exportConfiguration.colorPackageName ?? "com.mindvalley.uicomponents"
        ),
      })
    )

    if (exportConfiguration.generateStoryColors !== false) {
      outputFiles.push(
        FileHelper.createTextFile({
          relativePath: exportConfiguration.storyColorsPath ?? "./",
          fileName: exportConfiguration.storyColorsFileName ?? "AppColors.kt",
          content: generateStoryColors(
            colorMap,
            exportConfiguration.storyColorPackageName ??
              "com.mindvalley.component.demo.screens.colors"
          ),
        })
      )
    }

    outputFiles.push(
      FileHelper.createTextFile({
        relativePath: exportConfiguration.typographyPath ?? "./",
        fileName: exportConfiguration.typographyFileName ?? "Typography.kt",
        content: generateTypography(
          typoResult.keys,
          typoResult.mobileMap,
          typoResult.tabletMap,
          exportConfiguration.typographyPackageName ??
            "com.mindvalley.uicomponents.compose"
        ),
      })
    )

    outputFiles.push(
      FileHelper.createTextFile({
        relativePath: "./",
        fileName: "diagnostics.txt",
        content: diag.join("\n"),
      })
    )

    return outputFiles
  }
)
