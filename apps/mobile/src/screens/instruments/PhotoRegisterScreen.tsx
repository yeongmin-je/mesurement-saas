import { View, Text, StyleSheet } from 'react-native';

// Week 7: Expo Camera + AI recognition flow lands here.
export function PhotoRegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>사진 등록 화면</Text>
      <Text style={styles.body}>Week 7에 Expo Camera 통합과 AI 인식 플로우를 구현합니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#f8fafc', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginTop: 32 },
  body: { color: '#475569', marginTop: 8, textAlign: 'center' },
});
