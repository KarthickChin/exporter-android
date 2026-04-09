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

    const allTokens = await sdk.tokens.getTokens(remoteVersionIdentifier)
    const brands = await sdk.brands.getBrands(remoteVersionIdentifier)
    const themes = await sdk.tokens.getTokenThemes(remoteVersionIdentifier)
    const tokenGroups = await sdk.tokens.getTokenGroups(remoteVersionIdentifier, {
      type: TokenType.typography,
    })

    let colorMap: GroupedColorMap = {}
    for (const brand of brands) {
      const brandThemes = themes.filter((t) => t.brandId === brand.id)
      const brandColorMap = groupTokensByTheme(brandThemes, brand.name)
      colorMap = { ...colorMap, ...brandColorMap }
    }

    const fontFamilyVariable =
      exportConfiguration.fontFamilyVariable ?? "sharpGFontFamily"
    const brandId = context.brandId ?? brands[0]?.id ?? ""
    const typoResult = groupTypography(
      themes,
      allTokens,
      brandId,
      tokenGroups,
      fontFamilyVariable,
      (all, tokens, th) => sdk.tokens.computeTokensByApplyingThemes(all, tokens, th)
    )

    const outputFiles: AnyOutputFile[] = []

    outputFiles.push(
      FileHelper.createTextFile({
        relativePath: "uicomponents/src/main/java/com/mindvalley/uicomponents/",
        fileName: "ExportedColor.kt",
        content: generateComposeColors(
          colorMap,
          exportConfiguration.colorPackageName ?? "com.mindvalley.uicomponents"
        ),
      })
    )

    if (exportConfiguration.generateStoryColors !== false) {
      outputFiles.push(
        FileHelper.createTextFile({
          relativePath: "app/src/main/java/com/mindvalley/component/demo/screens/colors/",
          fileName: "AppColors.kt",
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
        relativePath: "uicomponents/src/main/java/com/mindvalley/uicomponents/compose/",
        fileName: "Typography.kt",
        content: generateTypography(
          typoResult.keys,
          typoResult.mobileMap,
          typoResult.tabletMap,
          exportConfiguration.typographyPackageName ??
            "com.mindvalley.uicomponents.compose"
        ),
      })
    )

    return outputFiles
  }
)
