import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';

export default function ForgotPasswordScreen() {
  const { recoverPassword } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRecover = async () => {
    if (!userId.trim()) {
      Alert.alert('Zaroori', 'User ID likhna zaroori hai.');
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const result = recoverPassword(userId.trim());
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      Alert.alert('Error', result.error);
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

            {success ? (
              <View style={styles.successArea}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successTitle}>Link Bhej Diya!</Text>
                <Text style={styles.successMsg}>
                  Password recovery link aapke registered email par bhej diya gaya hai.
                </Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
                  <Text style={styles.backBtnText}>Login par Wapas Jaayein</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Password Recover Karein</Text>
                <Text style={styles.subtitle}>
                  Apna User ID likhein — recovery link email par bheja jaayega
                </Text>

                <View style={styles.field}>
                  <Text style={styles.label}>User ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apna registered User ID likhein"
                    placeholderTextColor="#9ca3af"
                    value={userId}
                    onChangeText={setUserId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleRecover}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {loading ? 'Bhej raha hai...' : 'Recovery Link Bhejein'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backLink}
                >
                  <Text style={styles.backLinkText}>← Login par wapas jaayein</Text>
                </TouchableOpacity>
              </>
            )}
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
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 },
  logoBox: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 },
  betaBadge: { backgroundColor: '#ff6b35', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  betaText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1a1a2e', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12, padding: 13, fontSize: 14, fontFamily: 'Inter_400Regular', color: '#1a1a2e' },
  submitBtn: { backgroundColor: '#667eea', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 16 },
  backLink: { alignItems: 'center', marginTop: 16 },
  backLinkText: { color: '#667eea', fontFamily: 'Inter_500Medium', fontSize: 14 },
  successArea: { alignItems: 'center', gap: 14, paddingVertical: 10 },
  successIcon: { fontSize: 56 },
  successTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1a1a2e' },
  successMsg: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#374151', textAlign: 'center', lineHeight: 22 },
  backBtn: { backgroundColor: '#667eea', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 28, marginTop: 6 },
  backBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
