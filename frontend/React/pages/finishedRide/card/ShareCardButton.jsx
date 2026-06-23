

import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {useRideShareCard} from './useRideShareCard';
import colors from '../../../styles/tokens/colors';

const ShareCardButton = ({
  shareData,
  format = 'story',
  initialPhotoUri = null,
}) => {
  const {
    CardNode,
    triggerShare,
    triggerSave,
    sharing,
    saving,
    pickPhoto,
    clearPhoto,
    photoUri,
    picking,
  } = useRideShareCard({data: shareData, format, initialPhotoUri});

  const isLocked = sharing || saving;

  return (
    <>
      {/* Offscreen card — must be mounted for capture to work */}
      {CardNode}

      {/* ── Background photo picker ── */}
      <View style={ss.photoRow}>
        <TouchableOpacity
          style={[ss.photoBtn, photoUri && ss.photoBtnActive]}
          onPress={pickPhoto}
          activeOpacity={0.75}
          disabled={isLocked || picking}>
          {picking ? (
            <ActivityIndicator
              size="small"
              color={photoUri ? '#fff' : colors.primary}
            />
          ) : (
            <FontAwesome
              name="image"
              size={14}
              color={photoUri ? '#fff' : colors.primary}
            />
          )}
          <Text style={[ss.photoBtnText, photoUri && ss.photoBtnTextActive]}>
            {picking
              ? 'Opening…'
              : photoUri
              ? 'Change photo'
              : 'Add background photo'}
          </Text>
        </TouchableOpacity>

        {/* ✕ chip — only shown when a photo is selected */}
        {photoUri ? (
          <TouchableOpacity
            style={ss.clearChip}
            onPress={clearPhoto}
            activeOpacity={0.75}
            disabled={isLocked}>
            <FontAwesome
              name="times"
              size={13}
              color="rgba(255,255,255,0.55)"
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ── Share / Save row ── */}
      <View style={ss.row}>
        <TouchableOpacity
          style={[ss.btn, ss.btnPrimary, isLocked && ss.btnDisabled]}
          onPress={triggerShare}
          activeOpacity={0.75}
          disabled={isLocked}>
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="share-alt" size={15} color="#fff" />
          )}
          <Text style={ss.btnTextPrimary}>
            {sharing ? 'Preparing…' : 'Share Ride Card'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[ss.btn, ss.btnSecondary, isLocked && ss.btnDisabled]}
          onPress={triggerSave}
          activeOpacity={0.75}
          disabled={isLocked}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <FontAwesome name="download" size={14} color={colors.primary} />
          )}
          <Text style={ss.btnTextSecondary}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={ss.hint}>
        {format === 'story' ? '9:16 Story format' : '1:1 Feed format'}
      </Text>
    </>
  );
};

const ss = StyleSheet.create({
  // Photo picker
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  photoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  photoBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  photoBtnText: {
    color: colors.primary,
    fontWeight: '500',
    fontSize: 14,
  },
  photoBtnTextActive: {
    color: '#fff',
  },
  clearChip: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },

  // Share / Save
  row: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  btnPrimary: {
    flex: 3,
    backgroundColor: colors.primary,
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  btnDisabled: {opacity: 0.5},
  btnTextPrimary: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  btnTextSecondary: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },

  // Hint
  hint: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.28)',
    fontSize: 12,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
});

export default ShareCardButton;
