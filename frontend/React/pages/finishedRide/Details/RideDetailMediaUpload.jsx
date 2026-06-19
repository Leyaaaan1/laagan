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
import rideDetailStyles from '../../../styles/screens/rideDetailStyles';

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
    style={[
      rideDetailStyles.mediaTypeBtn,
      active && rideDetailStyles.mediaTypeBtnActive,
    ]}
    onPress={onPress}
    activeOpacity={0.8}>
    <FontAwesome
      name={icon}
      size={18}
      color={active ? colors.white : colors.textSecondary}
    />
    <Text
      style={[
        rideDetailStyles.mediaTypeBtnLabel,
        active && rideDetailStyles.mediaTypeBtnLabelActive,
      ]}>
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
        style={rideDetailStyles.mediaBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          activeOpacity={1}
        />

        <View style={rideDetailStyles.mediaSheet}>
          {/* drag handle */}
          <View style={rideDetailStyles.mediaHandle} />

          {/* header */}
          <View style={rideDetailStyles.mediaSheetHeader}>
            <Text style={rideDetailStyles.mediaSheetTitle}>Add media</Text>
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
          <View style={rideDetailStyles.mediaTypeRow}>
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
            style={rideDetailStyles.mediaPickArea}
            onPress={pickMedia}
            activeOpacity={0.75}>
            <FontAwesome
              name={selectedFile ? 'check-circle' : 'folder-open-o'}
              size={26}
              color={selectedFile ? colors.success : colors.textSecondary}
            />
            <Text
              style={[
                rideDetailStyles.mediaPickText,
                selectedFile && rideDetailStyles.mediaPickTextSelected,
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
            <View style={rideDetailStyles.mediaCaptionWrap}>
              <Text style={rideDetailStyles.mediaCaptionLabel}>
                Caption (optional)
              </Text>
              <TextInput
                style={rideDetailStyles.mediaCaptionInput}
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
              rideDetailStyles.mediaUploadBtn,
              (!selectedFile || uploading) &&
                rideDetailStyles.mediaUploadBtnDisabled,
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
                <Text style={rideDetailStyles.mediaUploadBtnText}>
                  Upload {mode}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default RideDetailMediaUpload;
