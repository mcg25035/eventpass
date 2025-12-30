import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert, // Added Alert import
} from 'react-native';

import { ApiService } from '../../services/ApiService';

const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState(''); // Changed from account to email
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // Added loading state

    const handleLogin = async () => { // Made function async
        if (!email || !password) {
            Alert.alert('錯誤', '請輸入電子郵件和密碼');
            return;
        }

        setLoading(true);
        try {
            await ApiService.auth.login(email, password);
            Alert.alert('成功', '登入成功！');
            navigation.replace('Dashboard'); // Changed navigate to replace for login flow
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || '登入失敗。請檢查您的網絡或憑據。';
            Alert.alert('登入失敗', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>EventPass</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>電子郵件</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="輸入您的電子郵件"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>密碼</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="輸入您的密碼"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.loginButton, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Text style={styles.loginButtonText}>{loading ? '登入中...' : '登入'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.registerLink}
                    onPress={() => navigation.navigate('Register')}
                >
                    <Text style={styles.registerLinkText}>還沒有帳號？註冊</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 60,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    loginButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonDisabled: {
        backgroundColor: '#aaccff',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    registerLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    registerLinkText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

export default LoginScreen;
