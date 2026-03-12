import { TypographyData } from "../helpers/typography-helpers"

export function generateTypography(
  keys: string[],
  mobileMap: Record<string, TypographyData>,
  tabletMap: Record<string, TypographyData>,
  packageName: string
): string {
  const lines: string[] = []

  lines.push(`package ${packageName}`)
  lines.push("")
  lines.push("import androidx.compose.material3.Typography")
  lines.push("import androidx.compose.runtime.Composable")
  lines.push("import androidx.compose.ui.text.TextStyle")
  lines.push("import androidx.compose.ui.text.font.FontStyle")
  lines.push("import androidx.compose.ui.text.font.FontWeight")
  lines.push("import androidx.compose.ui.unit.TextUnit")
  lines.push("import androidx.compose.ui.unit.sp")
  lines.push("import com.mindvalley.uicomponents.compose.extensions.isCompactWidth")

  for (const key of keys) {
    const mobile = mobileMap[key]
    if (!mobile) continue

    const tablet = tabletMap[key]

    lines.push("")
    if (!tablet) {
      lines.push(`val Typography.${mobile.name}: TextStyle`)
      lines.push("    @Composable")
      lines.push("    get() =")
      lines.push("        TextStyle(")
      lines.push(`            fontSize = ${mobile.fontSize},`)
      lines.push(`            letterSpacing = ${mobile.letterSpacing},`)
      lines.push(`            fontFamily = ${mobile.fontFamily},`)
      lines.push(`            fontWeight = ${mobile.fontWeight},`)
      lines.push("            fontStyle = FontStyle.Normal,")
      lines.push(`            lineHeight = ${mobile.lineHeight}`)
      lines.push("        )")
    } else {
      lines.push(`val Typography.${mobile.name}: TextStyle`)
      lines.push("    @Composable")
      lines.push("    get() = if (isCompactWidth()) {")
      lines.push("        TextStyle(")
      lines.push(`            fontSize = ${mobile.fontSize},`)
      lines.push(`            letterSpacing = ${mobile.letterSpacing},`)
      lines.push(`            fontFamily = ${mobile.fontFamily},`)
      lines.push(`            fontWeight = ${mobile.fontWeight},`)
      lines.push("            fontStyle = FontStyle.Normal,")
      lines.push(`            lineHeight = ${mobile.lineHeight}`)
      lines.push("        )")
      lines.push("    } else {")
      lines.push("        TextStyle(")
      lines.push(`            fontSize = ${tablet.fontSize},`)
      lines.push(`            letterSpacing = ${tablet.letterSpacing},`)
      lines.push(`            fontFamily = ${tablet.fontFamily},`)
      lines.push(`            fontWeight = ${tablet.fontWeight},`)
      lines.push("            fontStyle = FontStyle.Normal,")
      lines.push(`            lineHeight = ${tablet.lineHeight}`)
      lines.push("        )")
      lines.push("    }")
    }
  }

  return lines.join("\n")
}
