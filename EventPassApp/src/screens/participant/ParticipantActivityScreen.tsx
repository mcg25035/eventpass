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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from '../../services/ApiService';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner
} from 'react-native-vision-camera';
import QRCode from 'react-native-qrcode-svg';
import { Modal } from 'react-native';

const ParticipantActivityScreen = ({ route, navigation }: any) => {
  const { activityName, activityId } = route.params || { activityName: 'Event', activityId: '' };
  const [isScanning, setIsScanning] = useState(false);
  const [eventStatus, setEventStatus] = useState<'loading' | 'active' | 'not_started' | 'ended'>('loading');
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  // Show My ID
  const [showIdModal, setShowIdModal] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    checkEventStatus();
    loadUser();
  }, [activityId]);

  const loadUser = async () => {
    const info = await AsyncStorage.getItem('user_info');
    if (info) {
      const user = JSON.parse(info);
      setUserId(user.id);
    }
  };

  const checkEventStatus = async () => {
    try {
      const event = await ApiService.events.getPublicEvent(activityId);
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
        const value = codes[0].value?.trim();
        if (!value) return;

        console.log(`Scanned: ${value}`);

        try {
          // Check for Secure Offline QR (JSON)
          // Check for Secure Offline QR (JSON)
          // We assume any JSON starting with { is potentially a special token
          if (value.startsWith('{')) {
            try {
              const data = JSON.parse(value);
              if (data.type === 'secure' && data.blob && data.eid) {
                // Handle Secure Claim
                try {
                  await ApiService.events.claimEncrypted(data.eid, data.blob);
                  Alert.alert('成功', '安全憑證領取成功！');
                } catch (e: any) {
                  console.log('Secure claim error:', e);
                  // Check for offline OR Organizer Not Synced
                  if (
                    e.message === 'Network Error' ||
                    e.isOfflineError ||
                    !e.response ||
                    e.response?.data?.error === 'ORGANIZER_NOT_SYNCED'
                  ) {
                    await saveOfflineClaim(value); // Save the raw JSON string
                    if (e.response?.data?.error === 'ORGANIZER_NOT_SYNCED') {
                      Alert.alert('驗證中', '已收到憑證！主辦方尚未同步裝置。驗證稍後將自動完成。');
                    }
                  } else {
                    Alert.alert('錯誤', '安全驗證失敗：' + (e.response?.data?.error || e.message));
                  }
                }
                return;
              }
            } catch (e) {
              // Not JSON or failed parse, fall through to normal token
              console.log('JSON parse failed for potential secure token:', e);
            }
          }

          // 1. Try Online Claim (Standard Token)
          await handleOnlineClaim(value);
        } catch (error: any) {
          console.log('Claim error:', error);

          // Check for specific backend errors first
          if (error.response?.data?.error) {
            const errorMessage = error.response.data.error;
            if (errorMessage.includes('expired') || errorMessage.includes('Invalid')) {
              Alert.alert('憑證領取失敗', '代碼過期或無效。\n\n請請求主辦方產生新的 QR Code。');
            } else if (errorMessage.includes('already claimed')) {
              Alert.alert('已領取', '您已經領取過此憑證！');
            } else {
              Alert.alert('領取錯誤', errorMessage);
            }
          } else {
            // Check if it is a network/offline error
            if (error.isOfflineError || error.message === 'Network Error' || !error.response) {
              await saveOfflineClaim(value);
            } else {
              Alert.alert('掃描結果', `已掃描：${value}\n\n(線上領取失敗：${error.message})`);
            }
          }
        }
      }
    }
  });

  const handleOnlineClaim = async (token: string) => {
    try {
      const result = await ApiService.events.claimBadge(token);
      Alert.alert('成功', '憑證領取成功！');
    } catch (error: any) {
      throw error; // Rethrow to let caller handle or show specific error
    }
  };

  const saveOfflineClaim = async (token: string) => {
    try {
      const stored = await AsyncStorage.getItem('offline_claims');
      const claims = stored ? JSON.parse(stored) : [];

      // Check duplicate
      if (claims.some((c: any) => c.token === token)) {
        Alert.alert('資訊', '此憑證已儲存等待離線同步。');
        return;
      }

      claims.push({
        token,
        timestamp: Date.now(),
        activityId
      });

      await AsyncStorage.setItem('offline_claims', JSON.stringify(claims));
      Alert.alert('離線模式', '領取已本機儲存！請在上線時同步。');
    } catch (e) {
      console.error(e);
      Alert.alert('錯誤', '儲存離線領取失敗。');
    }
  };
  const handleOfflineVerification = async (token: string) => {
    try {
      const queueJson = await AsyncStorage.getItem('offline_claims_queue');
      const queue = queueJson ? JSON.parse(queueJson) : [];

      // Prevent duplicates in queue
      if (!queue.find((q: any) => q.token === token)) {
        queue.push({ token, timestamp: Date.now() });
        await AsyncStorage.setItem('offline_claims_queue', JSON.stringify(queue));
      }

      Alert.alert('Offline Mode', 'Badge claim saved to outbox.\n(已儲存至離線匣，連線後請同步)');
    } catch (e) {
      Alert.alert('Error', 'Failed to save offline claim.');
    }
  };

  const handleStartScan = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert('需要權限', '需要相機權限才能掃描代碼。', [
          { text: '設定', onPress: () => Linking.openSettings() },
          { text: '取消' }
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
            <Text style={{ color: 'white' }}>找不到相機裝置</Text>
            <TouchableOpacity onPress={() => setIsScanning(false)}><Text style={{ color: 'white', marginTop: 20 }}>關閉</Text></TouchableOpacity>
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
            <Text style={styles.scannerTitle}>掃描憑證</Text>
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
            <Text style={styles.scanInstruction}>將 QR Code 對準框框</Text>
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
          <Text style={styles.welcomeText}>歡迎來到 {activityName}！</Text>
          <Text style={styles.infoText}>準備好參加了嗎？掃描主辦方的憑證代碼以簽到或領取憑證。</Text>
        </View>

        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleStartScan}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.scanIcon}>📷</Text>
          </View>
          <Text style={styles.scanButtonText}>掃描憑證</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, styles.idButton]}
          onPress={() => setShowIdModal(true)}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.scanIcon}>🆔</Text>
          </View>
          <Text style={styles.scanButtonText}>顯示我的 ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scanButton, { marginTop: 10, backgroundColor: '#34C759' }]}
          onPress={() => navigation.navigate('Lobby', { activityId, activityName })}
        >
          <View style={styles.iconContainer}>
            <Text style={styles.scanIcon}>🧩</Text>
          </View>
          <Text style={styles.scanButtonText}>玩拼圖遊戲</Text>
        </TouchableOpacity>
      </View>

      {/* Show My ID Modal */}
      <Modal
        visible={showIdModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowIdModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>我的參加者 ID</Text>
            <TouchableOpacity onPress={() => setShowIdModal(false)}>
              <Text style={styles.closeButton}>關閉</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.qrContainer}>
            {userId ? (
              <QRCode value={userId} size={250} />
            ) : (
              <Text>載入 ID 中...</Text>
            )}
            <Text style={styles.qrInstruction}>
              向主辦方出示此代碼以進行安全憑證發放。
            </Text>
          </View>
        </View>
      </Modal>
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

  idButton: {
    marginTop: 20,
    backgroundColor: '#5856D6',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  qrInstruction: {
    marginTop: 40,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});

export default ParticipantActivityScreen;
