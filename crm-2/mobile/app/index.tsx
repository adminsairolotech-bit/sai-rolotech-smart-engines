import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import { SUPPORT_EMAIL } from '@/lib/app-info';

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      Alert.alert('Zaroori', 'User ID aur Password likhein.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(userId.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>CRM</Text>
              </View>
              <View style={styles.betaBadge}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Apne account mein login karein</Text>

            <View style={styles.field}>
              <Text style={styles.label}>User ID</Text>
              <TextInput
                style={styles.input}
                placeholder="Apna User ID likhein"
                placeholderTextColor="#9ca3af"
                value={userId}
                onChangeText={setUserId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passRow}>
                <TextInput
                  style={[styles.input, styles.passInput]}
                  placeholder="Apna Password likhein"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPass((v) => !v)}
                >
                  <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Login Karein</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/support')}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgotText}>Password help chahiye?</Text>
            </TouchableOpacity>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Production-safe sign in</Text>
              <Text style={styles.demoText}>
                Demo credentials hata diye gaye hain. Live CRM access ke liye active backend account zaroori hai. Help ke liye {SUPPORT_EMAIL}.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingTop: 60 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  logoBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#667eea',
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 },
  betaBadge: {
    backgroundColor: '#ff6b35', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  betaText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#1a1a2e', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 13, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1a1a2e',
  },
  passRow: { position: 'relative' },
  passInput: { paddingRight: 48 },
  eyeBtn: { position: 'absolute', right: 14, top: 13 },
  eyeIcon: { fontSize: 18 },
  loginBtn: {
    backgroundColor: '#667eea', borderRadius: 12,
    padding: 15, alignItems: 'center', marginTop: 8,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: '#667eea', fontFamily: 'Inter_500Medium', fontSize: 14 },
  demoBox: {
    marginTop: 20, backgroundColor: '#f8f9ff',
    borderWidth: 1, borderColor: '#c7d2fe', borderStyle: 'dashed',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  demoTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#374151', marginBottom: 4, textAlign: 'center' },
  demoText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#4b5563', textAlign: 'center', lineHeight: 18 },
  demoCode: { fontFamily: 'Inter_600SemiBold', color: '#4f46e5' },
});
