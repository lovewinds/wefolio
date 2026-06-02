/**
 * Shared Nivo theme wired to the WeFolio design tokens.
 *
 * Values use CSS custom properties so charts follow the active light/dark
 * theme automatically (Nivo injects them as SVG/inline styles, where `var()`
 * resolves). Series `colors` should likewise prefer the warm token hexes from
 * `constants.ts` (CHART_COLORS / RISK_LEVEL_COLORS).
 */
export const nivoTheme = {
  axis: {
    ticks: {
      text: {
        fill: 'var(--ink-subtle)',
      },
    },
    legend: {
      text: {
        fill: 'var(--ink-muted)',
      },
    },
  },
  grid: {
    line: {
      stroke: 'var(--hairline)',
    },
  },
  legends: {
    text: {
      fill: 'var(--ink-muted)',
    },
  },
  tooltip: {
    container: {
      background: 'var(--ink)',
      color: 'var(--canvas)',
    },
  },
} as const;
