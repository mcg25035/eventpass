import TcpSocket from 'react-native-tcp-socket';
import { NetworkInfo } from 'react-native-network-info';
import { Buffer } from 'buffer';

// Protocol Types
export type MessageType = 'JOIN' | 'WELCOME' | 'PIECE_FOUND' | 'STATE_UPDATE' | 'GAME_WIN' | 'ERROR';

export interface GameMessage {
    type: MessageType;
    payload: any;
}

export interface Player {
    id: string; // User ID
    name: string;
    socket?: any; // Only on Host
    ip?: string;
}

export interface GameState {
    players: Player[];
    pieces: { id: string, foundBy: string | null, signature?: string }[]; // id: Piece ID
    status: 'lobby' | 'playing' | 'won';
    hostId: string;
    activeEventId?: string;
    activeBadgeId?: string;
}

const PORT = 12345;

type Listener = (data: any) => void;

class LanGameService {
    private server: any | null = null;
    private client: any | null = null;
    private isHost: boolean = false;

    // Custom Event Emitter
    private listeners: { [key: string]: Listener[] } = {};

    // State
    public state: GameState = {
        players: [],
        pieces: [],
        status: 'lobby',
        hostId: '',
        activeEventId: '',
    };

    private myUser: { id: string, name: string } | null = null;

    constructor() { }

