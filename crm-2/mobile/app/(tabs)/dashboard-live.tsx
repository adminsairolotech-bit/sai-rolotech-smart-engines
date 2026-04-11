import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const cards = [
  { title: 'Secure Session', body: 'Login ab backend-based session par chal raha hai.', color: '#667eea' },
  { title: 'Privacy Controls', body: 'Privacy policy aur support screens app ke andar available hain.', color: '#f59e0b' },
  { title: 'Account Deletion', body: 'Delete-account flow se in-app request start ki ja sakti hai.', color: '#ef4444' },
  { title: 'Live CRM Sync', body: 'Backend connect hote hi real customers aur leads load honge.', color: '#10b981' },
];

export default function DashboardLiveScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Store-safe mobile overview</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Namaste, {user?.name ?? 'User'}</Text>
          <Text style={styles.heroText}>
            Yeh mobile build ab misleading sample CRM numbers ke bajaye real privacy, support aur account controls ko prioritize karta hai.
          </Text>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <View key={card.title} style={styles.card}>
              <View style={[styles.cardDot, { backgroundColor: card.color }]} />
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.body}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/support')}>
          <Text style={styles.primaryBtnText}>Help & Support Kholen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push('/delete-account')}>
          <Text style={styles.secondaryBtnText}>Account Deletion Flow Dekhein</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1a1a2e' },
  headerSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', marginTop: 2 },
  content: { padding: 16, gap: 14 },
  hero: { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  heroTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1a1a2e', marginBottom: 8 },
  heroText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', lineHeight: 20 },
  grid: { gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardDot: { width: 10, height: 10, borderRadius: 5, marginBottom: 10 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#1a1a2e', marginBottom: 5 },
  cardBody: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', lineHeight: 20 },
  primaryBtn: { backgroundColor: '#667eea', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 6 },
  primaryBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  secondaryBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 15, alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' },
  secondaryBtnText: { color: '#1d4ed8', fontFamily: 'Inter_700Bold', fontSize: 14 },
});
