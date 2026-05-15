import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>안녕하세요 👋</Text>
      <Text style={styles.sub}>측정기를 사진으로 빠르게 등록해보세요.</Text>

      <Pressable style={styles.primary} onPress={() => navigation.navigate('PhotoRegister')}>
        <Text style={styles.primaryText}>📷 사진으로 측정기 등록</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  heading: { fontSize: 24, fontWeight: '700', marginTop: 16 },
  sub: { color: '#475569', marginTop: 8, marginBottom: 32 },
  primary: { backgroundColor: '#1d4ed8', padding: 16, borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