    // --- EVENT EMITTER ---
    on(event: string, fn: Listener) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }

    removeListener(event: string, fn: Listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== fn);
    }

    emit(event: string, data: any) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(fn => fn(data));
        }
    }

    setUser(user: { id: string, name: string }) {
        this.myUser = user;
    }

    // --- HOST LOGIC ---
    async startHost(allPieces: string[], hostIp?: string, eventId?: string) {
        // Ensure previous server is stopped to avoid EADDRINUSE
        this.stop();
        // Wait a bit for port to release
        await new Promise<void>(resolve => setTimeout(resolve, 500));

        if (!this.myUser) throw new Error('User not set');

        this.isHost = true;
        this.state = {
            players: [{ id: this.myUser.id, name: this.myUser.name, ip: 'localhost' }],
            pieces: allPieces.map(id => ({ id, foundBy: null, signature: '' })),
            status: 'lobby',
            hostId: this.myUser.id,
            activeEventId: eventId
        };

        const ip = hostIp || await NetworkInfo.getIPV4Address();

        this.server = TcpSocket.createServer((socket) => {
            console.log('Client connected:', socket.address());

            socket.on('data', (data: any) => {
                // Determine if data is Buffer or string
                const msgData = (typeof data === 'string') ? data : (data instanceof Buffer ? data.toString() : String(data));
                this.handleHostMessage(socket, msgData);
            });

            socket.on('error', (error: any) => {
                console.log('Socket error:', error);
            });

            socket.on('close', () => {
                console.log('Client disconnected');
            });
        }).listen({ port: PORT, host: '0.0.0.0' });

        console.log(`Server started on ${ip}:${PORT}`);
        return ip;
    }

    private handleHostMessage(socket: any, dataStr: string) {
        try {
            const msg: GameMessage = JSON.parse(dataStr);

            switch (msg.type) { // Use msg.type explicitly
                case 'JOIN':
                    const newUser = msg.payload;
                    if (!this.state.players.find(p => p.id === newUser.id)) {
                        this.state.players.push({ ...newUser, socket });
                        this.broadcastState();
                    }
                    break;
                case 'PIECE_FOUND':
                    const { pieceId, userId, signature } = msg.payload;
                    this.updatePiece(pieceId, userId, signature);
                    break;
            }
        } catch (e) {
            console.error('Host parse error', e);
        }
    }

    private updatePiece(pieceId: string, userId: string, signature?: string) {
        const piece = this.state.pieces.find(p => p.id === pieceId);
        if (piece && !piece.foundBy) {
            piece.foundBy = userId;
            if (signature) piece.signature = signature;
            this.broadcastState();
            this.checkWinCondition();
        }
    }

    private checkWinCondition() {
        const allFound = this.state.pieces.every(p => p.foundBy !== null);
        if (allFound && this.state.status !== 'won') {
            this.state.status = 'won';
            // Use safe state without sockets
            const safeState = this.getSafeState();
            this.broadcast({ type: 'GAME_WIN', payload: { state: safeState } });
            this.emit('game_win', this.state); // Local emit can have sockets (fine)
        }
    }

    private getSafeState() {
        // Explicitly map to avoid any hidden properties or circular references from ...rest
        return {
            players: this.state.players.map(p => ({
                id: p.id,
                name: p.name,
                ip: p.ip
            })),
            pieces: this.state.pieces,
            status: this.state.status,
            hostId: this.state.hostId,
            activeEventId: this.state.activeEventId,
            activeBadgeId: this.state.activeBadgeId
        };
    }

    private broadcastState() {
        const safeState = this.getSafeState();
        this.broadcast({ type: 'STATE_UPDATE', payload: safeState });
        this.emit('state_updated', this.state);
    }

    private broadcast(msg: GameMessage) {
        const str = JSON.stringify(msg);
        this.state.players.forEach(p => {
            if (p.socket) {
                try { p.socket.write(str); } catch (e) { }
            }
        });
        // Emit locally for Host UI
        if (msg.type === 'STATE_UPDATE') this.emit('state_updated', msg.payload);
        if (msg.type === 'GAME_WIN') this.emit('game_win', msg.payload.state);
    }

    // --- CLIENT LOGIC ---
    connectToHost(ip: string) {
        if (!this.myUser) throw new Error('User not set');
        this.isHost = false;

        this.client = TcpSocket.createConnection({ port: PORT, host: ip }, () => {
            console.log('Connected to host');
            this.sendMessage({ type: 'JOIN', payload: this.myUser });
        });

        this.client.on('data', (data: any) => {
            try {
                const msgData = (typeof data === 'string') ? data : (data instanceof Buffer ? data.toString() : String(data));
                const msg: GameMessage = JSON.parse(msgData);

                if (msg.type === 'STATE_UPDATE') {
                    this.state = msg.payload;
                    this.emit('state_updated', this.state);
                } else if (msg.type === 'GAME_WIN') {
                    this.state = msg.payload.state;
                    this.emit('state_updated', this.state); // Update visual
                    this.emit('game_win', this.state);
                }
            } catch (e) { }
        });

        this.client.on('error', (err: any) => console.log('Client Error', err));
    }

    validateAndSendPiece(scannedValue: string): boolean {
        // Parse JSON
        try {
            const data = JSON.parse(scannedValue);
            // Expect { e: eventId, p: pieceId }
            if (data.e && data.p) {
                // Check Event Binding
                if (this.state.activeEventId && data.e !== this.state.activeEventId) {
                    throw new Error(`Event Mismatch!\n\nThis piece belongs to:\n${data.e}\n\nBut you are playing:\n${this.state.activeEventId}`);
                }

                // Check Badge Binding
                if (data.b) {
                    // First piece determines the mission badge
                    if (!this.state.activeBadgeId) {
                        this.state.activeBadgeId = data.b;
                        this.broadcastState(); // Notify all about the mission
                    } else if (this.state.activeBadgeId !== data.b) {
                        throw new Error(`Wrong Mission!\n\nThis piece is for badge: ${data.b}\nBut you are hunting for: ${this.state.activeBadgeId}`);
                    }
                } else {
                    // Piece has NO badge (Generic)
                    if (this.state.activeBadgeId) {
                        throw new Error(`Wrong Mission!\n\nThis piece is Generic (No Badge),\nbut you are in a Badge Mission (${this.state.activeBadgeId}).\n\nDon't mix Generic and Badge pieces!`);
                    }
                    // If no activeBadgeId, we stay in Generic mode (fine)
                }

                // If valid, send
                this.sendPieceFound(data.p, data.s);
                return true;
            }
        } catch (e) {
            // Not a JSON object or wrong format
            // Backward compatibility?
            // For now, STRICT MODE: ignore if not JSON match
            // Or allow legacy 'p1' if activeEventId is not strict
            if (!this.state.activeEventId && ['p1', 'p2', 'p3', 'p4'].includes(scannedValue)) {
                this.sendPieceFound(scannedValue);
                return true;
            }
            throw e; // Rethrow to show alert
        }
        return false;
    }

    sendPieceFound(pieceId: string, signature?: string) {
        // ... (internal legacy)
        if (this.isHost) {
            if (!this.myUser) return;
            this.updatePiece(pieceId, this.myUser.id, signature);
        } else {
            if (!this.myUser) return;
            this.sendMessage({ type: 'PIECE_FOUND', payload: { pieceId, userId: this.myUser.id, signature } });
        }
    }

    private sendMessage(msg: GameMessage) {
        if (this.client) {
            this.client.write(JSON.stringify(msg));
        }
    }

    stop() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
        this.state = { players: [], pieces: [], status: 'lobby', hostId: '', activeEventId: '', activeBadgeId: '' };
        // DO NOT wipe listeners! UI components might still be mounted.
        // this.listeners = {}; 
    }
}

export default new LanGameService();
