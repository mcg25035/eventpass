import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Alert,
} from 'react-native';
import { ApiService } from '../../services/ApiService';

const BadgeEditScreen = ({ route, navigation }: any) => {
    const { activityId, badgeId, badgeName: initialName } = route.params || {};
    const [name, setName] = useState(initialName || '');
    const [limit, setLimit] = useState('10');

    // Badge Types: 紀錄, 認證, 成就, 獎項
    const badgeTypes = ['紀錄', '認證', '成就', '獎項'];
    const [selectedType, setSelectedType] = useState(badgeTypes[0]);

    const adjustLimit = (delta: number) => {
        const current = parseInt(limit) || 0;
        setLimit(String(Math.max(0, current + delta)));
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('錯誤', '請輸入徽章名稱');
            return;
        }

        try {
            await ApiService.events.createBadge(activityId, {
                name,
                type: selectedType,
                limit: parseInt(limit, 10),
                icon_ref: '🏆' // Default
            });
            Alert.alert('成功', '徽章建立成功');
            navigation.goBack();
        } catch (error: any) {
            console.error(error);
            Alert.alert('錯誤', '建立徽章失敗');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{badgeId ? '編輯徽章' : '新徽章'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.headerButton}>取消</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Icon Picker Section */}
                <View style={styles.iconContainer}>
                    <TouchableOpacity style={styles.iconPlaceholder}>
                        <Text style={styles.iconText}>🏆</Text>
                        <View style={styles.editIconBadge}>
                            <Text style={styles.editIconText}>✎</Text>
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.helperText}>點擊更換圖示</Text>
                </View>

                {/* Form Fields */}
                <View style={styles.formGroup}>

                    {/* Name Input */}
                    <View style={styles.inputRow}>
                        <Text style={styles.label}>名稱</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="輸入徽章名稱"
                            placeholderTextColor="#c7c7cc"
                        />
                    </View>

                    <View style={styles.divider} />

                    {/* Type Selection */}
                    <View style={styles.typeRow}>
                        <Text style={styles.typeLabel}>類型</Text>
                        <View style={styles.chipContainer}>
                            {badgeTypes.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.chip,
                                        selectedType === type && styles.chipSelected
                                    ]}
                                    onPress={() => setSelectedType(type)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        selectedType === type && styles.chipTextSelected
                                    ]}>
                                        {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Limit Stepper */}
                    <View style={styles.inputRow}>
                        <Text style={styles.label}>發放上限</Text>
                        <View style={styles.stepperContainer}>
                            <TouchableOpacity
                                style={styles.stepperButton}
                                onPress={() => adjustLimit(-1)}
                            >
                                <Text style={styles.stepperButtonText}>−</Text>
                            </TouchableOpacity>

                            <View style={styles.limitValueContainer}>
                                <TextInput
                                    style={styles.limitInput}
                                    value={limit}
                                    onChangeText={setLimit}
                                    keyboardType="numeric"
                                />
                            </View>

                            <TouchableOpacity
                                style={styles.stepperButton}
                                onPress={() => adjustLimit(1)}
                            >
                                <Text style={styles.stepperButtonText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>

                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                >
                    <Text style={styles.saveButtonText}>儲存徽章</Text>
                </TouchableOpacity>

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        position: 'absolute',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: -1,
    },
    headerButton: {
        fontSize: 17,
        color: '#007AFF',
    },
    content: {
        padding: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    iconPlaceholder: {
        width: 100,
        height: 100,
        backgroundColor: '#fff',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    iconText: {
        fontSize: 48,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        backgroundColor: '#007AFF',
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f2f2f7',
    },
    editIconText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    helperText: {
        marginTop: 10,
        color: '#8e8e93',
        fontSize: 13,
    },
    formGroup: {
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingLeft: 16,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingRight: 16,
        minHeight: 44,
    },
    label: {
        fontSize: 17,
        color: '#000',
        flex: 1,
    },
    input: {
        fontSize: 17,
        color: '#000',
        textAlign: 'right',
        flex: 2,
        padding: 0,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#c6c6c8',
    },
    typeRow: {
        paddingVertical: 12,
        paddingRight: 16,
    },
    typeLabel: {
        fontSize: 17,
        color: '#000',
        marginBottom: 10,
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f2f2f7',
        borderWidth: 1,
        borderColor: '#e5e5ea',
    },
    chipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    chipText: {
        fontSize: 14,
        color: '#000',
    },
    chipTextSelected: {
        color: '#fff',
        fontWeight: '500',
    },
    stepperContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f7',
        borderRadius: 8,
        padding: 2,
    },
    stepperButton: {
        width: 32,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    stepperButtonText: {
        fontSize: 20,
        fontWeight: '500',
        color: '#000',
        marginTop: -2,
    },
    limitValueContainer: {
        minWidth: 40,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    limitInput: {
        fontSize: 17,
        fontWeight: '600',
        color: '#000',
        padding: 0,
        textAlign: 'center',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
});

export default BadgeEditScreen;
