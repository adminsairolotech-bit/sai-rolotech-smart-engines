import { ScrollView, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

const stats = [
  { label: 'Total Customers', value: '1,284', icon: '👥', color: '#667eea' },
  { label: 'Active Leads', value: '342', icon: '🎯', color: '#f59e0b' },
  { label: 'Sales Today', value: '₹84,500', icon: '💰', color: '#10b981' },
  { label: 'Pending Tasks', value: '27', icon: '📋', color: '#ef4444' },
];

const activities = [
  { name: 'Rahul Sharma', action: 'New lead added', time: '5 min ago', avatar: 'R' },
  { name: 'Priya Verma', action: 'Deal closed — ₹12,000', time: '23 min ago', avatar: 'P' },
  { name: 'Amir Khan', action: 'Follow-up scheduled', time: '1 hr ago', avatar: 'A' },
  { name: 'Sunita Patel', action: 'Customer call done', time: '2 hr ago', avatar: 'S' },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>CRM</Text>
          </View>
          <View style={styles.betaBadge}>
            <Text style={styles.betaText}>BETA</Text>
          </View>
        </View>
        <View style={styles.avatarBox}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? 'U'}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 20 + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>Namaste, {user?.name ?? 'User'} 👋</Text>
        <Text style={styles.greetingSub}>Aaj ka overview dekhein</Text>

        <View style={styles.statsGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '20' }]}>
                <Text style={styles.statEmoji}>{s.icon}</Text>
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          {activities.map((a, i) => (
            <View key={i} style={[styles.activityRow, i < activities.length - 1 && styles.activityDivider]}>
              <View style={styles.activityAvatar}>
                <Text style={styles.activityAvatarText}>{a.avatar}</Text>
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityName}>{a.name}</Text>
                <Text style={styles.activityAction}>{a.action}</Text>
              </View>
              <Text style={styles.activityTime}>{a.time}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 },
  betaBadge: { backgroundColor: '#ff6b35', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  betaText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  avatarBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  greeting: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1a1a2e', marginTop: 4 },
  greetingSub: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', marginTop: 2, marginBottom: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    width: '47%', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statEmoji: { fontSize: 20 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 20, color: '#1a1a2e' },
  statLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6b7280', marginTop: 2 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#1a1a2e', marginBottom: 10 },
  activityCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  activityRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  activityDivider: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  activityAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  activityAvatarText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
  activityInfo: { flex: 1 },
  activityName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1a1a2e' },
  activityAction: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6b7280', marginTop: 1 },
  activityTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: '#9ca3af' },
});
