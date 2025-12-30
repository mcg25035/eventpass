import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    SafeAreaView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { ApiService } from '../../services/ApiService';

const UserBadgesScreen = () => {
    const [badges, setBadges] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            const data = await ApiService.events.getClaimedBadges();
            setBadges(data);
        } catch (error: any) {
            console.error(error);
            Alert.alert('錯誤', '載入憑證失敗');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const badgeTemplate = item.BadgeTemplate;
        const event = item.Event;

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.badgeName}>{badgeTemplate?.name || '憑證'}</Text>
                    <Text style={styles.eventTitle}>@ {event?.title || '未知活動'}</Text>
                </View>

                {badgeTemplate?.image_url ? (
                    <Image source={{ uri: badgeTemplate.image_url }} style={styles.badgeImage} />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Text style={{ fontSize: 40 }}>🏅</Text>
                    </View>
                )}

                <Text style={styles.description} numberOfLines={2}>
                    {badgeTemplate?.description || '無描述'}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.date}>發放時間：{new Date(item.issued_at).toLocaleDateString()}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>我的憑證</Text>
            </View>

            {badges.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>尚無憑證。</Text>
                    <Text style={styles.emptySubText}>參加活動以獲得憑證！</Text>
                </View>
            ) : (
                <FlatList
                    data={badges}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        marginBottom: 12,
    },
    badgeName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    eventTitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    badgeImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        resizeMode: 'cover',
        marginBottom: 12,
        backgroundColor: '#eee',
    },
    placeholderImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    description: {
        fontSize: 14,
        color: '#444',
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 8,
    },
    date: {
        fontSize: 12,
        color: '#888',
        textAlign: 'right',
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#666',
    }
});

export default UserBadgesScreen;
