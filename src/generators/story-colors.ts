import {
  GroupedColorMap,
  getColorsFor,
  isColorThemed,
  isColorStylesToken,
} from "../helpers/color-helpers"
import { toCamelCase, safeTokenName } from "../helpers/naming"
import { toComposeColorHex } from "../helpers/formatting"

export function generateStoryColors(
  colorMap: GroupedColorMap,
  packageName: string
): string {
  const colorNames = Object.keys(colorMap)
  const lines: string[] = []

  lines.push(`package ${packageName}`)
  lines.push("")
  lines.push("import androidx.compose.ui.graphics.Color")
  lines.push("")
  lines.push("val appColors =")
  lines.push("    mutableListOf<ColorData>().apply {")

  // Themed light colors
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (!isColorThemed(colorMap, colorName)) continue

    const lightColor = getColorsFor(colorMap, colorName, "Light")
    if (!lightColor) continue

    const camelName = safeTokenName(toCamelCase(lightColor.name))
    const hexValue = toComposeColorHex(lightColor.hex)
    const codeHex = lightColor.hex.replace(/^#/, "").toUpperCase()
    lines.push("        add(")
    lines.push("            ColorData(")
    lines.push(`                color = Color(${hexValue}),`)
    lines.push(`                name = "${camelName}",`)
    lines.push(`                code = "#${codeHex}",`)
    lines.push("            ),")
    lines.push("        )")
  }

  lines.push("")

  // Themed dark colors
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (!isColorThemed(colorMap, colorName)) continue

    const darkColor = getColorsFor(colorMap, colorName, "Dark")
    if (!darkColor) continue

    const camelName = safeTokenName(toCamelCase(darkColor.name))
    const hexValue = toComposeColorHex(darkColor.hex)
    const codeHex = darkColor.hex.replace(/^#/, "").toUpperCase()
    lines.push("        add(")
    lines.push("            ColorData(")
    lines.push(`                color = Color(${hexValue}),`)
    lines.push(`                name = "${camelName}",`)
    lines.push(`                code = "#${codeHex}",`)
    lines.push("            ),")
    lines.push("        )")
  }

  lines.push("")

  // UnThemed colors
  for (const colorName of colorNames) {
    if (!isColorStylesToken(colorMap, colorName)) continue
    if (isColorThemed(colorMap, colorName)) continue

    const darkColor = getColorsFor(colorMap, colorName, "Dark")
    if (!darkColor) continue

    const camelName = safeTokenName(toCamelCase(darkColor.name))
    const hexValue = toComposeColorHex(darkColor.hex)
    const codeHex = darkColor.hex.replace(/^#/, "").toUpperCase()
    lines.push("        add(")
    lines.push("            ColorData(")
    lines.push(`                color = Color(${hexValue}),`)
    lines.push(`                name = "${camelName}",`)
    lines.push(`                code = "#${codeHex}",`)
    lines.push("            ),")
    lines.push("        )")
  }

  lines.push("    }")

  return lines.join("\n") + "\n"
}
