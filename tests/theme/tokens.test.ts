import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const css = readFileSync(
  join(import.meta.dirname, "..", "..", "src", "app", "globals.css"),
  "utf8",
);

/** Extracts the custom properties declared inside a given selector block. */
function tokensFor(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  const open = css.indexOf("{", start);
  const close = css.indexOf("\n}", open);
  const block = css.slice(open, close);
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/(--[\w-]+|color-scheme):\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim().replace(/\s*\/\*.*$/, "");
  }
  return tokens;
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

const light = tokensFor(":root");
const dark = tokensFor('[data-theme="dark"]');

const TEXT_TOKENS = [
  "--color-ink",
  "--color-ink-soft",
  "--color-text-muted",
  "--color-accent",
  "--color-destructive",
  "--color-positive",
];

describe("theme tokens", () => {
  it("removes number spinners while preserving semantic number inputs", () => {
    expect(css).toContain('input[type="number"] {');
    expect(css).toMatch(/input\[type="number"\]\s*\{[^}]*appearance:\s*textfield;/);
    expect(css).toContain('input[type="number"]::-webkit-inner-spin-button,');
    expect(css).toContain('input[type="number"]::-webkit-outer-spin-button {');
    expect(css).toMatch(/::-webkit-outer-spin-button\s*\{[^}]*appearance:\s*none;/);
  });

  it("defines a dark counterpart for every light palette token", () => {
    // Semantic aliases resolve through the palette, so only palette tokens
    // need an explicit dark value.
    const aliases = new Set([
      "--color-background",
      "--color-surface",
      "--color-surface-soft",
      "--color-foreground",
      "--color-muted-foreground",
      "--color-border",
      "--color-border-strong",
      "--color-ring",
    ]);
    for (const token of Object.keys(light)) {
      if (!token.startsWith("--color-") || aliases.has(token)) continue;
      expect(dark, `${token} missing in dark theme`).toHaveProperty(token);
    }
  });

  it("sets color-scheme on both themes so native controls match", () => {
    expect(light["color-scheme"]).toBe("light");
    expect(dark["color-scheme"]).toBe("dark");
  });

  it("inverts polarity between the two themes", () => {
    expect(relativeLuminance(dark["--color-canvas"])).toBeLessThan(
      relativeLuminance(dark["--color-ink"]),
    );
    expect(relativeLuminance(light["--color-canvas"])).toBeGreaterThan(
      relativeLuminance(light["--color-ink"]),
    );
  });

  it.each(TEXT_TOKENS)("meets 4.5:1 for %s on the light canvas", (token) => {
    expect(contrast(light[token], light["--color-canvas"])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(TEXT_TOKENS)("meets 4.5:1 for %s on the dark canvas", (token) => {
    expect(contrast(dark[token], dark["--color-canvas"])).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps muted text readable on the soft canvas tint in both themes", () => {
    for (const theme of [light, dark]) {
      expect(
        contrast(theme["--color-text-muted"], theme["--color-canvas-soft"]),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps primary button text readable in both themes", () => {
    for (const theme of [light, dark]) {
      expect(
        contrast(theme["--color-on-primary"], theme["--color-primary"]),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("separates the soft canvas from the canvas in both themes", () => {
    for (const theme of [light, dark]) {
      expect(theme["--color-canvas-soft"]).not.toBe(theme["--color-canvas"]);
    }
  });

  it("remains shadow-free, per DESIGN.md", () => {
    expect(css).not.toMatch(/box-shadow:\s*(?!none)/);
  });

  it("uses soft resting-card hairlines and borderless filled fields", () => {
    expect(css).toMatch(
      /\.card-surface\s*\{[^}]*border:\s*1px solid var\(--color-hairline-soft\);/,
    );
    expect(css).toMatch(/\.input\s*\{[^}]*border:\s*none;/);
    expect(css).toMatch(/\.dropdown-trigger\s*\{[^}]*border:\s*none;/);
  });

  it("uses the prescribed 2px ink focus ring for fields", () => {
    expect(css).toMatch(
      /\.input:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--color-ink\);/,
    );
  });

  it("honours prefers-reduced-motion", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
