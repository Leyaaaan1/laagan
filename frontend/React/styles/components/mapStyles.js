// ─────────────────────────────────────────────
// components/mapStyles.js
// Map wrappers, route displays, image swapper.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const mapStyles = StyleSheet.create({

  // ── Map wrapper (inline in screen) ───────────
  wrapper: {
    height: 350,
    borderRadius: 16,
    overflow: 'hidden',
  },
  wrapperFull: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    height: '100%',
  },

  // ── Map image (static thumbnail) ─────────────
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // ── Image swapper (start/end toggle) ─────────
  swapperContainer: {
    backgroundColor: colors.black,
  },
  swapperInner: {
    backgroundColor: '#111',
    borderRadius: 8,
    overflow: 'hidden',
  },
  swapperImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#222',
  },
  swapperLocationInfo: {
    backgroundColor: '#111',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  swapperLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swapperDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  swapperLocationText: {
    flex: 1,
  },
  swapperLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  swapperName: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    letterSpacing: -0.2,
  },
  swapperTapButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  swapperTapText: {
    color: colors.white,
    fontSize: fontSize.md,
    letterSpacing: 0.2,
    borderWidth: 1,
    borderColor: colors.white,
    borderRadius: 4,
    paddingHorizontal: spacing.sm,
  },
  swapperNoMap: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
  },
  swapperNoMapText: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
  },

  // ── Route summary (start → stops → end) ──────
  routeHeader: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeIndicator: {
    width: 4,
    height: 20,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  routeTitle: {
    fontSize: 22,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  routePoint: {
    flex: 1,
    alignItems: 'center',
  },
  routeStartDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  routeEndDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    marginBottom: spacing.sm,
  },
  routePointText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: fontWeight.semi,
    textAlign: 'center',
  },
  routeConnection: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  routeLine: {
    height: 2,
    backgroundColor: colors.borderLight,
    width: '100%',
    marginBottom: spacing.sm,
  },
  routeArrowContainer: {
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Stop points list ─────────────────────────
  stopCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: 12,
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stopNumberText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  stopName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  stopCoords: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  stopConnector: {
    width: 2,
    height: 20,
    backgroundColor: colors.borderLight,
    marginLeft: 15,
    marginTop: spacing.sm,
  },

  // ── Map instructions pill ────────────────────
  instructionPill: {
    position: 'absolute',
    top: 135,
    left: 12,
    right: 12,
    elevation: 10,
    zIndex: 45,
  },
  instructionText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    textAlign: 'center',
    letterSpacing: -0.1,
    opacity: 0.9,
  },
});

export default mapStyles;
