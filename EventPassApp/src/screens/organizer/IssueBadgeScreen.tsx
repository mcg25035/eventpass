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
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApiService } from '../../services/ApiService';
import QRCode from 'react-native-qrcode-svg';
import { Modal } from 'react-native';

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

    // QR Code State
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrToken, setQrToken] = useState<string>('');
    const [expiresAt, setExpiresAt] = useState<number>(0);

    useFocusEffect(
        useCallback(() => {
            const fetchBadges = async () => {
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Issue Credential</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.headerButton}>Cancel</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Badge Selection */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Select Badge</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.badgesContainer}
                >
                    {availableBadges.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No badges defined for this activity.</Text>
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
                        Issuing <Text style={styles.bold}>{selectedBadge?.name || '...'}</Text> for <Text style={styles.bold}>{activityName}</Text>
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.issueButton, !selectedBadge && styles.disabledButton]}
                    onPress={handleIssue}
                    disabled={!selectedBadge}
                >
                    <Text style={styles.issueButtonText}>Show QR Code</Text>
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
                        <Text style={styles.modalTitle}>Scan to Check In</Text>
                        <TouchableOpacity onPress={() => setShowQrModal(false)}>
                            <Text style={styles.closeButton}>Close</Text>
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
                            Ask the participant to scan this code with their app.
                        </Text>
                        <Text style={styles.expiryText}>
                            Expires in 5 minutes
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
});

export default IssueBadgeScreen;
