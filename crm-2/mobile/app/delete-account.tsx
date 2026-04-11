import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { apiJson } from '@/lib/api';

interface DeletionResponse {
  success: boolean;
  requestId: string;
}

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!user?.id) {
      Alert.alert('Unavailable', 'Login ke bina deletion request start nahi ho sakti.');
      return;
    }

    try {
      setLoading(true);
      await apiJson<DeletionResponse>('/api/account-deletion-request', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          email: user.email || '',
          name: user.name,
          reason,
          source: 'mobile_app',
        }),
      });
      setDone(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request fail ho gayi.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>{'<'} Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Delete Account</Text>
      <Text style={styles.subtitle}>
        App Store policy ke hisaab se account deletion request app ke andar se initiate honi chahiye. Yeh screen wahi start point provide karti hai.
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Logged-in user</Text>
        <Text style={styles.value}>{user?.name ?? 'Unknown user'}</Text>
        <Text style={styles.meta}>{user?.email || 'Email unavailable'}</Text>

        <Text style={[styles.label, styles.reasonLabel]}>Reason (optional)</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Agar aap chahein to delete request ka short reason likh sakte hain."
          placeholderTextColor="#9ca3af"
          value={reason}
          onChangeText={setReason}
        />

        {done ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Request received</Text>
            <Text style={styles.successText}>
              Aapki account deletion request record ho gayi hai. Support/admin team isko process karegi.
            </Text>
          </View>
        ) : (
          <TouchableOpacity style={[styles.deleteBtn, loading && styles.deleteBtnDisabled]} onPress={submit} disabled={loading}>
            <Text style={styles.deleteBtnText}>{loading ? 'Submit ho raha hai...' : 'Deletion Request Submit Karein'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 16, gap: 14 },
  back: { fontFamily: 'Inter_600SemiBold', color: '#4f46e5', marginTop: 8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, color: '#1a1a2e', marginTop: 8 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, color: '#6b7280', lineHeight: 21 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#374151', marginBottom: 4 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#1a1a2e' },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', marginTop: 2 },
  reasonLabel: { marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, textAlignVertical: 'top', minHeight: 100, fontFamily: 'Inter_400Regular', color: '#111827' },
  deleteBtn: { backgroundColor: '#dc2626', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 },
  deleteBtnDisabled: { opacity: 0.7 },
  deleteBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  successBox: { marginTop: 18, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, padding: 14 },
  successTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#065f46', marginBottom: 6 },
  successText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#065f46', lineHeight: 20 },
});
