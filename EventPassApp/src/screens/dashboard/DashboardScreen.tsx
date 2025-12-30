import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert, // Added Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added AsyncStorage
import { useFocusEffect } from '@react-navigation/native'; // Added useFocusEffect
import { ApiService } from '../../services/ApiService'; // Added ApiService

const DashboardScreen = ({ navigation }: any) => {
    const [pendingClaimsCount, setPendingClaimsCount] = React.useState(0);

    useFocusEffect(
        React.useCallback(() => {
            checkPendingClaims();
        }, [])
    );

    const checkPendingClaims = async () => {
        try {
            const stored = await AsyncStorage.getItem('offline_claims');
            if (stored) {
                const claims = JSON.parse(stored);
                setPendingClaimsCount(claims.length);
            } else {
                setPendingClaimsCount(0);
            }
        } catch (e) { console.error(e); }
    };

    const handleSync = async () => {
        try {
            const { synced, failed } = await ApiService.events.syncOfflineClaims();
            Alert.alert('同步完成', `已同步：${synced}\n失敗/剩餘：${failed}`);
            checkPendingClaims();
        } catch (e) {
            Alert.alert('錯誤', '同步失敗');
        }
    };
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>儀表板</Text>
            </View>

            <View style={styles.content}>
                {pendingClaimsCount > 0 && (
                    <TouchableOpacity
                        style={[styles.card, styles.alertCard]}
                        onPress={handleSync}
                    >
                        <Text style={[styles.cardTitle, styles.alertText]}>⚠️ 同步離線記錄 ({pendingClaimsCount})</Text>
                        <Text style={styles.alertText}>點擊上傳已儲存的憑證</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('OrganizerManagement')}
                >
                    <Text style={styles.cardTitle}>主辦方活動管理</Text>
                    <Text style={styles.cardSubtitle}>管理您主辦的活動</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('ActivityDiscovery')}
                >
                    <Text style={styles.cardTitle}>參加新活動</Text>
                    <Text style={styles.cardSubtitle}>尋找並加入活動</Text>
                </TouchableOpacity>



                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('UserBadges')}
                >
                    <Text style={styles.cardTitle}>我的憑證</Text>
                    <Text style={styles.cardSubtitle}>查看所有已獲得的憑證</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        padding: 20,
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e1e1e1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    disabledCard: {
        opacity: 0.6,
        backgroundColor: '#f5f5f5',
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    alertCard: {
        backgroundColor: '#FFF4E5', // Light orange
        borderColor: '#FF9500',
    },
    alertText: {
        color: '#C45700',
    },
});

export default DashboardScreen;
