import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import LanGameService, { GameState } from '../../services/LanGameService';
import { ApiService } from '../../services/ApiService';

const PuzzleGameScreen = ({ navigation }: any) => {
    const [state, setState] = useState<GameState>(LanGameService.state);
    const [isScanning, setIsScanning] = useState(false);
    const [winToken, setWinToken] = useState<string>('');

    const device = useCameraDevice('back');

    useEffect(() => {
        const updateListener = (newState: GameState) => {
            setState({ ...newState });
        };
        const winListener = async (finalState: GameState) => {
            setState({ ...finalState });
            if (LanGameService.state.hostId === (await ApiService.auth.getToken())) {
                // Host logic for token gen is done in render usually or here
            }
        };

        LanGameService.on('state_updated', updateListener);
        LanGameService.on('game_win', winListener);

        return () => {
            LanGameService.removeListener('state_updated', updateListener);
            LanGameService.removeListener('game_win', winListener);
        };
    }, []);

    // Generate Win Token if Host and Won
    useEffect(() => {
        if (state.status === 'won' && !winToken) {
            generateWinToken();
        }
    }, [state.status]);

    const generateWinToken = async () => {
        const eid = LanGameService.state.activeEventId || 'coop-event-demo';
        const bid = LanGameService.state.activeBadgeId; // Get Badge ID
        const teamIds = LanGameService.state.players.map(p => p.id); // All players
        const proofs = LanGameService.state.pieces.map(p => p.signature || '').filter(Boolean);

        const token = {
            type: 'secure',
            eid: eid,
            blob: JSON.stringify({ team: teamIds, proofs, bid, ts: Date.now() })
        };
        setWinToken(JSON.stringify(token));
    };

    const codeScanner = useCodeScanner({
        codeTypes: ['qr'],
        onCodeScanned: (codes) => {
            if (isScanning && codes.length > 0) {
                const val = codes[0].value;
                if (val) {
                    setIsScanning(false);
                    try {
                        const success = LanGameService.validateAndSendPiece(val);
                        if (success) {
                            Alert.alert('已掃描！', `碎片已接受！`);
                        }
                    } catch (e: any) {
                        Alert.alert('無效碎片', e.message);
                    }
                }
            }
        }
    });

    if (isScanning && device) {
        return (
            <View style={{ flex: 1 }}>
                <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} codeScanner={codeScanner} />
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsScanning(false)}>
                    <Text style={{ color: '#fff', fontSize: 18 }}>關閉</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (state.status === 'won') {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={[styles.title, { color: '#34C759' }]}>任務完成！</Text>
                    <Text style={styles.subText}>找到所有碎片！</Text>

                    <View style={styles.qrContainer}>
                        {winToken ? <QRCode value={winToken} size={250} /> : <Text>產生證明中...</Text>}
                        <Text style={{ marginTop: 20, textAlign: 'center' }}>
                            向主辦方出示此畫面以領取團隊憑證！
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Dashboard')}>
                        <Text style={styles.buttonText}>離開</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>尋找碎片！</Text>
                <Text>已找到碎片：{state.pieces.filter(p => p.foundBy).length} / {state.pieces.length}</Text>
            </View>

            <FlatList
                data={state.pieces}
                numColumns={3}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.grid}
                renderItem={({ item }) => (
                    <View style={[styles.piece, item.foundBy ? styles.pieceFound : styles.pieceMissing]}>
                        <Text style={styles.pieceText}>{item.foundBy ? '✓' : '?'}</Text>
                        {item.foundBy && <Text style={styles.finderText}>{state.players.find(p => p.id === item.foundBy)?.name}</Text>}
                    </View>
                )}
            />

            <View style={styles.footer}>
                <TouchableOpacity style={styles.scanButton} onPress={() => setIsScanning(true)}>
                    <Text style={styles.buttonText}>📷 掃描碎片</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
    header: { padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
    title: { fontSize: 24, fontWeight: 'bold' },
    subText: { fontSize: 18, marginBottom: 20 },
    grid: { padding: 10 },
    piece: {
        flex: 1,
        aspectRatio: 1,
        margin: 5,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    pieceMissing: { backgroundColor: '#eee' },
    pieceFound: { backgroundColor: '#4CD964' },
    pieceText: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
    finderText: { color: '#fff', fontSize: 10, marginTop: 5 },
    footer: { padding: 20 },
    scanButton: {
        backgroundColor: '#007AFF',
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
        width: '100%',
        alignItems: 'center'
    },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    closeBtn: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 5 },
    qrContainer: { padding: 20, backgroundColor: '#f0f0f0', borderRadius: 10, alignItems: 'center' }
});

export default PuzzleGameScreen;
