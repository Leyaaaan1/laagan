// ─────────────────────────────────────────────
// base/images.js
// Image containers, carousels, map images.
// ─────────────────────────────────────────────

import { StyleSheet, Dimensions } from 'react-native';
import colors from '../tokens/colors';
import spacing from '../tokens/spacing';

const { width, height } = Dimensions.get('window');

const images = StyleSheet.create({

  // ── Generic image ────────────────────────────
  base: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 2,
  },

  // ── Ride list card image ──────────────────────
  rideCard: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },

  // ── Map wrapper ──────────────────────────────
  mapWrapper: {
    height: 350,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // ── Map thumbnail ────────────────────────────
  mapThumbnail: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },

  // ── Map container (full) ─────────────────────
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  // ── Carousel card ────────────────────────────
  carouselCard: {
    marginHorizontal: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  carouselImage: {
    width: width - 40,
    height: height * 0.32,
    backgroundColor: '#222',
  },

  // ── Image meta overlay ───────────────────────
  metaOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metaText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Counter pill ─────────────────────────────
  counter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  counterText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Oblong / thumbnail ───────────────────────
  oblong: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  oblongContainer: {
    width: '100%',
    height: 120,
    alignItems: 'flex-start',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.sm,
  },

  // ── Location image container (carousel) ──────
  locationImageContainer: {
    width: width * 0.8,
    height: 200,
    marginRight: spacing.md,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  locationImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
});

export default images;
