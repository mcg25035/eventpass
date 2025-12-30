import React from 'react';
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
import { ApiService } from '../../services/ApiService';
import { useState, useEffect } from 'react';
import { Switch } from 'react-native';

const DebugMenuScreen = ({ navigation }: any) => {
    const navigateTo = (screen: string) => {
        navigation.navigate(screen);
    };

    const [baseUrl, setBaseUrl] = useState('');
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        loadBaseUrl();
    }, []);

    const loadBaseUrl = async () => {
        const url = await ApiService.config.getBaseUrl();
        setBaseUrl(url);
        setIsOffline(ApiService.config.isForceOffline());
    };

    const handleSaveUrl = async () => {
        try {
            await ApiService.config.setBaseUrl(baseUrl);
            Alert.alert('Success', 'Server address updated. Future requests will use this URL.');
        } catch (error) {
            Alert.alert('Error', 'Failed to save server address.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Engineering Menu</Text>
                <Text style={styles.subtitle}>Debug & Navigation Hub</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>Network Configuration</Text>
                <View style={styles.configContainer}>
                    <Text style={styles.label}>Server Address:</Text>
                    <TextInput
                        style={styles.input}
                        value={baseUrl}
                        onChangeText={setBaseUrl}
                        placeholder="http://10.0.2.2:3000"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveUrl}>
                        <Text style={styles.saveButtonText}>Save Address</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.configContainer}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.label}>Force Offline Mode (Simulate Disconnect)</Text>
                        <Switch
                            value={isOffline}
                            onValueChange={(val) => {
                                setIsOffline(val);
                                ApiService.config.setForceOffline(val);
                            }}
                        />
                    </View>
                </View>

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
        paddingBottom: 40,
    },
    configContainer: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#000',
        marginBottom: 12,
    },
    saveButton: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
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
