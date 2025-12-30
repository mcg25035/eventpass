import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Switch,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Platform,
    TextInput,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ApiService } from '../../services/ApiService';

const ActivitySettingsScreen = ({ route, navigation }: any) => {
    const { activityId, activityName } = route.params || {};
    // Use local state to track ID, initialized from params but updateable immediately
    const [currentActivityId, setCurrentActivityId] = useState<string | undefined>(activityId);

    const [title, setTitle] = useState(activityName || '');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(true);

    // Sync local state if params change (e.g. coming from list)
    // Sync local state if params change (e.g. coming from list)
    React.useEffect(() => {
        if (activityId) {
            setCurrentActivityId(activityId);
            fetchActivityDetails(activityId);
        }
    }, [activityId]);

    const fetchActivityDetails = async (id: string) => {
        setLoading(true);
        try {
            const event = await ApiService.events.getEvent(id);
            setTitle(event.title);
            setDescription(event.description || '');
            setStartDate(new Date(event.start_time));
            setEndDate(new Date(event.end_time));
            // is_offline_active true => Offline Mode => isOnline = false
            setIsOnline(!event.is_offline_active);
        } catch (error) {
            console.error('Failed to fetch details:', error);
            Alert.alert('Error', 'Failed to load activity details');
        } finally {
            setLoading(false);
        }
    };


    // ... dates ...

    // Convert Dates to ISO for API
    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('錯誤', '請輸入標題');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title,
                description,
                start_time: startDate.toISOString(),
                end_time: endDate.toISOString(),
                is_offline_active: !isOnline
            };

            if (currentActivityId) {
                // Update
                await ApiService.events.updateEvent(currentActivityId, payload);
                Alert.alert('成功', '活動已更新！');
            } else {
                // Create
                const newEvent = await ApiService.events.createEvent(payload);
                Alert.alert('成功', '活動已建立！您現在可以新增徽章。');

                // CRITICAL: Update local state immediately so next save is an update
                setCurrentActivityId(newEvent.id);

                // Switch to Edit Mode in navigation without leaving screen
                navigation.setParams({ activityId: newEvent.id, activityName: newEvent.title });
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert('錯誤', '儲存活動失敗');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!currentActivityId) return;

        Alert.alert(
            '刪除活動',
            '您確定要刪除此活動嗎？此操作無法復原。',
            [
                { text: '取消', style: 'cancel' },
                {
                    text: '刪除',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await ApiService.events.deleteEvent(currentActivityId);
                            Alert.alert('成功', '活動刪除成功');
                            navigation.navigate('OrganizerManagement');
                        } catch (error: any) {
                            console.error(error);
                            Alert.alert('錯誤', '刪除活動失敗');
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    const [mode, setMode] = useState<'date' | 'time'>('date');
    const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null);

    const showPicker = (type: 'start' | 'end', currentMode: 'date' | 'time') => {
        setActivePicker(type);
        setMode(currentMode);
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        // Dismiss picker on Android immediately (for iOS checking activePicker is enough logic usually)
        if (Platform.OS === 'android') {
            setActivePicker(null);
        }

        if (selectedDate) {
            if (activePicker === 'start') {
                const newDate = new Date(startDate);
                if (mode === 'date') {
                    newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                } else {
                    newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                }
                setStartDate(newDate);
            } else if (activePicker === 'end') {
                const newDate = new Date(endDate);
                if (mode === 'date') {
                    newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                } else {
                    newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                }
                setEndDate(newDate);
            }
        }
    };

    const formatDate = (date: Date) => date.toLocaleDateString();
    const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activity Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Activity Mode Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>活動模式</Text>
                    <View style={styles.modeRow}>
                        <Text style={[styles.modeLabel, !isOnline ? styles.activeText : styles.inactiveText]}>離線</Text>
                        <Switch
                            value={isOnline}
                            onValueChange={setIsOnline}
                            trackColor={{ false: '#e9e9eb', true: '#34C759' }}
                            thumbColor={'#fff'}
                            ios_backgroundColor="#e9e9eb"
                        />
                        <Text style={[styles.modeLabel, isOnline ? styles.activeText : styles.inactiveText]}>線上</Text>
                    </View>

                    {/* Secure Offline Handshake */}
                    {currentActivityId && !isOnline && (
                        <TouchableOpacity
                            style={styles.handshakeButton}
                            onPress={async () => {
                                try {
                                    setLoading(true);
                                    const res = await ApiService.events.handshake(currentActivityId);
                                    if (res.session_key) {
                                        await ApiService.config.storeEventKey(currentActivityId, res.session_key);
                                        Alert.alert('安全模式就緒', '會話密鑰已安全交換並儲存。');
                                    }
                                } catch (e) {
                                    Alert.alert('錯誤', '握手失敗');
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            <Text style={styles.handshakeText}>📲 設定安全離線金鑰</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Activity Info Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>活動詳情</Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>標題</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="活動標題"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>描述</Text>
                        <TextInput
                            style={styles.input}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="選填描述"
                            multiline
                        />
                    </View>

                </View>

                {/* Manage Badges Section - Separate Card for better visibility */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>徽章</Text>
                    <TouchableOpacity
                        style={[styles.actionButton, !currentActivityId && styles.actionButtonDisabled]}
                        onPress={() => {
                            if (!currentActivityId) {
                                Alert.alert('注意', '請先儲存活動再管理徽章。');
                                return;
                            }
                            navigation.navigate('BadgeList', { activityId: currentActivityId, activityName: title });
                        }}
                    >
                        <Text style={styles.actionButtonText}>管理徽章 {(!currentActivityId) && '(請先儲存)'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Date & Time Card */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>排程</Text>

                    <View style={styles.scheduleRow}>
                        <Text style={styles.scheduleLabel}>開始</Text>
                        <View style={styles.pickerGroup}>
                            <TouchableOpacity onPress={() => showPicker('start', 'date')} style={styles.pickerButton}>
                                <Text style={styles.pickerText}>{formatDate(startDate)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => showPicker('start', 'time')} style={styles.pickerButton}>
                                <Text style={styles.pickerText}>{formatTime(startDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.scheduleRow}>
                        <Text style={styles.scheduleLabel}>結束</Text>
                        <View style={styles.pickerGroup}>
                            <TouchableOpacity onPress={() => showPicker('end', 'date')} style={styles.pickerButton}>
                                <Text style={styles.pickerText}>{formatDate(endDate)}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => showPicker('end', 'time')} style={styles.pickerButton}>
                                <Text style={styles.pickerText}>{formatTime(endDate)}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {activePicker && (
                    <DateTimePicker
                        value={activePicker === 'start' ? startDate : endDate}
                        mode={mode}
                        is24Hour={true}
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                    />
                )}

                <TouchableOpacity
                    style={[styles.saveButton, loading && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Text style={styles.saveButtonText}>{loading ? '儲存中...' : '儲存活動'}</Text>
                </TouchableOpacity>

                {currentActivityId && (
                    <TouchableOpacity
                        style={[styles.deleteButton, loading && styles.buttonDisabled]}
                        onPress={handleDelete}
                        disabled={loading}
                    >
                        <Text style={styles.deleteButtonText}>Delete Activity</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f2f7', // Modern iOS grouped background
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
        padding: 16,
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2, // Android shadow
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#8e8e93',
        textTransform: 'uppercase',
        marginBottom: 12,
    },
    modeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    modeLabel: {
        fontSize: 17,
        fontWeight: '500',
    },
    activeText: {
        color: '#000',
    },
    inactiveText: {
        color: '#c7c7cc',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        fontSize: 17,
        color: '#000',
    },
    value: {
        fontSize: 17,
        color: '#8e8e93',
    },
    helperText: {
        fontSize: 13,
        color: '#8e8e93',
        marginBottom: 16,
    },
    actionButton: {
        backgroundColor: '#007AFF', // System Blue
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    scheduleLabel: {
        fontSize: 17,
        fontWeight: '500',
        color: '#000',
        width: 50,
    },
    pickerGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    pickerButton: {
        backgroundColor: '#f2f2f7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    pickerText: {
        fontSize: 17,
        color: '#007AFF',
    },
    divider: {
        height: 1,
        backgroundColor: '#e5e5ea',
        marginVertical: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e5ea',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginTop: 4,
    },
    saveButton: {
        backgroundColor: '#34C759', // Green for create
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 40,
        borderWidth: 1,
        borderColor: '#FF3B30',
    },
    deleteButtonText: {
        color: '#FF3B30',
        fontSize: 17,
        fontWeight: '600',
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    actionButtonDisabled: {
        backgroundColor: '#aaccff',
        opacity: 0.8,
    },
    handshakeButton: {
        marginTop: 12,
        backgroundColor: '#5856D6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    handshakeText: {
        color: '#fff',
        fontWeight: '600',
    }
});

export default ActivitySettingsScreen;
