import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import CryptoJS from 'crypto-js';

const STORAGE_KEY_BASE_URL = 'api_base_url';
let isForceOffline = false;

const CACHE_KEYS = {
    ALL_EVENTS: 'cache_all_events',
    MY_EVENTS: 'cache_my_events',
    USER_BADGES: 'cache_user_badges',
    EVENT_PREFIX: 'cache_event_',
};

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Load base URL from storage on app start
AsyncStorage.getItem(STORAGE_KEY_BASE_URL).then(url => {
    if (url) {
        apiClient.defaults.baseURL = url;
    }
});


// Request interceptor to add Token
apiClient.interceptors.request.use(
    async (config) => {
        if (isForceOffline) {
            return Promise.reject({ message: 'Force Offline Mode Enabled', isOfflineError: true });
        }
        const token = await AsyncStorage.getItem('user_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Types
export interface LoginResponse {
    token?: string;
    id?: string;
    name?: string;
    user?: { // Keep for backward compatibility if backend changes
        id: string;
        username: string;
        email: string;
        role: string;
    };
    message?: string; // For register response
}

export interface Event {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    location?: string;
    status: string; // 'draft', 'published', 'ended'

    is_offline_active?: boolean;
    session_key?: string;
}

export const ApiService = {
    auth: {
        login: async (email: string, password: string): Promise<LoginResponse> => {
            const response = await apiClient.post<LoginResponse>('/auth/login', {
                email,
                password,
                role: 'organizer' // Default to organizer for this app
            });
            if (response.data.token) {
                await AsyncStorage.setItem('user_token', response.data.token);
                // Store user info from available fields
                const userInfo = {
                    id: response.data.id || response.data.user?.id,
                    name: response.data.name || response.data.user?.username,
                    email: email // We know the email from the input
                };
                await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
            }
            return response.data;
        },
        register: async (username: string, email: string, password: string): Promise<LoginResponse> => {
            const response = await apiClient.post<LoginResponse>('/auth/register', {
                username,
                email,
                password,
                role: 'organizer' // Default role for now
            });
            // Note: Backend currently does NOT return token on register, only { message, id }
            // So we might need to login automatically or redirect to login.
            // For now, handling if token DOES exist (future proof)
            if (response.data.token) {
                await AsyncStorage.setItem('user_token', response.data.token);
                const userInfo = {
                    id: response.data.id,
                    name: username,
                    email: email
                };
                await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
            }
            return response.data;
        },
        logout: async () => {
            await AsyncStorage.removeItem('user_token');
            await AsyncStorage.removeItem('user_info');
        },
        getToken: async () => {
            return await AsyncStorage.getItem('user_token');
        },
        renewToken: async (): Promise<string | null> => {
            try {
                const token = await AsyncStorage.getItem('user_token');
                if (!token) return null;

                const response = await apiClient.post<{ token: string }>('/auth/renew');
                if (response.data.token) {
                    await AsyncStorage.setItem('user_token', response.data.token);
                    return response.data.token;
                }
                return null;
            } catch (error) {
                // If renew fails (e.g. 403), verify if we should logout
                // For now, return null to indicate failure
                return null;
            }
        }
    },
    events: {
        getEvents: async (): Promise<Event[]> => {
            try {
                const response = await apiClient.get<Event[]>('/organizer/events');
                await AsyncStorage.setItem(CACHE_KEYS.MY_EVENTS, JSON.stringify(response.data));
                return response.data;
            } catch (error: any) {
                console.log('getEvents error, checking cache...');
                const cached = await AsyncStorage.getItem(CACHE_KEYS.MY_EVENTS);
                if (cached) return JSON.parse(cached);
                throw error;
            }
        },
        getAllEvents: async (): Promise<Event[]> => {
            try {
                const response = await apiClient.get<Event[]>('/organizer/events/all');
                await AsyncStorage.setItem(CACHE_KEYS.ALL_EVENTS, JSON.stringify(response.data));
                return response.data;
            } catch (error: any) {
                console.log('getAllEvents error (Network/Offline?), checking cache...');
                const cached = await AsyncStorage.getItem(CACHE_KEYS.ALL_EVENTS);
                if (cached) {
                    console.log('Serving events from cache');
                    return JSON.parse(cached);
                }
                console.log('No cache found for events');
                throw error;
            }
        },
        getEvent: async (eventId: string): Promise<Event> => {
            const response = await apiClient.get<Event>(`/organizer/events/${eventId}`);
            return response.data;
        },
        getPublicEvent: async (eventId: string): Promise<Event> => {
            try {
                const response = await apiClient.get<Event>(`/organizer/events/public/${eventId}`);
                await AsyncStorage.setItem(CACHE_KEYS.EVENT_PREFIX + eventId, JSON.stringify(response.data));
                return response.data;
            } catch (error) {
                const cached = await AsyncStorage.getItem(CACHE_KEYS.EVENT_PREFIX + eventId);
                if (cached) return JSON.parse(cached);
                throw error;
            }
        },
        createEvent: async (eventData: Partial<Event>): Promise<Event> => {
            // Ensure dates are ISO strings
            const response = await apiClient.post<Event>('/organizer/events', eventData);
            return response.data;
        },
        updateEvent: async (eventId: string, eventData: Partial<Event>): Promise<Event> => {
            const response = await apiClient.put<Event>(`/organizer/events/${eventId}`, eventData);
            return response.data;
        },
        deleteEvent: async (eventId: string): Promise<void> => {
            await apiClient.delete(`/organizer/events/${eventId}`);
        },
        claimBadge: async (token: string): Promise<any> => {
            const response = await apiClient.post('/organizer/events/claim', { token });
            return response.data;
        },
        getEventBadges: async (eventId: string) => {
            try {
                const response = await apiClient.get(`/organizer/events/${eventId}/badges`);
                await AsyncStorage.setItem(CACHE_KEYS.EVENT_PREFIX + eventId + '_badges', JSON.stringify(response.data));
                return response.data;
            } catch (error: any) {
                console.log('getEventBadges error, checking cache...');
                const cached = await AsyncStorage.getItem(CACHE_KEYS.EVENT_PREFIX + eventId + '_badges');
                if (cached) return JSON.parse(cached);
                throw error;
            }
        },
        createBadge: async (eventId: string, badgeData: any) => {
            const response = await apiClient.post(`/organizer/events/${eventId}/badges`, badgeData);
            return response.data;
        },
        generateOnlineToken: async (eventId: string): Promise<{ token: string, expiresAt: number }> => {
            const response = await apiClient.post('/organizer/events/online/token', { eventId });
            return response.data;
        },
        getClaimedBadges: async (): Promise<any[]> => {
            try {
                const response = await apiClient.get<any[]>('/organizer/records');
                await AsyncStorage.setItem(CACHE_KEYS.USER_BADGES, JSON.stringify(response.data));
                return response.data;
            } catch (error) {
                const cached = await AsyncStorage.getItem(CACHE_KEYS.USER_BADGES);
                if (cached) return JSON.parse(cached);
                throw error;
            }
        },
        syncOfflineClaims: async (): Promise<{ synced: number, failed: number }> => {
            const key = 'offline_claims';
            const stored = await AsyncStorage.getItem(key);
            if (!stored) return { synced: 0, failed: 0 };

            let claims = JSON.parse(stored);
            let syncedCount = 0;
            let failedCount = 0;
            const remainingClaims = [];

            for (const claim of claims) {
                try {
                    // Check if forced offline
                    if (isForceOffline) {
                        remainingClaims.push(claim);
                        continue;
                    }

                    // Attempt claim
                    if (claim.token.trim().startsWith('{')) {
                        try {
                            const data = JSON.parse(claim.token);
                            if (data.type === 'secure' && data.eid && data.blob) {
                                await ApiService.events.claimEncrypted(data.eid, data.blob);
                                syncedCount++;
                                continue;
                            }
                        } catch (e) {
                            // ignore parse error, treat as normal token
                        }
                    }

                    await ApiService.events.claimBadge(claim.token);
                    syncedCount++;
                } catch (error: any) {
                    console.log('Sync failed for token:', claim.token, error.message);
                    // If duplicate, consider it synced/done
                    if (error.response?.data?.error?.includes('already claimed')) {
                        syncedCount++; // Treat as success to remove from queue
                    } else if (error.message === 'Network Error' || error.isOfflineError) {
                        // Keep in queue
                        remainingClaims.push(claim);
                        failedCount++;
                    } else {
                        // Other error (e.g. invalid), maybe keep or discard?
                        // For detailed offline support we might want a "Failed Queue" UI.
                        // For now, keep it to retry.
                        remainingClaims.push(claim);
                        failedCount++;
                    }
                }
            }

            await AsyncStorage.setItem(key, JSON.stringify(remainingClaims));
            return { synced: syncedCount, failed: failedCount };
        },
        // Secure Offline Mode
        handshake: async (eventId: string): Promise<{ session_key: string }> => {
            const response = await apiClient.post(`/organizer/events/${eventId}/handshake`);
            return response.data;
        },
        syncValidations: async (validations: any[]): Promise<{ synced: number }> => {
            const response = await apiClient.post('/organizer/events/sync-validations', { validations });
            return response.data;
        },
        syncLocalValidations: async (): Promise<number> => {
            const key = 'offline_validations';
            const stored = await AsyncStorage.getItem(key);
            if (!stored) return 0;

            const validations = JSON.parse(stored);
            if (validations.length === 0) return 0;

            await ApiService.events.syncValidations(validations);

            // Clear on success
            await AsyncStorage.removeItem(key);
            return validations.length;
        },
        claimEncrypted: async (eventId: string, encryptedBlob: string): Promise<any> => {
            const response = await apiClient.post('/organizer/events/claim-encrypted', { eventId, encryptedBlob });
            return response.data;
        }
    },
    crypto: {
        encrypt: (data: any, key: string): string => {
            const iv = CryptoJS.lib.WordArray.random(16);
            const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), CryptoJS.enc.Hex.parse(key), {
                iv: iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7
            });
            // Return IV:Ciphertext (hex)
            return iv.toString() + ':' + encrypted.ciphertext.toString();
        },
        // Decrypt is needed if Client also verifies? Client mainly encrypts.
        // Hashing for local storage
        hash: (data: string): string => {
            return CryptoJS.SHA256(data).toString(CryptoJS.enc.Hex);
        },
        // --- Puzzle Verification ---
        getPuzzleSecret(eventId: string): string {
            // Deterministic secret for Offline Mode (so it works across reinstall/devices if logic same)
            // In real secure app, this should be a random key stored in SecureStorage/Keychain.
            // For this demo: HMAC(eventId, "MASTER_APP_SECRET")
            return CryptoJS.SHA256(eventId + "EVENT_PASS_PUZZLE_SECRET_2025").toString(CryptoJS.enc.Hex);
        },

        signPuzzlePiece(eventId: string, pieceId: string, badgeId?: string): string {
            const secret = this.getPuzzleSecret(eventId);
            // If badgeId is provided, bind to it: Hash(badgeId + pieceId + secret)
            // If not (legacy/generic), use: Hash(pieceId + secret)
            const payload = badgeId ? (badgeId + pieceId) : pieceId;
            return CryptoJS.SHA256(payload + secret).toString(CryptoJS.enc.Hex).substring(0, 8);
        },

        verifyPuzzleProof(eventId: string, proofs: string[], badgeId?: string): boolean {
            // P1..P4 must be present.
            // Proofs is array of signatures.
            const pieces = ['p1', 'p2', 'p3', 'p4'];
            const validSigs = pieces.map(p => this.signPuzzlePiece(eventId, p, badgeId));

            // Check if every valid signature is present in the proofs
            return validSigs.every(sig => proofs.includes(sig));
        }
    },
    config: {
        getBaseUrl: async (): Promise<string> => {
            const storedUrl = await AsyncStorage.getItem(STORAGE_KEY_BASE_URL);
            return storedUrl || API_CONFIG.BASE_URL;
        },
        setBaseUrl: async (url: string): Promise<void> => {
            if (!url) {
                await AsyncStorage.removeItem(STORAGE_KEY_BASE_URL);
                apiClient.defaults.baseURL = API_CONFIG.BASE_URL;
            } else {
                // Ensure URL doesn't have trailing slash for consistency
                const cleanUrl = url.replace(/\/$/, '');
                await AsyncStorage.setItem(STORAGE_KEY_BASE_URL, cleanUrl);
                apiClient.defaults.baseURL = cleanUrl;
            }
        },
        getEffectiveBaseUrl: (): string => {
            return apiClient.defaults.baseURL || API_CONFIG.BASE_URL;
        },
        setForceOffline: (enabled: boolean) => {
            isForceOffline = enabled;
        },
        isForceOffline: () => isForceOffline,
        storeEventKey: async (eventId: string, key: string) => {
            await AsyncStorage.setItem(CACHE_KEYS.EVENT_PREFIX + eventId + '_key', key);
        },
        getEventKey: async (eventId: string): Promise<string | null> => {
            return await AsyncStorage.getItem(CACHE_KEYS.EVENT_PREFIX + eventId + '_key');
        }
    }
};
