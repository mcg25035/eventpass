import React from 'react';
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
import { useState, useCallback } from 'react';

const ActivityDetailScreen = ({ route, navigation }: any) => {
    const { activityId, activityName } = route.params || { activityName: 'Activity' };
    const [isOffline, setIsOffline] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const offline = ApiService.config.isForceOffline();
            setIsOffline(offline);
        }, [])
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>活動選項</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.screenTargetTitle}>{activityName}</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>操作</Text>

                    <View style={styles.card}>
                        <TouchableOpacity
                            style={[styles.actionRow, styles.borderedRow]}
                            onPress={() => navigation.navigate('IssueBadge', { activityId, activityName })}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>🎯</Text>
                            </View>
                            <Text style={styles.actionText}>發放徽章</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionRow, styles.borderedRow]}
                            onPress={() => !isOffline && navigation.navigate('ActivitySettings', { activityId, activityName })}
                            disabled={isOffline}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={[styles.icon, isOffline && styles.disabledIcon]}>⚙️</Text>
                            </View>
                            <Text style={[styles.actionText, isOffline && styles.disabledText]}>編輯活動 {isOffline ? '(離線)' : ''}</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionRow, styles.borderedRow]}
                            onPress={() => navigation.navigate('PuzzleAssets', { activityId, activityName })}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>🖨️</Text>
                            </View>
                            <Text style={styles.actionText}>列印解謎 QR Code</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionRow}
                            onPress={() => navigation.navigate('ParticipantActivity', { activityId, activityName })}
                        >
                            <View style={styles.iconContainer}>
                                <Text style={styles.icon}>👋</Text>
                            </View>
                            <Text style={styles.actionText}>參加活動</Text>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

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
    content: {
        padding: 20,
    },
    screenTargetTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 24,
        marginLeft: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8e8e93',
        textTransform: 'uppercase',
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden', // clips children
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
    },
    borderedRow: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#c6c6c8',
    },
    iconContainer: {
        width: 32,
        marginRight: 12,
        alignItems: 'center',
    },
    icon: {
        fontSize: 22,
    },
    actionText: {
        fontSize: 17,
        color: '#000',
        flex: 1,
    },
    chevron: {
        fontSize: 22,
        color: '#c7c7cc',
        fontWeight: '400',
    },

    disabledText: {
        color: '#c7c7cc',
    },
    disabledIcon: {
        opacity: 0.3,
    }
});

export default ActivityDetailScreen;
