import { Platform } from 'react-native';

const getBaseUrl = () => {
    // Android Emulator uses 10.0.2.2 to access localhost
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:3000';
    }
    // iOS Simulator uses localhost
    return 'http://localhost:3000';
};

export const API_CONFIG = {
    BASE_URL: getBaseUrl(),
    TIMEOUT: 10000,
};
