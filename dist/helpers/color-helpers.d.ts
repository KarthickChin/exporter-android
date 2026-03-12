import { TokenTheme } from "@supernovaio/sdk-exporters";
export declare const ColorStylesEnum: {
    readonly COLOR_STYLES: "Color Styles";
    readonly EVE_COLOR_STYLES: "Eve Color Styles";
};
export interface ColorData {
    themeId: string;
    hex: string;
    style: string;
    name: string;
}
export type GroupedColorMap = Record<string, ColorData[]>;
export declare function groupTokensByTheme(themes: TokenTheme[], brand: string): GroupedColorMap;
export declare function getColorsFor(colorMap: GroupedColorMap, colorName: string, themeId: string): ColorData | null;
export declare function isColorThemed(colorMap: GroupedColorMap, colorName: string): boolean;
export declare function isColorStylesToken(colorMap: GroupedColorMap, colorName: string): boolean;
//# sourceMappingURL=color-helpers.d.ts.map