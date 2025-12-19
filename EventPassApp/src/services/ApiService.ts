import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

const apiClient = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Token
apiClient.interceptors.request.use(
    async (config) => {
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
        }
    },
    events: {
        getEvents: async (): Promise<Event[]> => {
            const response = await apiClient.get<Event[]>('/organizer/events');
            return response.data;
        },
        getAllEvents: async (): Promise<Event[]> => {
            const response = await apiClient.get<Event[]>('/organizer/events/all');
            return response.data;
        },
        getEvent: async (eventId: string): Promise<Event> => {
            const response = await apiClient.get<Event>(`/organizer/events/${eventId}`);
            return response.data;
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
            const response = await apiClient.get(`/organizer/events/${eventId}/badges`);
            return response.data;
        },
        createBadge: async (eventId: string, badgeData: any) => {
            const response = await apiClient.post(`/organizer/events/${eventId}/badges`, badgeData);
            return response.data;
        },
        generateOnlineToken: async (eventId: string): Promise<{ token: string, expiresAt: number }> => {
            const response = await apiClient.post('/organizer/events/online/token', { eventId });
            return response.data;
        }
    }
};
