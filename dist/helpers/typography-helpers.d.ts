import { Token, TokenGroup, TokenTheme } from "@supernovaio/sdk-exporters";
export interface TypographyData {
    name: string;
    fontFamily: string;
    fontSize: string;
    letterSpacing: string;
    fontWeight: string;
    lineHeight: string;
    sourceFontFamily?: string;
}
export interface TypographyMaps {
    keys: string[];
    mobileMap: Record<string, TypographyData>;
    tabletMap: Record<string, TypographyData>;
}
export declare function groupTypography(themes: TokenTheme[], allTokens: Token[], brandId: string, tokenGroups: TokenGroup[], fontFamilyVariable: string, computeTokensByTheme: (allTokens: Token[], tokens: Token[], themes: TokenTheme[]) => Token[]): TypographyMaps;
//# sourceMappingURL=typography-helpers.d.ts.map