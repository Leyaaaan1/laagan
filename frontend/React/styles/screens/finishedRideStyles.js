
// File: frontend/React/styles/screens/finishedRideStyles.js

import { StyleSheet } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';
import { fontSize, fontWeight } from '../tokens/typography';

const finishedRideStyles = StyleSheet.create({
  // ── Screen root ──────────────────────────────
  container: {
    flex: 1,
    backgroundColor: colors.surfaceDark,
  },

  scrollContent: {
    paddingBottom: spacing.xl,
  },

  // ── Header ───────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },

  backButtonSmall: {
    padding: spacing.sm,
  },

  // ── Summary Card ─────────────────────────────
  summaryCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  rideName: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },

  summaryItem: {
    alignItems: 'center',
  },

  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  summaryValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semi,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: spacing.md,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeItem: {
    flex: 1,
    alignItems: 'center',
  },

  timeLabel: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  timeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },

  timeDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ── Section ──────────────────────────────────
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },

  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // ── Participants List ────────────────────────
  participantsList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  participantInitial: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  participantInfo: {
    flex: 1,
  },

  participantName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },

  participantCheckpoints: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  completionBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },

  completionPercent: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  // ── Checkpoint Header ────────────────────────
  checkpointHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  checkpointIconContainer: {
    marginRight: spacing.md,
  },

  checkpointTitleContainer: {
    flex: 1,
  },

  checkpointTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },

  checkpointCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ── Arrivals Container ───────────────────────
  arrivalsContainer: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  arriverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  arriverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.tibetanRed200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  arriverInitial: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.textDark,
  },

  arriverInfo: {
    flex: 1,
  },

  arriverUsername: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semi,
    color: colors.textPrimary,
  },

  arriverTime: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // ── Empty States ─────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  emptyText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },

  noDataText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },

  errorText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  backButton: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },

  backButtonText: {
    fontSize: fontSize.md,
    color: colors.white,
    fontWeight: fontWeight.semi,
  },

  // ── Done Button ──────────────────────────────
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    gap: spacing.sm,
  },

  doneButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

export default finishedRideStyles;