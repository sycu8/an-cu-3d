/** AnCư 3D design tokens — semantic + raw palette (P2). */

export const palette = {
  primary: "#285A52",
  primaryHover: "#214B45",
  accent: "#C9825B",
  background: "#F7F3EA",
  surface: "#EFE9DD",
  surfaceElevated: "#FCFAF6",
  text: "#25312E",
  textMuted: "#65716D",
  sage: "#93A99F",
  success: "#3F7D61",
  warning: "#B87935",
  error: "#B8534F",
} as const;

export const tokens = {
  background: palette.background,
  surface: palette.surface,
  surfaceElevated: palette.surfaceElevated,
  textPrimary: palette.text,
  textMuted: palette.textMuted,
  brandPrimary: palette.primary,
  brandPrimaryHover: palette.primaryHover,
  brandAccent: palette.accent,
  mapPassive: palette.sage,
  mapSelected: palette.primary,
  roomSelected: palette.accent,
  borderSubtle: "rgba(37, 49, 46, 0.12)",
  success: palette.success,
  warning: palette.warning,
  error: palette.error,
} as const;

export type Palette = typeof palette;
export type Tokens = typeof tokens;

export const BRAND = "AnCư 3D" as const;
export const TAGLINE = "Hiểu căn nhà trước khi gọi là nhà." as const;
