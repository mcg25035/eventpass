import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { ApiService } from '../../services/ApiService';

const PuzzleAssetsScreen = ({ route, navigation }: any) => {
    // Get activityId from route
    const { activityId, activityName } = route.params || { activityId: 'demo', activityName: 'Demo Event' };

    const [badges, setBadges] = React.useState<any[]>([]);
    const [selectedBadgeId, setSelectedBadgeId] = React.useState<string | null>(null);

    React.useEffect(() => {
        ApiService.events.getEventBadges(activityId).then(list => {
            setBadges(list);
            if (list.length > 0) setSelectedBadgeId(list[0].id);
        });
    }, [activityId]);

    // Standardized Piece IDs with Event Binding & Signature & Badge Binding
    const generatePayload = (pieceId: string) => {
        // Sign the piece (binding to badge if selected)
        const sig = ApiService.crypto.signPuzzlePiece(activityId, pieceId, selectedBadgeId || undefined);
        const payload: any = {
            e: activityId,
            p: pieceId,
            s: sig
        };
        if (selectedBadgeId) payload.b = selectedBadgeId;
        return JSON.stringify(payload);
    };

    const pieces = [
        { id: 'p1', label: 'Piece #1', payload: generatePayload('p1') },
        { id: 'p2', label: 'Piece #2', payload: generatePayload('p2') },
        { id: 'p3', label: 'Piece #3', payload: generatePayload('p3') },
        { id: 'p4', label: 'Piece #4', payload: generatePayload('p4') },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backLink}>← 返回</Text>
                </TouchableOpacity>
                <Text style={styles.title}>活動素材：{activityName}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.instructions}>
                    這些是此活動的專用 QR Code。
                    選擇一個徽章以產生該特定任務的拼圖碎片。
                </Text>

                <View style={styles.selectorContainer}>
                    <Text style={styles.label}>選擇任務 (徽章)：</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeList}>
                        {badges.map(b => (
                            <TouchableOpacity
                                key={b.id}
                                style={[styles.badgeChip, selectedBadgeId === b.id && styles.badgeChipSelected]}
                                onPress={() => setSelectedBadgeId(b.id)}
                            >
                                <Text style={[styles.badgeText, selectedBadgeId === b.id && styles.badgeTextSelected]}>
                                    {b.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.grid}>
                    {pieces.map((p) => (
                        <View key={p.id} style={styles.card}>
                            <Text style={styles.cardTitle}>{p.label}</Text>
                            <View style={styles.qrWrapper}>
                                <QRCode value={p.payload} size={120} />
                            </View>
                            <Text style={styles.qrValue}>ID: {p.id}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    header: { flexDirection: 'row', padding: 20, alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
    backLink: { color: '#007AFF', fontSize: 16, marginRight: 20 },
    title: { fontSize: 20, fontWeight: 'bold' },
    scroll: { padding: 20 },
    instructions: { fontSize: 16, color: '#666', marginBottom: 20, lineHeight: 22 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    qrWrapper: { padding: 5, backgroundColor: '#fff' },
    qrValue: { marginTop: 10, color: '#888', fontSize: 12 },
    selectorContainer: { marginBottom: 20 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
    badgeList: { flexDirection: 'row' },
    badgeChip: { padding: 10, backgroundColor: '#eee', borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#ddd' },
    badgeChipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
    badgeText: { color: '#333' },
    badgeTextSelected: { color: '#fff', fontWeight: 'bold' }
});

export default PuzzleAssetsScreen;
