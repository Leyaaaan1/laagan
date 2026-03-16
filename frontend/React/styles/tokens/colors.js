// ─────────────────────────────────────────────
// tokens/colors.js
// Single source of truth for every color value.
// Import this everywhere — never hardcode hex values in component files.
// ─────────────────────────────────────────────

const colors = {
  // ── Brand ──────────────────────────────────
  primary:    '#8c2323',   // main red — buttons, accents, active states
  secondary:  '#f3c2c2',   // light red — secondary accents
  background: '#fbe9e9',   // very light red — light-mode backgrounds (rarely used)
  text:       '#fbe9e9',   // default text on dark surfaces

  // ── Full Tibetan Red Scale ──────────────────
  tibetanRed50:  '#fbe9e9',
  tibetanRed100: '#f3c2c2',
  tibetanRed200: '#e89898',
  tibetanRed300: '#db6e6e',
  tibetanRed400: '#cf4f4f',
  tibetanRed500: '#c23030',
  tibetanRed600: '#aa2a2a',
  tibetanRed700: '#8c2323',
  tibetanRed800: '#6f1c1c',
  tibetanRed900: '#4f1414',

  // ── Neutral / Dark UI ───────────────────────
  white:      '#ffffff',
  black:      '#000000',
  surface:    '#151515',   // cards, header, bottom bars
  surfaceAlt: '#1a1a1a',   // slightly lighter surface (header, rows)
  surfaceDark:'#0a0a0a',   // deepest background
  border:     '#222222',   // subtle borders
  borderLight:'#333333',   // slightly lighter borders / dividers

  // ── Text ────────────────────────────────────
  textPrimary:   '#ffffff',
  textSecondary: '#888888',
  textMuted:     '#666666',
  textDisabled:  '#444444',
  textDark:      '#1e293b', // text on light backgrounds

  // ── Status ──────────────────────────────────
  success:  '#10b981',
  warning:  '#f59e0b',
  error:    '#ef4444',
  info:     '#4285f4',

  // ── Overlays ────────────────────────────────
  overlay:       'rgba(0,0,0,0.7)',
  overlayLight:  'rgba(0,0,0,0.3)',
  overlayCard:   'rgba(255,255,255,0.05)',
  primaryAlpha10: 'rgba(140,35,35,0.10)',
  primaryAlpha15: 'rgba(140,35,35,0.15)',
  primaryAlpha20: 'rgba(140,35,35,0.20)',
};

export default colors;
