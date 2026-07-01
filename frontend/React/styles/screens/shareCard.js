import {StyleSheet} from 'react-native';
import colors from '../../../React/styles/tokens/colors';
import spacing from '../../../React/styles/tokens/spacing';
import {fontSize, fontWeight} from '../tokens/typography';

// ════════════════════════════════════════════════════════════════════
// 1. CARD TOKENS — brand palette for the exported image only
// ════════════════════════════════════════════════════════════════════
export const cardTokens = {
  accent: '#1D9E75',
  accentSoft: 'rgba(29,158,117,0.18)',
  blue: '#378ADD',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.68)',
  textMuted: 'rgba(255,255,255,0.38)',
  bgDeep: '#0D0F14',
  bgCard: 'rgba(13,15,20,0.80)',
  bgSurface: 'rgba(27,31,46,0.88)',
  border: 'rgba(255,255,255,0.10)',
  borderMid: 'rgba(255,255,255,0.16)',

  // ── New: "glass" panel tokens for stat/graph cards over a photo bg ──
  glassBg: 'rgba(18,20,26,0.55)',
  glassBgStrong: 'rgba(14,16,22,0.68)',
  glassBorder: 'rgba(255,255,255,0.14)',
  shadowColor: 'rgba(0,0,0,0.45)',
};

// ════════════════════════════════════════════════════════════════════
// 2. CARD STYLES — RideShareCard.jsx (all values in 1080-card-space)
//    Layout: header → centered focal map+title → two-column
//    (stats left / graph right) → footer.
// ════════════════════════════════════════════════════════════════════
export const cardStyles = StyleSheet.create({
  inner: {flex: 1},

  // ── Header ──────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: 64,
    paddingHorizontal: 56,
    marginBottom: 8,
  },
  headerPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: cardTokens.glassBg,
    borderWidth: 1,
    borderColor: cardTokens.glassBorder,
  },
  headerText: {
    color: cardTokens.textSecondary,
    fontSize: 22,
    textAlign: 'center',
  },
  headerRider: {
    color: cardTokens.accent,
    fontWeight: '700',
  },

  // ── Centered focal point: map + ride name ────────────────────────
  focalWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48,
    gap: 28,
  },
  mapCard: {
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.22)',
    shadowColor: cardTokens.shadowColor,
    shadowOffset: {width: 0, height: 18},
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 14,
  },
  mapImage: {width: '100%', height: '100%'},
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {color: cardTokens.textMuted, fontSize: 22},

  rideName: {
    color: cardTokens.textPrimary,
    fontWeight: '800',
    fontSize: 64,
    letterSpacing: -0.5,
    lineHeight: 72,
    textAlign: 'center',
    maxWidth: 880,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: {width: 0, height: 3},
    textShadowRadius: 12,
  },

  // ── Two-column row: stats (left) · graph (right) ─────────────────
  columnsRow: {
    flexDirection: 'row',
    paddingHorizontal: 64,
    gap: 28,
    marginBottom: 56,
  },

  // Left column — key stats, stacked vertically for a clear hierarchy.
  statsColumn: {
    paddingVertical: 8,
    paddingHorizontal: 28,
    justifyContent: 'center',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  statAccentBar: {
    width: 6,
    height: 46,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginRight: 20,
  },
  statTextWrap: {flexShrink: 1},
  statValue: {
    color: cardTokens.textPrimary,
    fontWeight: '800',
    fontSize: 44,
    lineHeight: 50,
  },
  statUnit: {
    color: cardTokens.textSecondary,
    fontWeight: '400',
    fontSize: 24,
  },
  statLabel: {
    color: cardTokens.textMuted,
    fontSize: 17,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },
  statDivider: {
    height: 1,
    backgroundColor: cardTokens.borderMid,
    marginHorizontal: 4,
  },

  // Right column — performance graph, same visual weight as the left card.
  graphColumn: {
    borderRadius: 28,
    backgroundColor: cardTokens.glassBg,
    borderWidth: 1,
    borderColor: cardTokens.glassBorder,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  graphLabel: {
    color: cardTokens.textMuted,
    fontSize: 17,
    letterSpacing: 2.5,
    fontWeight: '600',
    marginBottom: 4,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  graphEmpty: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Footer ─────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    paddingBottom: 48,
  },
  slogan: {
    color: cardTokens.textMuted,
    fontSize: 20,
    letterSpacing: 0.6,
  },

  // ── Optional app logo badge (top-right) ─────────────────────────
  logoBadge: {
    position: 'absolute',
    top: 56,
    right: 48,
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: cardTokens.glassBg,
    borderWidth: 1,
    borderColor: cardTokens.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  logoImage: {width: '100%', height: '100%'},
});

// ════════════════════════════════════════════════════════════════════
// 3. BUTTON STYLES — ShareCardButton.jsx (real app UI, uses app tokens)
//    Unchanged from the previous version.
// ════════════════════════════════════════════════════════════════════
export const buttonStyles = StyleSheet.create({
  // Photo picker
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md, // 16
    marginTop: 12, // doesn't land on the 4/8-based scale — kept literal
    marginBottom: spacing.sm, // 8
    gap: spacing.sm, // 8
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm, // 8
    paddingVertical: 10, // not on the spacing scale — kept literal
    paddingHorizontal: 14, // not on the spacing scale — kept literal
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)', // NOTE: no matching colors.js token
    backgroundColor: colors.overlayCard, // rgba(255,255,255,0.05) — exact match
  },
  photoBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  photoBtnText: {
    color: colors.primary,
    fontWeight: fontWeight.medium, // 500
    fontSize: fontSize.md, // 14
  },
  photoBtnTextActive: {
    color: colors.white,
  },
  clearChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)', // NOTE: no matching colors.js token
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)', // NOTE: no matching colors.js token
  },

  // Share / Save
  row: {
    flexDirection: 'row',
    gap: 10, // not on the spacing scale — kept literal
    marginHorizontal: spacing.md, // 16
    marginTop: spacing.xs, // 4
    marginBottom: spacing.xs, // 4
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm, // 8
    paddingVertical: 12, // not on the spacing scale — kept literal
    borderRadius: 12,
    justifyContent: 'center',
  },
  btnPrimary: {
    flex: 3,
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)', // NOTE: no matching colors.js token
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)', // NOTE: no matching colors.js token
  },
  btnDisabled: {opacity: 0.5},
  btnTextPrimary: {
    color: colors.white,
    fontWeight: fontWeight.semi, // 600
    fontSize: fontSize.base, // 15
  },
  btnTextSecondary: {
    color: colors.primary,
    fontWeight: fontWeight.semi, // 600
    fontSize: fontSize.md, // 14
  },

  // Hint
  hint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.28)', // NOTE: no matching colors.js token
    fontSize: fontSize.sm, // 12
    marginBottom: spacing.sm, // 8
    letterSpacing: 0.4,
  },
});
