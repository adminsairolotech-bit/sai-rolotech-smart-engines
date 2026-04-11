import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { icon: '👤', label: 'Account Settings' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🌐', label: 'Language' },
  { icon: '🔒', label: 'Privacy & Security' },
  { icon: '❓', label: 'Help & Support' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert('Logout', 'Kya aap logout karna chahte hain?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? 'U'}</Text>
        </View>
        <Text style={styles.name}>{user?.name ?? 'User'}</Text>
        <Text style={styles.userId}>ID: {user?.id ?? '-'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ?? 'User'}</Text>
        </View>
      </View>

      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.menuRow, i < menuItems.length - 1 && styles.menuDivider]} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>CRM System v1.0.0 Beta</Text>
        <Text style={styles.appCompany}>Sairolotech</Text>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Logout Karein</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1a1a2e' },
  profileCard: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 20, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 28 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#1a1a2e' },
  userId: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280' },
  roleBadge: { backgroundColor: '#e0e7ff', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 4 },
  roleText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#4f46e5' },
  menuCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  menuIcon: { fontSize: 18 },
  menuLabel: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, color: '#374151' },
  menuArrow: { fontSize: 20, color: '#9ca3af' },
  appInfo: { alignItems: 'center', marginTop: 20, gap: 2 },
  appVersion: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9ca3af' },
  appCompany: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#6b7280' },
  logoutBtn: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', margin: 16, borderRadius: 12, padding: 14, alignItems: 'center' },
  logoutText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#dc2626' },
});
