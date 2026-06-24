
import {StyleSheet} from 'react-native';
import colors from '../../../React/styles/tokens/colors';
import spacing from '../../../React/styles/tokens/spacing';
import {fontSize, fontWeight} from '../../../React/styles/tokens/typography';

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
};

// ════════════════════════════════════════════════════════════════════
// 2. CARD STYLES — RideShareCard.jsx (all values in 1080-card-space)
// ════════════════════════════════════════════════════════════════════
export const cardStyles = StyleSheet.create({
  inner: {flex: 1},

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 56,
    paddingTop: 72,
    paddingBottom: 20,
  },
  logoRow: {flexDirection: 'row', alignItems: 'center'},
  logoDot: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(29,158,117,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {fontSize: 26},
  appName: {
    color: cardTokens.textPrimary,
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: 0.5,
    marginLeft: 14,
  },
  headerDate: {color: cardTokens.textSecondary, fontSize: 20},
  headerRider: {color: cardTokens.accent, fontWeight: '600', fontSize: 20},

  accentLine: {
    height: 2,
    backgroundColor: cardTokens.accent,
    opacity: 0.65,
    marginHorizontal: 56,
    borderRadius: 2,
    marginBottom: 32,
  },

  // Snapshot map
  mapWrapper: {
    marginHorizontal: 48,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: cardTokens.border,
    marginBottom: 36,
  },
  mapImage: {width: '100%'},
  mapPlaceholder: {
    backgroundColor: cardTokens.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {color: cardTokens.textMuted, fontSize: 28},

  // Ride name
  nameWrapper: {
    paddingHorizontal: 56,
    marginBottom: 16,
  },
  rideName: {
    color: cardTokens.textPrimary,
    fontWeight: '800',
    fontSize: 72,
    letterSpacing: -0.5,
    lineHeight: 82,
  },

  // Speed graph (no background — transparent)
  graphWrapper: {marginBottom: 20},
  graphHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 56,
    marginBottom: 4,
  },
  graphLabel: {
    color: cardTokens.textMuted,
    fontSize: 18,
    letterSpacing: 2.5,
    fontWeight: '600',
  },

  // Stats card
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 48,
    paddingVertical: 32,
    paddingHorizontal: 8,
    marginBottom: 24,
  },
  statBlock: {flex: 1, alignItems: 'center', paddingHorizontal: 12},
  statValue: {
    color: cardTokens.textPrimary,
    fontWeight: '700',
    fontSize: 46,
    lineHeight: 54,
  },
  statUnit: {
    color: cardTokens.textSecondary,
    fontWeight: '400',
    fontSize: 26,
  },
  statLabel: {
    color: cardTokens.textMuted,
    fontSize: 17,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  dividerV: {
    width: 1,
    backgroundColor: cardTokens.borderMid,
    marginVertical: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 56,
    paddingBottom: 72,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: cardTokens.border,
  },
  slogan: {
    color: cardTokens.textSecondary,
    fontSize: 20,
    fontStyle: 'italic',
    letterSpacing: 0.2,
  },
  refCode: {
    color: cardTokens.textMuted,
    fontFamily: 'monospace',
    fontSize: 16,
    letterSpacing: 0.8,
    marginTop: 4,
  },
});

// ════════════════════════════════════════════════════════════════════
// 3. BUTTON STYLES — ShareCardButton.jsx (real app UI, uses app tokens)
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