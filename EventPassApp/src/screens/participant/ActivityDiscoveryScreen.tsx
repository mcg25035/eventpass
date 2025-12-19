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

    React.useEffect(() => {
        fetchActivities();
    }, []);

    const fetchActivities = async () => {
        try {
            const data = await ApiService.events.getAllEvents();
            setActivities(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load activities');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Discover Activities</Text>
            </View>

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
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                ))}
                {activities.length === 0 && !error && (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>No activities found.</Text>
                )}
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
});

export default ActivityDiscoveryScreen;
