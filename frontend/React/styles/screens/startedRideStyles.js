// ─────────────────────────────────────────────
// screens/startedRideStyles.js
// ONLY styles unique to the StartedRide screen.
// Everything reusable lives in base/ or components/.
//
// Usage in StartedRide.jsx:
//   import startedRideStyles from '../styles/screens/startedRideStyles';
//   import cards from '../styles/base/cards';
//   import text from '../styles/base/text';
//   import layout from '../styles/base/layout';
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const startedRideStyles = StyleSheet.create({
  // ── Screen root ──────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },

  // ── Header ───────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.black,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    color: colors.white,
    textAlign: 'center',
  },
  headerRight: {
    width: 50,
  },

  // ── Ride info block ───────────────────────────
  rideInfoContainer: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  rideTitle: {
    color: colors.white,
    fontSize: 30,
    fontWeight: fontWeight.black,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 5,
  },
  rideId: {
    color: colors.white,
    fontSize: fontSize.md,
    textAlign: 'center',
    marginBottom: 2,
  },

  // ── Info card (within content) ────────────────
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  infoTitle: {
    color: colors.white,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: 10,
  },
  infoText: {
    color: '#ddd',
    fontSize: fontSize.md,
    lineHeight: 20,
  },

  // ── Route info overlay (map overlay panel) ────
  routeInfoOverlay: {
    position: 'absolute',
    top: 35,
    right: 12,
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    padding: 10,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 2,
  },
  routeInfoHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  routeInfoHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoTitle: {
    color: colors.white,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  routeInfoContent: {
    padding: 14,
    paddingTop: 10,
  },
  routeScrollContainer: {
    maxHeight: 300,
  },
  routeScrollContent: {
    paddingBottom: 12,
  },

  // ── Route markers ─────────────────────────────
  routeMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  startMarker: {backgroundColor: '#16a34a'},
  stopMarker: {backgroundColor: '#d97706'},
  endMarker: {backgroundColor: '#dc2626'},
  routeMarkerNumber: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  routeLabel: {
    color: '#999',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
    letterSpacing: 0.5,
  },
  routeLocationText: {
    color: colors.white,
    fontSize: fontSize.md,
    marginLeft: 38,
    marginTop: 2,
    lineHeight: 20,
  },

  // Add to startedRideStyles.js (after participantsContainer section, before actionButtonsContainer)

  routePointContainer: {
    marginBottom: spacing.lg,
  },

  participantInfo: {
    flex: 1,
  },

  pollingStatusPill: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(20, 20, 20, 0.85)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },

  pollingStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  pollingStatusText: {
    color: '#fff',
    fontSize: fontSize.xs,
  },

  offlineBanner: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(30,30,30,0.9)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  offlineBannerText: {
    color: '#fff',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semi,
  },

  mapHeaderSpacer: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    marginBottom: 6,
  },

  participantLocationText: {
    color: '#4CAF50',
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  participantWaitingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  pollingErrorAlert: {
    backgroundColor: 'rgba(244,67,54,0.1)',
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f44336',
  },

  pollingErrorText: {
    color: '#f44336',
    fontSize: fontSize.xs,
  },

  // ── Participants section ───────────────────────
  participantsContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantsTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
    letterSpacing: 1,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
    backgroundColor: colors.overlayCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  participantAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.3)',
    borderWidth: 2,
    borderColor: 'rgba(139,92,246,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantInitial: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  participantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.white,
    marginBottom: 2,
  },
  participantStatus: {
    fontSize: fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },
  participantStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  participantStatusActive: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  emptyParticipants: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyParticipantsText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.4)',
    marginTop: spacing.sm,
  },

  // ── Action buttons (bottom floating row) ──────
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.92)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 99,
    paddingVertical: 8,
    paddingLeft: 16,
    paddingRight: 8,
    gap: 8,
  },
  actionPillDivider: {
    width: 0.5,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 4,
  },
  actionDetailsLabel: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: fontWeight.semi,
  },
  actionStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#c0392b',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14,
    gap: 6,
  },
  actionStopLabel: {
    fontSize: fontSize.sm,
    color: colors.white,
    fontWeight: fontWeight.semi,
  },
});

export default startedRideStyles;
