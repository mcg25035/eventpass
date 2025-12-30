import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    TextInput,
    Alert,
    Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ApiService } from '../../services/ApiService';
import QRCode from 'react-native-qrcode-svg';
import { Camera, useCameraDevice, useCodeScanner, useCameraPermission } from 'react-native-vision-camera';

interface Badge {
    id: string;
    name: string;
    type: string;
    icon?: string;
}

const IssueBadgeScreen = ({ route, navigation }: any) => {
    const { activityName, activityId } = route.params || { activityName: 'Activity', activityId: '1' };

    const [availableBadges, setAvailableBadges] = useState<Badge[]>([]);

    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    // QR Code State
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrToken, setQrToken] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<number>(0);

    // Secure Offline State
    const [showScanModal, setShowScanModal] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(false); // Controls camera pause/resume
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [processingSecure, setProcessingSecure] = useState(false);

    // Camera Setup
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();

    const onCodeScanned = useCallback((codes: any[]) => {
        if (codes.length > 0 && codes[0].value) {
            const val = codes[0].value;
            // Handle JSON Tokens (like Puzzle Win)
            if (val.startsWith('{')) {
                try {
                    const data = JSON.parse(val);
                    if (data.type === 'secure' && data.blob) {
                        setIsCameraActive(false); // Pause camera
                        // setShowScanModal(false); // Keep modal open
                        handleSecureToken(data);
                        return;
                    }
                } catch (e) { }
            }

            // Default: Assume pure UserID
            setParticipantId(val);
            setIsCameraActive(false); // Pause
            setShowScanModal(false); // Close matching modal
            generateSecureBlob(val);
        }
    }, [selectedBadge, activityId]);

    const handleSecureToken = (data: any) => {
        try {
            const payload = JSON.parse(data.blob); // In Puzzle, blob is just JSON string of details
            if (payload.proofs) {
                // Determine Badge ID from Token
                const tokenBadgeId = payload.bid;

                // If token dictates a badge, we MUST select it (or check if it exists)
                let targetBadge = selectedBadge;
                if (tokenBadgeId) {
                    targetBadge = availableBadges.find(b => b.id === tokenBadgeId) || null;
                    if (targetBadge) {
                        setSelectedBadge(targetBadge);
                    } else {
                        Alert.alert('Error', `This win is for a badge ID (${tokenBadgeId}) that doesn't exist in this event.`);
                        return;
                    }
                }

                // Verify Proofs (pass badgeId if available)
                const isValid = ApiService.crypto.verifyPuzzleProof(activityId, payload.proofs, tokenBadgeId);

                if (!isValid) {
                    // DEBUG INFO
                    const pieces = ['p1', 'p2', 'p3', 'p4'];
                    const expected = pieces.map(p => ApiService.crypto.signPuzzlePiece(activityId, p, tokenBadgeId));
                    const debugMsg = `Expected: ${expected[0].substring(0, 4)}...\nGot: ${payload.proofs[0]?.substring(0, 4)}...\n\nBadgeID: ${tokenBadgeId}\nEventID: ${activityId}`;

                    Alert.alert('Verification Failed', `Signature mismatch.\n\n${debugMsg}`);
                    return;
                }

                // Show which badge will be issued
                const badgeName = targetBadge?.name || 'Selected Badge';

                Alert.alert(
                    '解謎驗證通過！',
                    `團隊勝利已確認。\n\n準備發放：\n"${badgeName}"\n\n掃描玩家 ID 以分配。`,
                    [
                        {
                            text: '取消',
                            style: 'cancel',
                            onPress: () => setShowScanModal(false) // Close if canceled
                        },
                        {
                            text: '發放徽章',
                            onPress: () => {
                                // Resume camera for User ID scan
                                setParticipantId(null); // Clear previous ID
                                setTimeout(() => setIsCameraActive(true), 500);
                            }
                        }
                    ]
                );
            }
        } catch (e) {
            Alert.alert('錯誤', '無效的安全憑證');
        }
    };

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: onCodeScanned
    });

    useFocusEffect(
        useCallback(() => {

            const fetchBadges = async () => {
                const offline = ApiService.config.isForceOffline();
                setIsOffline(offline);
                try {
                    const badges = await ApiService.events.getEventBadges(activityId);
                    setAvailableBadges(badges);
                    if (badges.length > 0) {
                        setSelectedBadge(badges[0]);
                    }
                } catch (error) {
                    console.error('Failed to fetch badges:', error);
                    Alert.alert('Error', 'Failed to load badges');
                }
            };
            fetchBadges();
        }, [activityId])
    );

    const handleIssue = async () => {
        if (!selectedBadge) {
            Alert.alert('Error', 'No badge selected');
            return;
        }

        try {
            // Generate Online Token
            const data = await ApiService.events.generateOnlineToken(activityId);
            setQrToken(data.token);
            setExpiresAt(data.expiresAt);
            setShowQrModal(true);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to generate QR Code');
        }
    };

    const handleOfflineIssue = () => {
        if (!selectedBadge) return;

        // Static Offline Token
        const offlineToken = JSON.stringify({
            type: 'static',
            bid: selectedBadge.id,
            eid: activityId
        });

        setQrToken(offlineToken);
        setExpiresAt(0); // No expiry
        setShowQrModal(true);
    };

    const handleSecureIssue = async () => {
        if (!selectedBadge) return;

        // Check for Session Key
        const key = await ApiService.config.getEventKey(activityId);
        if (!key) {
            Alert.alert('Secure Mode Not Configured', 'Please go to Activity Settings and setup Secure Offline Mode first.');
            return;
        }

        if (!hasPermission) {
            const p = await requestPermission();
            if (!p) {
                Alert.alert('權限被拒', '需要相機權限才能掃描參加者 ID。');
                return;
            }
        }

        setParticipantId(null);
        setShowScanModal(true);
        setIsCameraActive(true);
    };

    const generateSecureBlob = async (uid: string) => {
        if (!selectedBadge) return;
        setProcessingSecure(true);
        try {
            const key = await ApiService.config.getEventKey(activityId);
            if (!key) throw new Error('Key missing');

            // 1. Prepare Payload
            const payload = {
                bid: selectedBadge.id,
                salt: Math.random().toString(36).substring(7),
                ts: Date.now()
            };

            // 2. Encrypt
            const encryptedBlob = ApiService.crypto.encrypt(payload, key);

            // 3. Calculate Hash (Blob + UserID)
            const hash = ApiService.crypto.hash(encryptedBlob + uid);

            // 4. Store Hash Locally
            const validationRecord = {
                eventId: activityId,
                userId: uid,
                hash: hash,
                timestamp: new Date().toISOString()
            };

            // 4. Try Online Sync First
            let isSynced = false;
            if (!isOffline) {
                try {
                    console.log('Attempting instant sync...');
                    await ApiService.events.syncValidations([validationRecord]);
                    isSynced = true;
                    Alert.alert('成功', '徽章已發放並在伺服器上驗證！');
                } catch (err) {
                    console.log('Instant sync failed, falling back to offline storage.', err);
                }
            }

            if (!isSynced) {
                // Store Locally
                const stored = await AsyncStorage.getItem('offline_validations');
                const existingValidations = stored ? JSON.parse(stored) : [];
                const updated = [...existingValidations, validationRecord];
                await AsyncStorage.setItem('offline_validations', JSON.stringify(updated));

                // Show QR as Backup
                const qrPayload = JSON.stringify({
                    type: 'secure',
                    eid: activityId,
                    blob: encryptedBlob
                });
                setQrToken(qrPayload); // Show the blob as QR
                setExpiresAt(0); // No expiry
                setShowQrModal(true);

                Alert.alert('已離線儲存', '驗證已本機儲存。請在上線時同步。');
            } else {
                // Even if synced, we could show QR, but usually unnecessary. 
                // If user wants it, they can use "Show Online QR" button?
                // For now, Close the scan modal and done.
                setShowScanModal(false);
            }

        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to generate secure credential.');
        } finally {
            setProcessingSecure(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>發放憑證</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.headerButton}>取消</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Badge Selection */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>選擇徽章</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.badgesContainer}
                >
                    {availableBadges.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>此活動未定義徽章。</Text>
                        </View>
                    ) : (
                        availableBadges.map((badge) => (
                            <TouchableOpacity
                                key={badge.id}
                                style={[
                                    styles.badgeCard,
                                    selectedBadge?.id === badge.id && styles.badgeCardSelected
                                ]}
                                onPress={() => setSelectedBadge(badge)}
                            >
                                <View style={styles.iconContainer}>
                                    <Text style={styles.badgeIcon}>{badge.icon || '🏅'}</Text>
                                </View>
                                <Text style={[
                                    styles.badgeName,
                                    selectedBadge?.id === badge.id && styles.badgeNameSelected
                                ]} numberOfLines={2}>{badge.name}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>

                {/* Preview Summary */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryText}>
                        發放 <Text style={styles.bold}>{selectedBadge?.name || '...'}</Text> 給 <Text style={styles.bold}>{activityName}</Text>
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.issueButton, (!selectedBadge || isOffline) && styles.disabledButton]}
                    onPress={handleIssue}
                    disabled={!selectedBadge || isOffline}
                >
                    <Text style={styles.issueButtonText}>顯示線上 QR Code (5 分鐘) {isOffline ? '(離線)' : ''}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.issueButton, styles.secureButton, !selectedBadge && styles.disabledButton]}
                    onPress={handleSecureIssue}
                    disabled={!selectedBadge}
                >
                    <Text style={styles.issueButtonText}>安全發放 (掃描 ID)</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* QR Code Modal */}
            <Modal
                visible={showQrModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowQrModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>掃描簽到</Text>
                        <TouchableOpacity onPress={() => setShowQrModal(false)}>
                            <Text style={styles.closeButton}>關閉</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.qrContainer}>
                        {qrToken ? (
                            <QRCode
                                value={qrToken}
                                size={250}
                            />
                        ) : (
                            <Text>Loading...</Text>
                        )}
                        <Text style={styles.qrInstruction}>
                            請參加者使用應用程式掃描此代碼。
                        </Text>
                        <Text style={styles.expiryText}>
                            {expiresAt === 0 ? '無過期限制 (離線靜態 QR)' : '5 分鐘後過期'}
                        </Text>
                    </View>
                </View>
            </Modal>

            {/* Scan Modal */}
            <Modal
                visible={showScanModal}
                animationType="slide"
                presentationStyle="fullScreen"
                onRequestClose={() => setShowScanModal(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>掃描參加者 QR</Text>
                        <TouchableOpacity onPress={() => setShowScanModal(false)}>
                            <Text style={styles.closeButton}>取消</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ flex: 1, backgroundColor: 'black' }}>
                        {device && hasPermission ? (
                            <Camera
                                style={styles.absoluteFill}
                                device={device}
                                isActive={isCameraActive}
                                codeScanner={codeScanner}
                            />
                        ) : (
                            <View style={styles.qrContainer}>
                                <Text style={styles.qrInstruction}>相機無法使用或權限被拒</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ padding: 20, backgroundColor: 'white' }}>
                        <Text style={{ textAlign: 'center', color: '#666' }}>
                            掃描參加者的「我的 ID」QR Code 以驗證身份。
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    headerButton: {
        fontSize: 17,
        color: '#007AFF',
    },
    content: {
        paddingVertical: 20,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8e8e93',
        textTransform: 'uppercase',
    },
    badgesContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        gap: 12,
    },
    badgeCard: {
        width: 120,
        height: 140,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    badgeCardSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#f0f8ff',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#f2f2f7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    badgeIcon: {
        fontSize: 32,
    },
    badgeName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
    badgeNameSelected: {
        color: '#007AFF',
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        color: '#8e8e93',
        fontStyle: 'italic',
    },
    formCard: {
        marginHorizontal: 20,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 20,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    label: {
        fontSize: 17,
        color: '#000',
        width: 100,
    },
    input: {
        flex: 1,
        fontSize: 17,
        color: '#000',
        padding: 0,
    },
    scanAction: {
        padding: 4,
    },
    scanActionIcon: {
        fontSize: 20,
    },
    summaryContainer: {
        paddingHorizontal: 20,
        marginBottom: 30,
    },
    summaryText: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
    },
    bold: {
        fontWeight: '600',
        color: '#000',
    },
    issueButton: {
        marginHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
    },
    issueButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    offlineButton: {
        marginTop: 12,
        backgroundColor: '#5856D6', // Purple
        shadowColor: '#5856D6',
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
    expiryText: {
        marginTop: 10,
        fontSize: 14,
        color: '#999',
    },
    secureButton: {
        marginTop: 12,
        backgroundColor: '#FF9500', // Orange
        shadowColor: '#FF9500',
    },
    absoluteFill: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    }
});

export default IssueBadgeScreen;

