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

    useFocusEffect(
        useCallback(() => {
            fetchEvents();
        }, [])
    );

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const events = await ApiService.events.getEvents();
            setActivities(events);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load events.');
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Event }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetail', { activityId: item.id, activityName: item.title })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.activityName}>{item.title}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ActivitySettings', { activityId: item.id, activityName: item.title })}>
                    <Text style={styles.settingsIcon}>⚙️</Text>
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
                <Text style={styles.headerTitle}>My Activities</Text>
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
                        <Text style={styles.emptyText}>No activities found. Create one!</Text>
                    }
                />
            )}

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
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5ea',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
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
});

export default OrganizerManagementScreen;
