import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';

import { ApiService } from '../../services/ApiService';
import { Event } from '../../services/ApiService';

const ActivityDiscoveryScreen = ({ navigation }: any) => {
    const [activities, setActivities] = React.useState<Event[]>([]);
    const [error, setError] = React.useState('');
    const [isOfflineMode, setIsOfflineMode] = React.useState(false);

    React.useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchActivities();
        });
        return unsubscribe;
    }, [navigation]);

    const fetchActivities = async () => {
        try {
            let data = await ApiService.events.getAllEvents();

            // Check Offline Mode
            const offline = ApiService.config.isForceOffline();
            setIsOfflineMode(offline);

            if (offline) {
                // Filter for offline capable events only
                data = data.filter(e => e.is_offline_active);
            }

            setActivities(data);
        } catch (err) {
            console.error(err);
            setError('載入活動失敗');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>探索活動</Text>
            </View>

            {isOfflineMode && (
                <View style={styles.offlineBanner}>
                    <Text style={styles.offlineBannerText}>⚠ 離線模式：僅顯示可下載活動</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.list}>
                {activities.map((activity) => (
                    <TouchableOpacity
                        key={activity.id}
                        style={styles.activityCard}
                        onPress={() => navigation.navigate('ParticipantActivity', { activityId: activity.id, activityName: activity.title })}
                    >
                        <View style={styles.iconPlaceholder}>
                            <Text style={styles.iconText}>📅</Text>
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.activityName}>{activity.title}</Text>
                            <Text style={styles.activityDate}>{new Date(activity.start_time).toLocaleDateString()}</Text>
                            {activity.is_offline_active && (
                                <View style={styles.offlineTag}>
                                    <Text style={styles.offlineTagText}>⚡ 離線</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                ))}
                {activities.length === 0 && !error && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
                        {isOfflineMode ? '快取中未找到支援離線的活動。' : '未找到活動。'}
                    </Text>
                )}
                {error ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <Text style={{ textAlign: 'center', color: 'red', marginBottom: 10 }}>{error}</Text>
                        <TouchableOpacity onPress={fetchActivities} style={{ padding: 10, backgroundColor: '#ddd', borderRadius: 8 }}>
                            <Text>重試</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </ScrollView>
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
    list: {
        padding: 16,
    },
    activityCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: '#f2f2f7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    iconText: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    activityName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    activityDate: {
        fontSize: 14,
        color: '#8e8e93',
    },
    chevron: {
        fontSize: 24,
        color: '#c7c7cc',
        fontWeight: '300',
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
    offlineTag: {
        marginTop: 4,
        backgroundColor: '#e0f7fa',
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    offlineTagText: {
        color: '#006064',
        fontSize: 10,
        fontWeight: 'bold',
    }
});

export default ActivityDiscoveryScreen;
