import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  StyleSheet,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { joinService } from '../../services/joinService';
import scanner from '../../styles/components/scanner';

const ScannerHeader = ({ token, username }) => {
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const handleBarCodeScanned = useCallback(async (data) => {
    if (!scanning || processing || !data) return;

    setScanning(false);
    setProcessing(true);

    try {
      let inviteToken = data;

      if (data.includes('/invite/link/')) {
        inviteToken = data.split('/invite/link/')[1];
      } else if (data.includes('/invite/')) {
        inviteToken = data.split('/invite/')[1];
      }

      if (!inviteToken) {
        Alert.alert(
          'Invalid QR Code',
          'This QR code does not contain a valid invite link.',
        );
        setScannerVisible(false);
        setProcessing(false);
        return;
      }

      const result = await joinService.joinRideByToken(inviteToken, token);
      console.log('Join ride result:', result);

      setScannerVisible(false);

      Alert.alert(
        'Request Submitted',
        'Your join request has been submitted! Waiting for the ride creator to approve.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Optionally navigate to a status page
              // navigation.navigate('JoinRequestStatus', { joinRequest: result });
            },
          },
        ],
      );
    } catch (error) {
      setScannerVisible(false);

      let errorMessage = 'Failed to submit join request';

      if (error.message.includes('already have a join request')) {
        errorMessage = 'You already have a pending request for this ride';
      } else if (error.message.includes('already a participant')) {
        errorMessage = 'You are already a participant in this ride';
      } else if (error.message.includes('creator of this ride')) {
        errorMessage = 'You cannot join your own ride';
      } else if (error.message.includes('expired')) {
        errorMessage = 'This invite link has expired';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setProcessing(false);
      setScanning(true);
    }
  }, [scanning, processing, username, token]);

  // Use the built-in code scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && scanning && !processing) {
        handleBarCodeScanned(codes[0].value);
      }
    },
  });

  const openScanner = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permission in your device settings to scan QR codes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    }
    setScannerVisible(true);
    setScanning(true);
  };

  if (!device) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={scanner.scanButton}
        onPress={openScanner}
        activeOpacity={0.7}
      >
        <FontAwesome name="qrcode" size={16} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => {
          setScannerVisible(false);
          setScanning(true);
        }}
      >
        <View style={scanner.scannerContainer}>
          <View style={scanner.scannerHeader}>
            <TouchableOpacity
              style={scanner.closeButton}
              onPress={() => {
                setScannerVisible(false);
                setScanning(true);
              }}
            >
              <FontAwesome name="times" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={scanner.scannerTitle}>Scan Ride Invite</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={scanner.cameraContainer}>
            {scannerVisible && hasPermission && device && (
              <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={scannerVisible}
                codeScanner={codeScanner}
              />
            )}

            <View style={scanner.scanFrame}>
              <View style={scanner.scanCorner} />
              <View style={[scanner.scanCorner, scanner.scanCornerTopRight]} />
              <View style={[scanner.scanCorner, scanner.scanCornerBottomLeft]} />
              <View style={[scanner.scanCorner, scanner.scanCornerBottomRight]} />
            </View>

            {processing && (
              <View style={scanner.processingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={scanner.processingText}>Processing...</Text>
              </View>
            )}
          </View>

          <View style={scanner.instructions}>
            <FontAwesome name="qrcode" size={40} color="#8c2323" />
            <Text style={scanner.instructionsTitle}>
              Align QR code within frame
            </Text>
            <Text style={scanner.instructionsText}>
              Point your camera at the ride invite QR code
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ScannerHeader;