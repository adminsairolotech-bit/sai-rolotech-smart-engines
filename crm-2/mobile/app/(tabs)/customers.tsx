import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const customers = [
  { id: '1', name: 'Rahul Sharma', phone: '+91 98765 43210', city: 'Delhi', status: 'Active' },
  { id: '2', name: 'Priya Verma', phone: '+91 87654 32109', city: 'Mumbai', status: 'Active' },
  { id: '3', name: 'Amir Khan', phone: '+91 76543 21098', city: 'Pune', status: 'Inactive' },
  { id: '4', name: 'Sunita Patel', phone: '+91 65432 10987', city: 'Ahmedabad', status: 'Active' },
  { id: '5', name: 'Deepak Singh', phone: '+91 54321 09876', city: 'Jaipur', status: 'Active' },
];

export default function CustomersScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerCount}>{customers.length} total</Text>
      </View>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.detail}>{item.phone}</Text>
              <Text style={styles.detail}>{item.city}</Text>
            </View>
            <View style={[styles.badge, item.status === 'Active' ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, item.status === 'Active' ? styles.badgeTextActive : styles.badgeTextInactive]}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1a1a2e' },
  headerCount: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', marginTop: 2 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#667eea', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 17 },
  info: { flex: 1 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1a1a2e' },
  detail: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6b7280', marginTop: 1 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: '#d1fae5' },
  badgeInactive: { backgroundColor: '#fef2f2' },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  badgeTextActive: { color: '#065f46' },
  badgeTextInactive: { color: '#dc2626' },
});
