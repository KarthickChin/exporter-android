import {
  GroupedColorMap,
  getColorsFor,
  isColorThemed,
  isColorStylesToken,
} from "../helpers/color-helpers"
import { toCamelCase, toPascalCase, safeTokenName } from "../helpers/naming"
import { toComposeColorHex } from "../helpers/formatting"

export function generateComposeColors(
  colorMap: GroupedColorMap,
  packageName: string
): string {
  const colorNames = Object.keys(colorMap)
  const lines: string[] = []

  lines.push(`package ${packageName}`)
  lines.push("")
  lines.push("import androidx.compose.material3.ColorScheme")
  lines.push("import androidx.compose.runtime.Composable")
  lines.push("import androidx.compose.ui.graphics.Color")
  lines.push("")

  // Themed ColorScheme extensions
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (!isColorThemed(colorMap, colorName)) continue

    const lightColor = getColorsFor(colorMap, colorName, "Light")
    const darkColor = getColorsFor(colorMap, colorName, "Dark")
    if (!lightColor || !darkColor) continue

    const propName = safeTokenName(toCamelCase(colorName))
    lines.push("")
    lines.push(`val ColorScheme.${propName}`)
    lines.push("    @Composable get() = if (LocalIsDarkTheme.current) {")
    lines.push(`        Color(${toComposeColorHex(darkColor.hex)})`)
    lines.push("    } else {")
    lines.push(`        Color(${toComposeColorHex(lightColor.hex)})`)
    lines.push("    }")
  }

  // LightColors object
  lines.push("")
  lines.push("object LightColors {")
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (!isColorThemed(colorMap, colorName)) continue

    const lightColor = getColorsFor(colorMap, colorName, "Light")
    if (!lightColor) continue

    const propName = safeTokenName(toPascalCase(lightColor.name))
    lines.push(`    val ${propName} = Color(${toComposeColorHex(lightColor.hex)})`)
  }
  lines.push("")
  lines.push("}")

  // DarkColors object
  lines.push("")
  lines.push("object DarkColors {")
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (!isColorThemed(colorMap, colorName)) continue

    const darkColor = getColorsFor(colorMap, colorName, "Dark")
    if (!darkColor) continue

    const propName = safeTokenName(toPascalCase(darkColor.name))
    lines.push(`    val ${propName} = Color(${toComposeColorHex(darkColor.hex)})`)
  }
  lines.push("}")

  // UnThemedColors object
  lines.push("")
  lines.push("object UnThemedColors {")
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (isColorThemed(colorMap, colorName)) continue

    const darkColor = getColorsFor(colorMap, colorName, "Dark")
    if (!darkColor) continue

    const propName = safeTokenName(toPascalCase(darkColor.name))
    lines.push(`    val ${propName} = Color(${toComposeColorHex(darkColor.hex)})`)
  }
  lines.push("}")

  return lines.join("\n")
}
