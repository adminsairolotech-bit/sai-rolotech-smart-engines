import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { PRIVACY_URL } from '@/lib/app-info';

const items = [
  'Mobile app login session secure local storage me store hota hai.',
  'App ko sirf wahi permissions maangni chahiye jo current shipped features ko zaroori hon.',
  'Support aur account deletion options app ke andar accessible hone chahiye.',
  'Live CRM data sirf authorized backend ke through load hona chahiye.',
  'Privacy disclosures ko actual implementation ke saath aligned rehna chahiye.',
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>{'<'} Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Privacy Summary</Text>
      <Text style={styles.subtitle}>
        Yeh in-app privacy summary users ko clear batati hai ki current mobile build kis principle par kaam karti hai.
      </Text>

      <View style={styles.card}>
        {items.map((item) => (
          <Text key={item} style={styles.bullet}>- {item}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.linkBtn} onPress={() => Linking.openURL(PRIVACY_URL)}>
        <Text style={styles.linkBtnText}>Full Privacy Policy Kholen</Text>
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
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  bullet: { fontFamily: 'Inter_400Regular', fontSize: 13, color: '#374151', lineHeight: 20 },
  linkBtn: { backgroundColor: '#667eea', borderRadius: 12, padding: 15, alignItems: 'center' },
  linkBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
