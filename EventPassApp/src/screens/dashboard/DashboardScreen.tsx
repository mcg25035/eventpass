import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';

const DashboardScreen = ({ navigation }: any) => {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Dashboard</Text>
            </View>

            <View style={styles.content}>
                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('OrganizerManagement')}
                >
                    <Text style={styles.cardTitle}>Organizer Activity Management</Text>
                    <Text style={styles.cardSubtitle}>Manage your hosted activities</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('ActivityDiscovery')}
                >
                    <Text style={styles.cardTitle}>Participate New Activity</Text>
                    <Text style={styles.cardSubtitle}>Find and join events</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.card, styles.disabledCard]}
                    disabled={true}
                >
                    <Text style={styles.cardTitle}>Recently Participated</Text>
                    <Text style={styles.cardSubtitle}>View your activity history (Coming Soon)</Text>
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
});

export default DashboardScreen;
