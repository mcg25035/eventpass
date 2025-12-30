import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Alert, TextInput } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Camera, useCameraDevice, useCameraPermission, useCodeScanner } from 'react-native-vision-camera';
import { Picker } from '@react-native-picker/picker';
import LanGameService, { Player } from '../../services/LanGameService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkInfo } from 'react-native-network-info';
import NetInfo from '@react-native-community/netinfo';

interface NetOption {
    label: string;
    value: string;
}

const LobbyScreen = ({ route, navigation }: any) => {
    const { activityId, activityName } = route.params || { activityId: '', activityName: 'Game' };
    const [mode, setMode] = useState<'menu' | 'setup_host' | 'host' | 'join'>('menu');
    const [players, setPlayers] = useState<Player[]>([]);
    const [hostIp, setHostIp] = useState<string>('');

    // IP Selection
    const [netOptions, setNetOptions] = useState<NetOption[]>([]);
    const [selectedNetType, setSelectedNetType] = useState('auto');
    const [customIp, setCustomIp] = useState('');

    // Scanner
    const device = useCameraDevice('back');
    const { hasPermission, requestPermission } = useCameraPermission();
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        // Load User
        AsyncStorage.getItem('user_info').then(info => {
            if (info) {
                const user = JSON.parse(info);
                LanGameService.setUser({ id: user.id || 'guest', name: user.name || 'Guest' });
            }
        });

        detectNetworks();

        // Listeners
        const updateListener = (state: any) => {
            setPlayers(state.players);
            if (state.status === 'playing') {
                navigation.replace('PuzzleGame');
            }
        };
        LanGameService.on('state_updated', updateListener);

        return () => {
            LanGameService.removeListener('state_updated', updateListener);
        };
    }, []);

    const detectNetworks = async () => {
        try {
            const state = await NetInfo.fetch();
            const options: NetOption[] = [];

            if (state.isConnected && state.details) {
                // @ts-ignore
                const ip = state.details.ipAddress;
                // @ts-ignore
                const subnet = state.details.subnet;

                if (ip) {
                    // Use OS-provided Type
                    const typeLabel = state.type.toUpperCase();

                    // Add extra info if Wifi
                    let extra = '';
                    if (state.type === 'wifi' && (state.details as any).ssid) {
                        extra = ` (${(state.details as any).ssid})`;
                    }

                    const detail = subnet ? `${ip} / ${subnet}` : ip;
                    options.push({ label: `${typeLabel}${extra} - ${detail}`, value: ip });
                }
            }

            // Fallback / Extra Check using NetworkInfo (sometimes reliable for IP when NetInfo is weird on simulators)
            const fallbackIp = await NetworkInfo.getIPV4Address();
            if (fallbackIp && fallbackIp !== '0.0.0.0' && (!options.length || options[0].value !== fallbackIp)) {
                options.push({ label: `INTERFACE (Fallback) - ${fallbackIp}`, value: fallbackIp });
            }

            if (options.length === 0) {
                options.push({ label: 'No Active Network', value: 'none' });
            }

            options.push({ label: 'Custom IP...', value: 'custom' });

            setNetOptions(options);
            if (options.length > 0 && options[0].value !== 'none') {
                setSelectedNetType(options[0].value);
            } else {
                setSelectedNetType('custom');
            }
        } catch (e) {
            console.error('Network detection failed', e);
            setNetOptions([{ label: 'Custom IP', value: 'custom' }]);
        }
    };

    const proceedToHost = () => {
        detectNetworks(); // Refresh on open
        setMode('setup_host');
    };

    const startHost = async () => {
        let finalIp = selectedNetType;
        if (selectedNetType === 'custom') finalIp = customIp;
        if (finalIp === 'none') {
            Alert.alert('Error', 'No network interface selected. Please enter Custom IP.');
            return;
        }

        try {
            const pieces = ['p1', 'p2', 'p3', 'p4'];
            // Pass activityId if available (even if empty, service handles it)
            const ip = await LanGameService.startHost(pieces, selectedNetType === 'custom' ? customIp : selectedNetType, activityId);
            setHostIp(ip || '');
            setMode('host');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const joinGame = async () => {
        if (!hasPermission) {
            const granted = await requestPermission();
            if (!granted) return Alert.alert('Permission', 'Camera needed to scan Host QR');
        }
        setMode('join');
        setIsScanning(true);
    };

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (isScanning && codes.length > 0) {
                const ip = codes[0].value;
                if (ip) {
                    setIsScanning(false);
                    LanGameService.connectToHost(ip);
                    setMode('menu');
                    Alert.alert('已連線', '等待主機開始...');
                }
            }
        }
    });

    const startGame = () => {
        if (LanGameService.state.players.length < 1) return;
        LanGameService.state.status = 'playing';
        // @ts-ignore
        LanGameService.broadcastState();
        navigation.replace('PuzzleGame');
    };

    if (mode === 'setup_host') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.title}>網路設定</Text>
                    <Text style={styles.label}>選擇網路介面：</Text>

                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={selectedNetType}
                            onValueChange={(itemValue) => setSelectedNetType(itemValue)}
                            style={styles.picker}
                        >
                            {netOptions.map((opt, index) => (
                                <Picker.Item key={index} label={opt.label} value={opt.value} />
                            ))}
                        </Picker>
                    </View>

                    {selectedNetType === 'custom' && (
                        <TextInput
                            style={styles.input}
                            placeholder="輸入 IP (例如 192.168.1.5)"
                            value={customIp}
                            onChangeText={setCustomIp}
                            keyboardType="numeric"
                        />
                    )}

                    <TouchableOpacity style={styles.button} onPress={startHost}>
                        <Text style={styles.buttonText}>啟動伺服器</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, { backgroundColor: '#FF3B30', marginTop: 10 }]} onPress={() => setMode('menu')}>
                        <Text style={styles.buttonText}>取消</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (mode === 'host') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.title}>大廳 (主機)</Text>
                    <View style={styles.qrContainer}>
                        {hostIp ? <QRCode value={hostIp} size={200} /> : <Text>啟動伺服器中...</Text>}
                        <Text style={styles.ipText}>{hostIp}</Text>
                        <Text style={styles.subText}>請朋友掃描以加入</Text>
                    </View>

                    <Text style={styles.sectionTitle}>玩家 ({players.length})</Text>
                    <FlatList
                        data={players}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <Text style={styles.playerText}>{item.name} {item.id === LanGameService.state.hostId ? '(主修)' : ''}</Text>}
                    />

                    <TouchableOpacity style={styles.button} onPress={startGame}>
                        <Text style={styles.buttonText}>開始遊戲</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (mode === 'join' && device) {
        return (
            <Camera
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={true}
                codeScanner={codeScanner}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.center}>
                <Text style={styles.title}>合作拼圖</Text>

                <TouchableOpacity style={styles.button} onPress={proceedToHost}>
                    <Text style={styles.buttonText}>建立遊戲</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={joinGame}>
                    <Text style={styles.buttonText}>加入遊戲</Text>
                </TouchableOpacity>

                {players.length > 0 && (
                    <Text style={{ marginTop: 20 }}>已連線至大廳... 等待主機中</Text>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: 10,
        width: '80%',
        alignItems: 'center'
    },
    secondaryButton: { backgroundColor: '#34C759' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    qrContainer: { alignItems: 'center', marginBottom: 30, padding: 20, backgroundColor: '#f0f0f0', borderRadius: 10 },
    ipText: { marginTop: 10, fontSize: 18, fontWeight: 'bold' },
    subText: { color: '#666', marginTop: 5 },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 10, alignSelf: 'flex-start' },
    playerText: { fontSize: 16, marginBottom: 5, padding: 10, backgroundColor: '#eee', width: '100%' },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, width: '100%', marginBottom: 20 },
    picker: { height: 50, width: '100%' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, width: '100%', marginBottom: 20, fontSize: 16 }
});

export default LobbyScreen;
