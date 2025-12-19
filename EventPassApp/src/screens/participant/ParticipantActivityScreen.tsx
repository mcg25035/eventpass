import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { ApiService } from '../../services/ApiService';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner
} from 'react-native-vision-camera';

const ParticipantActivityScreen = ({ route, navigation }: any) => {
  const { activityName, activityId } = route.params || { activityName: 'Event', activityId: '' };
  const [isScanning, setIsScanning] = useState(false);
  const [eventStatus, setEventStatus] = useState<'loading' | 'active' | 'not_started' | 'ended'>('loading');
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  useEffect(() => {
    checkEventStatus();
  }, [activityId]);

  const checkEventStatus = async () => {
    try {
      const event = await ApiService.events.getEvent(activityId);
      const now = new Date();
      const start = new Date(event.start_time);
      const end = new Date(event.end_time);

      if (now < start) {
        setEventStatus('not_started');
      } else if (now > end) {
        setEventStatus('ended');
      } else {
        setEventStatus('active');
      }
    } catch (error) {
      console.error('Failed to check event status', error);
      // Fallback if fetch fails (e.g. offline), maybe assume active or show error
      setEventStatus('active');
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: async (codes) => {
      if (codes.length > 0 && isScanning) {
        setIsScanning(false); // Stop scanning immediately
        const value = codes[0].value;
        if (!value) return;

        console.log(`Scanned: ${value}`);

        // Simple format check (In real app, use structured JSON or Prefix)
        // Assume simple token = Online
        // Assume JSON with specific fields = Offline

        // 1. Try Online Claim
        try {
          // Optimization: Only if it looks like a token (e.g. UUID)
          // For now, try claim
          await handleOnlineClaim(value);
        } catch (ignored) {
          // 2. Fallback to Offline Check
          // If online claim fails (maybe network, or it's an offline code)
          // handleOfflineVerification(value);
          Alert.alert('Scan Result', `Scanned: ${value}\n\n(Online Claim Failed, Offline logic not yet fully implemented)`);
        }
      }
    }
  });

  const handleOnlineClaim = async (token: string) => {
    try {
      const result = await ApiService.events.claimBadge(token);
      Alert.alert('Success', 'Badge Claimed Successfully!');
    } catch (error: any) {
      throw error; // Rethrow to let caller handle or show specific error
    }
  };

  const handleOfflineVerification = async (data: string) => {
    // Mock Offline Logic
    Alert.alert('Offline Mode', 'Verification data saved locally. Please sync when online.');
  };

  const handleStartScan = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to scan codes.', [
          { text: 'Settings', onPress: () => Linking.openSettings() },
          { text: 'Cancel' }
        ]);
        return;
      }
    }
    setIsScanning(true);
  };

  if (isScanning) {
    if (device == null) {
      return (
        <SafeAreaView style={styles.scannerContainer}>
          <View style={styles.scannerCenter}>
            <Text style={{ color: 'white' }}>No Camera Device Found</Text>
            <TouchableOpacity onPress={() => setIsScanning(false)}><Text style={{ color: 'white', marginTop: 20 }}>Close</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.scannerContainer}>
        {/* Real Camera Feed */}
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          codeScanner={codeScanner}
        />

        {/* Overlay */}
        <View style={styles.overlay}>

          {/* Header Controls */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setIsScanning(false)}
            >
              <Text style={styles.iconText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Scan Badge</Text>
            <TouchableOpacity style={styles.iconButton}>
              <Text style={styles.iconText}>⚡</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Frame Area */}
          <View style={styles.scannerCenter}>
            <View style={styles.scanFrame}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
              <View style={styles.scanLine} />
            </View>
            <Text style={styles.scanInstruction}>Align QR code within frame</Text>
          </View>

        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{activityName}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.welcomeText}>Welcome to {activityName}!</Text>
          <Text style={styles.infoText}>Ready to participate? Scan the organizer's badge code to check in or receive your badge.</Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStartScan}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.scanIcon}>📷</Text>
          </View>
          <Text style={styles.scanButtonText}>Scan Badge (掃描憑證)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5ea',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  scanButton: {
    flexDirection: 'row',
    backgroundColor: '#000',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30, // Pill shape
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 10,
  },
  scanIcon: {
    fontSize: 20,
    color: '#fff',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Scanner Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraMock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40, // Status bar space
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scannerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
    marginBottom: 30,
  },
  scanInstruction: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    textAlign: 'center',
  },
  scanLine: {
    height: 2,
    backgroundColor: '#34C759',
    width: '100%',
    position: 'absolute',
    top: '50%',
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  // Frame Corners
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 30, height: 30, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 30, height: 30, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#fff' },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 30, height: 30, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#fff' },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#fff' },

  statusContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  statusText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },

});

export default ParticipantActivityScreen;
