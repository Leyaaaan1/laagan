/**
 * RideDetailMediaUpload.jsx
 *
 * Bottom-sheet modal for uploading a photo or video to the ride.
 * Uses react-native-image-picker for both image and video selection.
 *
 * Props:
 *   visible           – boolean
 *   onClose           – () => void
 *   onPhotoUploaded   – (PhotoDTO) => void
 *   onVideoUploaded   – (VideoDTO) => void
 *   generatedRidesId  – string
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {launchImageLibrary} from 'react-native-image-picker';
import {finishedRideService} from '../../../services/finishedRideService';
import colors from '../../../styles/tokens/colors';
import spacing from '../../../styles/tokens/spacing';
import {fontSize, fontWeight} from '../../../styles/tokens/typography';

const PICKER_OPTIONS_IMAGE = {
  mediaType: 'photo',
  quality: 0.85,
  includeBase64: false,
};

const PICKER_OPTIONS_VIDEO = {
  mediaType: 'video',
  videoQuality: 'medium',
};

const MediaTypeButton = ({icon, label, active, onPress}) => (
  <TouchableOpacity
    style={[styles.typeBtn, active && styles.typeBtnActive]}
    onPress={onPress}
    activeOpacity={0.8}>
    <FontAwesome
      name={icon}
      size={18}
      color={active ? colors.white : colors.textSecondary}
    />
    <Text style={[styles.typeBtnLabel, active && styles.typeBtnLabelActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const RideDetailMediaUpload = ({
  visible,
  onClose,
  onPhotoUploaded,
  onVideoUploaded,
  generatedRidesId,
}) => {
  const [mode, setMode] = useState('photo'); // 'photo' | 'video'
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setSelectedFile(null);
    setCaption('');
    setUploading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickMedia = async () => {
    const options =
      mode === 'photo' ? PICKER_OPTIONS_IMAGE : PICKER_OPTIONS_VIDEO;
    const result = await launchImageLibrary(options);
    if (result.didCancel || result.errorCode) return;
    const asset = result.assets?.[0];
    if (asset) setSelectedFile(asset);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No file selected', 'Please select a photo or video first.');
      return;
    }
    setUploading(true);
    try {
      if (mode === 'photo') {
        const dto = await finishedRideService.uploadPhoto(
          generatedRidesId,
          selectedFile,
          caption,
        );
        onPhotoUploaded?.(dto);
      } else {
        const dto = await finishedRideService.uploadVideo(
          generatedRidesId,
          selectedFile,
        );
        onVideoUploaded?.(dto);
      }
      handleClose();
    } catch (err) {
      Alert.alert('Upload failed', err.message ?? 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fileLabel = selectedFile
    ? selectedFile.fileName ?? (mode === 'photo' ? 'photo.jpg' : 'video.mp4')
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          activeOpacity={1}
        />

        <View style={styles.sheet}>
          {/* drag handle */}
          <View style={styles.handle} />

          {/* header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Add media</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
              <FontAwesome
                name="times"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* type toggle */}
          <View style={styles.typeRow}>
            <MediaTypeButton
              icon="camera"
              label="Photo"
              active={mode === 'photo'}
              onPress={() => {
                setMode('photo');
                setSelectedFile(null);
              }}
            />
            <MediaTypeButton
              icon="video-camera"
              label="Video"
              active={mode === 'video'}
              onPress={() => {
                setMode('video');
                setSelectedFile(null);
              }}
            />
          </View>

          {/* pick file */}
          <TouchableOpacity
            style={styles.pickArea}
            onPress={pickMedia}
            activeOpacity={0.75}>
            <FontAwesome
              name={selectedFile ? 'check-circle' : 'folder-open-o'}
              size={26}
              color={selectedFile ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                styles.pickText,
                selectedFile && styles.pickTextSelected,
              ]}>
              {fileLabel ?? `Choose a ${mode}`}
            </Text>
            {selectedFile && (
              <TouchableOpacity
                onPress={() => setSelectedFile(null)}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
                <FontAwesome
                  name="times-circle"
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* caption (photo only) */}
          {mode === 'photo' && (
            <View style={styles.captionWrap}>
              <Text style={styles.captionLabel}>Caption (optional)</Text>
              <TextInput
                style={styles.captionInput}
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption…"
                placeholderTextColor={colors.textMuted}
                maxLength={200}
                multiline
              />
            </View>
          )}

          {/* upload button */}
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              (!selectedFile || uploading) && styles.uploadBtnDisabled,
            ]}
            onPress={handleUpload}
            disabled={!selectedFile || uploading}
            activeOpacity={0.8}>
            {uploading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <FontAwesome
                  name="cloud-upload"
                  size={15}
                  color={colors.white}
                />
                <Text style={styles.uploadBtnText}>Upload {mode}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },

  // ── type toggle ───────────────────────────────
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  typeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeBtnLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semi,
    color: colors.textSecondary,
  },
  typeBtnLabelActive: {
    color: colors.white,
  },

  // ── pick area ─────────────────────────────────
  pickArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pickText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  pickTextSelected: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semi,
  },

  // ── caption ───────────────────────────────────
  captionWrap: {
    marginBottom: spacing.md,
  },
  captionLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderLight,
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 64,
    textAlignVertical: 'top',
  },

  // ── upload button ─────────────────────────────
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  uploadBtnDisabled: {
    opacity: 0.45,
  },
  uploadBtnText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
});

export default RideDetailMediaUpload;
