import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SUPPORT_EMAIL, SUPPORT_PHONE, SUPPORT_WHATSAPP } from '@/lib/app-info';

export default function SupportScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>{'<'} Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>
        Upload-ready build me support options app ke andar easily accessible hone chahiye. Yahan se phone, email, aur WhatsApp support available hai.
      </Text>

      <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}>
        <Text style={styles.cardTitle}>Phone Support</Text>
        <Text style={styles.cardBody}>{SUPPORT_PHONE}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=CRM%20Support`)}>
        <Text style={styles.cardTitle}>Email Support</Text>
        <Text style={styles.cardBody}>{SUPPORT_EMAIL}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(`${SUPPORT_WHATSAPP}?text=CRM%20support%20chahiye`)}>
        <Text style={styles.cardTitle}>WhatsApp Support</Text>
        <Text style={styles.cardBody}>Fast response for live CRM issues</Text>
      </TouchableOpacity>
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
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#1a1a2e', marginBottom: 5 },
  cardBody: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', lineHeight: 20 },
});
