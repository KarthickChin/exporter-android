# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A custom [Supernova](https://supernova.io) exporter that runs inside the Supernova platform and generates three Kotlin files from Figma design tokens:

- `uicomponents/.../ExportedColor.kt` — Jetpack Compose `ColorScheme` extensions with Light/Dark adaptive colors, plus `LightColors`, `DarkColors`, and `UnThemedColors` objects
- `app/.../AppColors.kt` — A demo-screen `mutableListOf<ColorData>` for color storybook/preview
- `uicomponents/.../Typography.kt` — `Typography` extensions for each text style, with Mobile/Tablet responsive variants via `isCompactWidth()`

The exporter is bundled into `dist/build.js` by webpack, which is the file Supernova executes.

## Commands

```bash
# Production build (output: dist/build.js) — must be run before testing with Supernova
npm run build

# Development watch mode
npm run dev

# Run the exporter locally (builds first, then exports)
export $(grep -v '^#' .env | xargs) && npm run export:mv   # Mindvalley brand
export $(grep -v '^#' .env | xargs) && npm run export:eve  # Eve brand
```

> Credentials live in `.env` (git-ignored). Copy the format from `exporter-ios/.env` if setting up fresh.

```bash
# Verify generated files pass ktlint before committing (install once: brew install ktlint)
# The .editorconfig from mv-mobile-android-components must be present in the output dir
cp /Users/justin/mv-mobile-android-components/.editorconfig .build/output-mv/.editorconfig
ktlint ".build/output-mv/**/*.kt"
```

Always run this after `export:mv` and before committing. The `.editorconfig` from `mv-mobile-android-components` is critical — it sets `ij_kotlin_allow_trailing_comma_on_call_site = false` and `ktlint_code_style = android_studio`, which differ significantly from ktlint's defaults. Running ktlint without it will report false violations (e.g. demanding trailing commas that are actually banned). The generated files are linted by Danger on every PR to `mv-mobile-android-components` — ktlint failures surface as review warnings on that downstream PR.

There is no test runner configured in this project.

## Architecture

### Entry Point

`src/index.ts` is the Supernova exporter entry point. It calls `Pulsar.export()` (a global injected by Supernova runtime) with an async function that:

1. Fetches all tokens, brands, themes, and token groups from the Supernova SDK
2. Calls `groupTokensByTheme()` per brand to build a merged `GroupedColorMap`
3. Calls `groupTypography()` for the active brand, applying Mobile/Tablet theme overrides
4. Returns three `AnyOutputFile` instances via `FileHelper.createTextFile()`

Output file paths are hardcoded in `src/index.ts` to match the `mv-mobile-android-components` repo layout.

### Token Processing

**Colors** (`src/helpers/color-helpers.ts`):
- `groupTokensByTheme()` iterates theme `overriddenTokens`, filters to `TokenType.color`, and only includes tokens from the `"Color Styles"` or `"Eve Color Styles"` Supernova collection (detected via `token.propertyValues["collection"]`)
- Builds a `GroupedColorMap`: `Record<colorName, ColorData[]>` where each entry holds Light and Dark `ColorData`
- Color naming rules in `buildColorName()`: `GradientBase` tokens get a `Gb`/`eveGB` suffix; `Alpha` tokens get a brand/parent prefix; Eve Color Styles get a brand prefix
- A color is "themed" (`isColorThemed`) only if its Dark and Light hex values differ

**Typography** (`src/helpers/typography-helpers.ts`):
- `groupTypography()` resolves tokens by applying Mobile and Tablet themes via `sdk.tokens.computeTokensByApplyingThemes()`
- Only tokens whose parent group path starts with `"Typography"` are included
- Font family text (e.g. `"Google Sans Flex"`) is converted to a camelCase Kotlin variable name via `fontFamilyTextToVariableName()`
- Font weight is inferred from the family name string (e.g. `"Cyr Semibold"` → `FontWeight.SemiBold`)
- A tablet entry is only emitted to `tabletMap` if it differs from its mobile counterpart in any dimension

### Generators

- `src/generators/compose-colors.ts` — `generateComposeColors()`: emits `ColorScheme` extension properties (themed), plus `LightColors`, `DarkColors`, `UnThemedColors` objects
- `src/generators/story-colors.ts` — `generateStoryColors()`: emits the `appColors` list; each `add(ColorData(...))` block must have each closing `)` on its own line (ktlint requirement)
- `src/generators/typography.ts` — `generateTypography()`: emits `Typography` extension properties; if a tablet variant exists it wraps with `if (isCompactWidth())`, otherwise emits a plain `get()`

### Helpers

- `src/helpers/naming.ts`: `toCamelCase()`, `toPascalCase()`, `safeTokenName()` (prefixes numeric-leading names with `_`)
- `src/helpers/formatting.ts`: `toComposeColorHex()` — converts `RRGGBBAA` hex to Compose's `0xAARRGGBB` format
- `src/config.ts`: `ExporterConfig` interface — configurable via Supernova's exporter settings (`colorPackageName`, `storyColorPackageName`, `typographyPackageName`, `fontFamilyVariable`, `generateStoryColors`)

### Lessons Learned

A `.task/lessons.md` file is maintained in this repo (git-ignored) to capture lessons learned while working on tasks. Before starting work, check this file for relevant prior learnings. After resolving a non-obvious problem, append a concise entry describing what the issue was and how it was fixed.

### Important Constraints

`dist/build.js` is committed to the repo. After any source change, run `npm run build` and commit the updated `dist/build.js` alongside the source — Supernova executes the bundle directly.

This repo has two remotes: `origin` (`KarthickChin/exporter-android`) and `upstream` (`Supernova-Studio/exporter-android`). Always raise PRs against `origin` by passing `--repo KarthickChin/exporter-android` to `gh pr create`. Without this flag the `gh` CLI defaults to the `upstream` remote.
