import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    Alert, // Added Alert
} from 'react-native';
import { ApiService } from '../../services/ApiService';

const RegisterScreen = ({ navigation }: any) => {
    const [username, setUsername] = useState(''); // account -> username
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!username || !email || !password) {
            Alert.alert('錯誤', '請填寫所有欄位');
            return;
        }

        setLoading(true);
        try {
            await ApiService.auth.register(username, email, password);

            // Auto login after register
            await ApiService.auth.login(email, password);

            Alert.alert('成功', '帳號已建立並登入！');
            navigation.replace('Dashboard');
        } catch (error: any) {
            console.error(error);
            const message = error.response?.data?.message || '註冊失敗。';
            Alert.alert('錯誤', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>EventPass</Text>
                <Text style={styles.subtitle}>建立帳號</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>使用者名稱</Text>
                    <TextInput
                        style={styles.input}
                        value={username}
                        onChangeText={setUsername}
                        placeholder="選擇使用者名稱"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>電子郵件</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="輸入您的電子郵件"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>密碼</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="設定密碼"
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.registerButton, loading && styles.buttonDisabled]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    <Text style={styles.registerButtonText}>{loading ? '建立中...' : '註冊'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.loginLink}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.loginLinkText}>已有帳號？登入</Text>
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
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 24,
        color: '#666',
        textAlign: 'center',
        marginBottom: 50,
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
    registerButton: {
        backgroundColor: '#34C759',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonDisabled: {
        backgroundColor: '#aaccff',
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#007AFF',
        fontSize: 16,
    },
});

export default RegisterScreen;
