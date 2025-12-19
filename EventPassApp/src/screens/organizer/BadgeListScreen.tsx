import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApiService } from '../../services/ApiService';
// import { MockData, Badge } from '../../services/MockData'; // Removed MockData usage

interface Badge {
    id: string;
    name: string;
    type: string;
    icon?: string;
}

const BadgeListScreen = ({ route, navigation }: any) => {
    const { activityId, activityName } = route.params || { activityId: '1', activityName: 'Activity' };
    const [badges, setBadges] = useState<Badge[]>([]);

    const fetchBadges = useCallback(async () => {
        try {
            const data = await ApiService.events.getEventBadges(activityId);
            setBadges(data);
        } catch (error) {
            console.error('Failed to fetch badges:', error);
        }
    }, [activityId]);

    useFocusEffect(
        useCallback(() => {
            fetchBadges();
        }, [fetchBadges])
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Badge Management</Text>
                <Text style={styles.subTitle}>{activityName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.list}>
                {badges.length === 0 ? (
                    <Text style={styles.emptyText}>No badges yet. Tap + to add one.</Text>
                ) : (
                    badges.map((badge) => (
                        <TouchableOpacity
                            key={badge.id}
                            style={styles.badgeCard}
                            onPress={() => navigation.navigate('BadgeEdit', { activityId, badgeId: badge.id, badgeName: badge.name })}
                        >
                            <View style={styles.badgeIconPlaceholder}>
                                <Text style={styles.badgeIcon}>{badge.icon || '🏅'}</Text>
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={styles.badgeName}>{badge.name}</Text>
                                <Text style={styles.badgeType}>{badge.type}</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('BadgeEdit', { activityId })}
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
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
    },
    subTitle: {
        fontSize: 13,
        color: '#666',
        marginTop: 4,
    },
    list: {
        padding: 16,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: '#8e8e93',
        fontSize: 16,
    },
    badgeCard: {
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
    badgeIconPlaceholder: {
        width: 44,
        height: 44,
        backgroundColor: '#f2f2f7',
        borderRadius: 22,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeIcon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    badgeName: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
    },
    badgeType: {
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
        backgroundColor: '#007AFF', // System Blue
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
});

export default BadgeListScreen;
