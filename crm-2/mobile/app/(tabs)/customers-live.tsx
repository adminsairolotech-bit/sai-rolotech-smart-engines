import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomersLiveScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
        <Text style={styles.headerTitle}>Customers</Text>
        <Text style={styles.headerCount}>Truthful live-sync state</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>No synced customers yet</Text>
        <Text style={styles.body}>
          Purane sample customer records intentionally remove kar diye gaye hain. Backend CRM sync aur authorized API setup ke baad real customer list yahan load hogi.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f0f2f5' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#1a1a2e' },
  headerCount: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 14, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#1a1a2e', marginBottom: 8 },
  body: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#6b7280', lineHeight: 20 },
});
