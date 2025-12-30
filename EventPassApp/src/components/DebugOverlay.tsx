import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';

interface DebugOverlayProps {
    navigationRef: any;
}

const DebugOverlay = ({ navigationRef }: DebugOverlayProps) => {
    // Only show in development
    if (!__DEV__) {
        return null;
    }

    const handlePress = () => {
        if (navigationRef.current) {
            navigationRef.current.navigate('DebugMenu');
        }
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            <TouchableOpacity style={styles.button} onPress={handlePress}>
                <Text style={styles.buttonText}>🔧 Debug</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
    },
    button: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default DebugOverlay;
