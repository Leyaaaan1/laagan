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
import { getRideDetails } from '../../services/rideService';
import { buildRideStep4Params } from '../../utilities/NavigationParamsBuilder';
import scanner from '../../styles/components/scanner';
import {useAuth} from '../../context/AuthContext';
import {inviteService} from '../../services/inviteService';

const ScannerHeader = ({navigation}) => {
  const {token, username} = useAuth();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [scanMode, setScanMode] = useState('invite'); // 'invite' or 'ride'

  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');

  const handleBarCodeScanned = useCallback(
    async data => {
      if (!scanning || processing || !data) return;

      setScanning(false);
      setProcessing(true);

      try {
        // ─────────────────────────────────────────────────────────────────
        // MODE 1: INVITE LINK (View ride details from invite QR code)
        // ─────────────────────────────────────────────────────────────────
        if (scanMode === 'invite') {
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

          // ✅ Get invite details to extract ride ID
          const inviteDetails = await inviteService.getInviteDetailsByToken(
            inviteToken,
          );
          const generatedRidesId = inviteDetails.generatedRidesId;

          // ✅ Fetch full ride details
          const ride = await getRideDetails(generatedRidesId);
          const params = buildRideStep4Params(ride, username);

          setScannerVisible(false);

          navigation.navigate('RideStep4', params);

        }
        // ─────────────────────────────────────────────────────────────────
        // MODE 2: RIDE ID (View ride details by scanning ride ID QR code)
        // ─────────────────────────────────────────────────────────────────
        else if (scanMode === 'ride') {
          const rideId = data.trim();

          if (!rideId || isNaN(rideId)) {
            Alert.alert(
              'Invalid QR Code',
              'This QR code does not contain a valid ride ID.',
            );
            setScannerVisible(false);
            setProcessing(false);
            return;
          }

          const ride = await getRideDetails(parseInt(rideId));
          const params = buildRideStep4Params(ride, username);

          setScannerVisible(false);
          navigation.navigate('RideStep4', params);
        }
      } catch (error) {
        setScannerVisible(false);

        let errorMessage = 'Failed to process QR code';

        if (scanMode === 'invite') {
          if (error.message.includes('not found')) {
            errorMessage = 'Invite or ride not found';
          } else if (error.message.includes('expired')) {
            errorMessage = 'This invite link has expired';
          } else if (error.message) {
            errorMessage = error.message;
          }
        } else if (scanMode === 'ride') {
          if (error.message.includes('not found')) {
            errorMessage = 'Ride not found';
          } else if (error.message) {
            errorMessage = error.message;
          }
        }

        Alert.alert('Error', errorMessage);
      } finally {
        setProcessing(false);
        setScanning(true);
      }
    },
    [scanning, processing, scanMode, username, token, navigation],
  );


  // Use the built-in code scanner
  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (codes.length > 0 && scanning && !processing) {
        handleBarCodeScanned(codes[0].value);
      }
    },
  });

  const openScanner = async (mode = 'invite') => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera permission in your device settings to scan QR codes.',
          [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Open Settings', onPress: () => Linking.openSettings()},
          ],
        );
        return;
      }
    }
    setScanMode(mode);
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
        onPress={() => openScanner('invite')}
        activeOpacity={0.7}>
        <FontAwesome name="qrcode" size={16} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={scannerVisible}
        animationType="slide"
        onRequestClose={() => {
          setScannerVisible(false);
          setScanning(true);
        }}>
        <View style={scanner.scannerContainer}>
          <View style={scanner.scannerHeader}>
            <TouchableOpacity
              style={scanner.closeButton}
              onPress={() => {
                setScannerVisible(false);
                setScanning(true);
              }}>
              <FontAwesome name="times" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={scanner.scannerTitle}>
              {scanMode === 'invite' ? 'Scan Ride Invite' : 'Scan Ride ID'}
            </Text>
            <View style={{width: 40}} />
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
              <View
                style={[scanner.scanCorner, scanner.scanCornerBottomLeft]}
              />
              <View
                style={[scanner.scanCorner, scanner.scanCornerBottomRight]}
              />
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
              {scanMode === 'invite'
                ? 'Align invite QR code within frame'
                : 'Align ride QR code within frame'}
            </Text>
            <Text style={scanner.instructionsText}>
              {scanMode === 'invite'
                ? 'Point your camera at the ride invite QR code'
                : 'Point your camera at the ride ID QR code'}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ScannerHeader;