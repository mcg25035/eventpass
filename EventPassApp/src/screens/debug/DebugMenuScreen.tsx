import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
} from 'react-native';

const DebugMenuScreen = ({ navigation }: any) => {
    const navigateTo = (screen: string) => {
        navigation.navigate(screen);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Engineering Menu</Text>
                <Text style={styles.subtitle}>Debug & Navigation Hub</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Auth Screens</Text>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo('Login')}
                >
                    <Text style={styles.menuItemText}>Login Screen</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo('Register')}
                >
                    <Text style={styles.menuItemText}>Register Screen</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => navigateTo('Dashboard')}
                >
                    <Text style={styles.menuItemText}>Dashboard (Organizer)</Text>
                    <Text style={styles.arrow}>→</Text>
                </TouchableOpacity>

                {/* Add more screens here as they are developed */}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7', // iOS grouped background color
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    content: {
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 16,
    },
    menuItem: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    menuItemText: {
        fontSize: 17,
        color: '#000',
        fontWeight: '500',
    },
    arrow: {
        fontSize: 18,
        color: '#C7C7CC',
    },
});

export default DebugMenuScreen;
