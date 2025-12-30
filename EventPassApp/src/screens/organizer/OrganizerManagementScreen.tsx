import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApiService, Event } from '../../services/ApiService';

const OrganizerManagementScreen = ({ navigation }: any) => {
    const [activities, setActivities] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [])
    );

    const fetchEvents = async () => {
        setLoading(true);
        try {
            setIsOffline(ApiService.config.isForceOffline());
            const events = await ApiService.events.getEvents();
            setActivities(events);
        } catch (error: any) {
            console.error(error);
            const offline = ApiService.config.isForceOffline();
            if (offline || error.message === 'Network Error' || error.isOfflineError) {
                setIsOffline(true);
                // If cache was empty, we are here.
            } else {
                Alert.alert('錯誤', '無法載入活動。');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await ApiService.auth.logout();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error(error);
        }
    };

    const renderItem = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id, activityName: item.title })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.activityName}>{item.title}</Text>
                <TouchableOpacity
                    onPress={() => !isOffline && navigation.navigate('ActivitySettings', { activityId: item.id, activityName: item.title })}
                    disabled={isOffline}
                >
                    <Text style={[styles.settingsIcon, isOffline && styles.disabledIcon]}>⚙️</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.cardBody}>
                <Text style={styles.dateText}>
                    {new Date(item.start_time).toLocaleDateString()} - {new Date(item.end_time).toLocaleDateString()}
                </Text>
                <Text style={styles.statusText}>{item.status || 'Active'}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>我的活動</Text>
                </View>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>登出</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : (
                <FlatList
                    data={activities}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            {isOffline ? '找不到快取的活動。請上線同步。' : '找不到活動。建立一個吧！'}
                        </Text>
                    }
                />
            )}

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={styles.syncButton}
                    onPress={async () => {
                        try {
                            const count = await ApiService.events.syncLocalValidations();
                            if (count > 0) {
                                Alert.alert('同步完成', `已上傳 ${count} 筆驗證記錄。`);
                            } else {
                                Alert.alert('已是最新', '沒有需要同步的離線記錄。');
                            }
                        } catch (e: any) {
                            Alert.alert('同步失敗', e.message);
                        }
                    }}
                >
                    <Text style={styles.syncButtonText}>同步驗證記錄</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('ActivitySettings')}
            >
                <Text style={styles.fabIcon}>+</Text>
            </TouchableOpacity>
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
        borderBottomColor: '#e5e5ea',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    logoutButton: {
        position: 'absolute',
        right: 16,
    },
    logoutText: {
        color: '#FF3B30',
        fontSize: 16,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#8e8e93',
        fontSize: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        padding: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    activityName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
    },
    settingsIcon: {
        fontSize: 20,
    },
    cardBody: {
        marginTop: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF', // Active color
    },
    activitySubtitle: {
        fontSize: 13,
        color: '#8e8e93',
    },
    chevron: {
        fontSize: 24,
        color: '#c7c7cc',
        fontWeight: '300',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 8,
    },
    fabIcon: {
        fontSize: 32,
        color: '#fff',
        marginTop: -4,
    },

    offlineBanner: {
        backgroundColor: '#FF9500',
        padding: 8,
        alignItems: 'center',
    },
    offlineBannerText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },

    disabledIcon: {
        opacity: 0.1,
    },
    footerContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e5e5ea',
    },
    syncButton: {
        backgroundColor: '#34C759', // Green
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    syncButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OrganizerManagementScreen;
