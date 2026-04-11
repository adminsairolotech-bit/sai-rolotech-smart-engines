import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const leads = [
  { id: '1', name: 'Vikram Malhotra', source: 'Website', value: '₹25,000', stage: 'Proposal' },
  { id: '2', name: 'Neha Gupta', source: 'Referral', value: '₹42,000', stage: 'Negotiation' },
  { id: '3', name: 'Rajesh Kumar', source: 'Social Media', value: '₹18,000', stage: 'New Lead' },
  { id: '4', name: 'Anita Rao', source: 'Email', value: '₹67,000', stage: 'Closed Won' },
  { id: '5', name: 'Sameer Shah', source: 'Cold Call', value: '₹31,000', stage: 'Follow Up' },
];

const stageColors: Record<string, { bg: string; text: string }> = {
  'New Lead': { bg: '#dbeafe', text: '#1d4ed8' },
  'Proposal': { bg: '#fef3c7', text: '#92400e' },
  'Negotiation': { bg: '#ede9fe', text: '#5b21b6' },
  'Follow Up': { bg: '#ffedd5', text: '#c2410c' },
  'Closed Won': { bg: '#d1fae5', text: '#065f46' },
};

export default function LeadsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 12) }]}>
        <Text style={styles.headerTitle}>Active Leads</Text>
        <Text style={styles.headerCount}>{leads.length} leads</Text>
      </View>
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const color = stageColors[item.stage] ?? { bg: '#f3f4f6', text: '#374151' };
          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.value}>{item.value}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.source}>{item.source}</Text>
                <View style={[styles.badge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.badgeText, { color: color.text }]}>{item.stage}</Text>
                </View>
              </View>
            </View>
          );
        }}
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
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    gap: 8,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#1a1a2e' },
  value: { fontFamily: 'Inter_700Bold', fontSize: 14, color: '#10b981' },
  source: { fontFamily: 'Inter_400Regular', fontSize: 12, color: '#6b7280' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
});
