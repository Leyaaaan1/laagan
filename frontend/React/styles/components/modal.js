// ─────────────────────────────────────────────
// components/modal.js
// Modal overlays, containers, tabs, participant cards.
// Used in ParticipantList, UnifiedRides.
// ─────────────────────────────────────────────

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const modal = StyleSheet.create({

  // ── Overlay ──────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Container ────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
    borderRadius: 24,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // ── Header ───────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },

  // ── Tabs ─────────────────────────────────────
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primaryAlpha10,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabBadge: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginLeft: spacing.sm,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },

  // ── Content area ─────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // ── Participant card ─────────────────────────
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  participantNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  participantNumberText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  participantInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  participantName: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
  },

  // ── Request card ─────────────────────────────
  requestCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestUsername: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semi,
    marginBottom: 2,
  },
  requestDate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // ── Request status text ───────────────────────
  statusPending:  { color: colors.warning, fontSize: fontSize.xs, fontWeight: fontWeight.semi, textTransform: 'uppercase', marginTop: spacing.xs },
  statusApproved: { color: colors.success, fontSize: fontSize.xs, fontWeight: fontWeight.semi, textTransform: 'uppercase', marginTop: spacing.xs },
  statusRejected: { color: colors.error,   fontSize: fontSize.xs, fontWeight: fontWeight.semi, textTransform: 'uppercase', marginTop: spacing.xs },

  // ── Action buttons in request card ───────────
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: { backgroundColor: colors.success },
  rejectButton:  { backgroundColor: colors.error },

  // ── QR code section ──────────────────────────
  qrSection: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  qrTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    marginBottom: 12,
  },
  qrContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  qrActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: 12,
  },
  qrActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    gap: spacing.sm,
  },
  qrActionButtonSecondary: {
    backgroundColor: colors.border,
  },
  qrActionButtonText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
  },
});

export default modal;