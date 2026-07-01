import React, {useRef, useState, useCallback, useMemo} from 'react';
import {Share, Alert, Platform, PermissionsAndroid} from 'react-native';
import RideShareCard, {captureShareCard} from './RideShareCard';

// ── Optional native deps ──────────────────────────────────────────────────────
let launchImageLibrary = null;
try {
  launchImageLibrary = require('react-native-image-picker').launchImageLibrary;
} catch (_) {}

let RNFS = null;
try {
  RNFS = require('react-native-fs');
} catch (_) {}

let CameraRoll = null;
try {
  CameraRoll = require('@react-native-camera-roll/camera-roll').CameraRoll;
} catch (_) {}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function requestGalleryPermission() {
  if (Platform.OS !== 'android') return true;

  // Android 13+ (API 33+): launchImageLibrary uses the system Photo Picker,
  // which needs NO runtime permission at all — the OS handles access itself.
  // Our manifest also no longer declares READ_MEDIA_IMAGES (avoids the Play
  // Console sensitive-permission declaration), so requesting it here would
  // just silently fail with no system dialog and no way to grant it.
  if (Platform.Version >= 33) return true;

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: 'Photo Access',
        message: 'RideSync needs access to your photos to create a share card.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

async function requestSavePermission() {
  if (Platform.OS !== 'android' || Platform.Version >= 29) return true;
  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Save Photo',
        message: 'RideSync needs permission to save the image to your gallery.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

async function dataUriToTempFile(dataUri, filename) {
  if (!RNFS) return null;
  const base64 = dataUri.replace(/^data:image\/\w+;base64,/, '');
  const dir = RNFS.CachesDirectoryPath ?? RNFS.TemporaryDirectoryPath;
  const path = `${dir}/${filename}`;
  await RNFS.writeFile(path, base64, 'base64');
  return Platform.OS === 'android' ? `file://${path}` : path;
}

async function deleteTempFile(filePath) {
  if (!RNFS || !filePath) return;
  try {
    const bare = filePath.replace(/^file:\/\//, '');
    if (await RNFS.exists(bare)) await RNFS.unlink(bare);
  } catch (_) {}
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useRideShareCard({
                                   data,
                                   format = 'story',
                                   AppLogo = null,
                                   initialPhotoUri = null,
                                 } = {}) {
  const cardRef = useRef(null);

  const [photoUri, setPhotoUri] = useState(initialPhotoUri ?? null); // user-picked photo (or pre-loaded snapshot)
  const [picking, setPicking] = useState(false); // image picker open (UI only)
  const [sharing, setSharing] = useState(false); // share in progress
  const [saving, setSaving] = useState(false); // save in progress
  const [lastUri, setLastUri] = useState(null); // cached data-uri

  // Ref-based in-flight guard for pickPhoto.
  // Using a ref (not state) means the guard is synchronous and never captured
  // as a stale closure — this is what prevents the double-launch that causes:
  //   "Invariant Violation: No callback found with cbID … for ImagePicker.launchImageLibrary"
  const pickingRef = useRef(false);

  // Invalidate capture cache when data or photo changes
  const prevDataRef = useRef(null);
  const prevPhotoRef = useRef(null);
  if (prevDataRef.current !== data || prevPhotoRef.current !== photoUri) {
    prevDataRef.current = data;
    prevPhotoRef.current = photoUri;
    if (lastUri) setLastUri(null);
  }

  // ── Pick photo from gallery ────────────────────────────────────────────────
  const pickPhoto = useCallback(async () => {
    if (!launchImageLibrary) {
      Alert.alert(
        'Missing dependency',
        'Install react-native-image-picker:\n\nnpm install react-native-image-picker',
      );
      return;
    }

    // ── Ref guard (synchronous, never stale) ──────────────────────────────
    // DO NOT use the `picking` state value here. Because `picking` was in the
    // dep array, useCallback re-created this function on every state flip,
    // creating a window where a fast double-tap could launch the picker twice.
    // That double-launch is the direct cause of:
    //   "Invariant Violation: No callback found with cbID … for
    //    ImagePicker.launchImageLibrary — most likely the callback was already invoked"
    if (pickingRef.current) return;
    pickingRef.current = true;

    // ── Permission first, BEFORE setting picking=true ─────────────────────
    // This way the button never gets stuck if permission fails or is denied.
    const granted = await requestGalleryPermission();
    if (!granted) {
      pickingRef.current = false;
      Alert.alert(
        'Permission denied',
        'Please allow photo access in your device settings.',
      );
      return;
    }

    // ── Use Promise style, not callback ───────────────────────────────────
    // The callback form can silently never fire on some Android versions
    // (e.g. when the picker activity is killed in the background), which
    // leaves picking=true forever. Promise form always resolves or rejects.
    setPicking(true);
    try {
      const response = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1080,
        maxHeight: 1920,
        selectionLimit: 1,
      });
      console.log('[pickPhoto] response:', JSON.stringify(response));
      if (response.didCancel) {
        console.log('[pickPhoto] user cancelled');
      } else if (response.errorCode) {
        console.warn(
          '[pickPhoto] picker error:',
          response.errorCode,
          response.errorMessage,
        );
        Alert.alert(
          'Photo picker error',
          `${response.errorCode}: ${response.errorMessage ?? 'unknown'}`,
        );
      } else {
        const asset = response.assets?.[0];
        if (asset?.uri) setPhotoUri(asset.uri);
      }
    } catch (e) {
      console.warn('[pickPhoto] image picker threw:', e);
      Alert.alert('Photo picker crashed', String(e?.message ?? e));
    } finally {
      // Always reset both — no matter what happens above
      pickingRef.current = false;
      setPicking(false);
    }
  }, []); // ← no deps: ref guard makes this safe as a stable reference

  const clearPhoto = useCallback(() => setPhotoUri(null), []);

  // ── Capture ────────────────────────────────────────────────────────────────
  const capture = useCallback(async () => {
    if (lastUri) return lastUri;
    // Pass format so captureShareCard can derive the correct pixelRatio to
    // compensate for the viewport-safe renderScale applied in RideShareCard.
    const uri = await captureShareCard(cardRef, format);
    if (uri) setLastUri(uri);
    return uri;
  }, [lastUri, format]);

  // ── Share via OS sheet ─────────────────────────────────────────────────────
  const triggerShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    let tempPath = null;
    try {
      const dataUri = await capture();
      if (!dataUri) {
        Alert.alert('Share failed', 'Could not render the card. Try again.');
        return;
      }
      if (!RNFS) {
        Alert.alert(
          'Missing dependency',
          'Install react-native-fs:\n\nnpm install react-native-fs',
        );
        return;
      }
      tempPath = await dataUriToTempFile(dataUri, `ridesync-${Date.now()}.png`);
      if (!tempPath) {
        Alert.alert('Share failed', 'Could not write image file.');
        return;
      }

      await Share.share(
        Platform.OS === 'ios'
          ? {url: tempPath}
          : {title: data?.rideName ?? 'My Ride', url: tempPath},
      );
    } catch (e) {
      if (
        !e?.message?.includes('cancel') &&
        e?.message !== 'User did not share'
      ) {
        Alert.alert('Share error', e?.message ?? 'Unknown error');
      }
    } finally {
      setSharing(false);
      // Clean up after 15s — sheet may still be reading the file
      if (tempPath) setTimeout(() => deleteTempFile(tempPath), 15000);
    }
  }, [sharing, capture, data?.rideName]);

  // ── Save to gallery ────────────────────────────────────────────────────────
  const triggerSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    let tempPath = null;
    try {
      if (!RNFS) {
        Alert.alert(
          'Missing dependency',
          'Install react-native-fs:\n\nnpm install react-native-fs',
        );
        return;
      }
      if (!CameraRoll) {
        Alert.alert(
          'Missing dependency',
          'Install @react-native-camera-roll/camera-roll to save to gallery.',
        );
        return;
      }

      const granted = await requestSavePermission();
      if (!granted) {
        Alert.alert(
          'Permission denied',
          'Please allow storage access in your device settings.',
        );
        return;
      }

      const dataUri = await capture();
      if (!dataUri) {
        Alert.alert('Save failed', 'Could not render the card.');
        return;
      }

      tempPath = await dataUriToTempFile(dataUri, `ridesync-${Date.now()}.png`);
      if (!tempPath) {
        Alert.alert('Save failed', 'Could not write image file.');
        return;
      }

      await CameraRoll.saveAsset(tempPath, {type: 'photo', album: 'RideSync'});
      Alert.alert(
        'Saved!',
        'Your ride card has been saved to your gallery.',
      );
    } catch (e) {
      Alert.alert('Save error', e?.message ?? 'Unknown error');
    } finally {
      setSaving(false);
      if (tempPath) setTimeout(() => deleteTempFile(tempPath), 5000);
    }
  }, [saving, capture]);

  // ── Offscreen card node ────────────────────────────────────────────────────
  const CardNode = useMemo(
    () => (
      <RideShareCard
        ref={cardRef}
        data={data}
        format={format}
        photoUri={photoUri}
        AppLogo={AppLogo}
      />
    ),
    [data, format, photoUri, AppLogo],
  );

  return {
    CardNode, // mount this anywhere in your render tree (offscreen)
    cardRef,
    photoUri, // currently selected photo URI
    pickPhoto, // open the gallery picker
    clearPhoto, // remove the selected photo
    picking, // true while picker is open
    sharing,
    saving,
    triggerShare, // capture → write file → OS share sheet
    triggerSave, // capture → write file → save to gallery
    capture, // raw capture → data-uri (for custom flows)
  };
}

export default useRideShareCard;