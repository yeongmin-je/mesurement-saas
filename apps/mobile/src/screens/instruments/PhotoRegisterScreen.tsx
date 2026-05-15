import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Camera, requestCameraPermissionsAsync, getCameraPermissionsAsync } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { apiClient } from '../../lib/api-client';
import { uploadToPresignedUrl } from '../../lib/upload';

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoRegister'>;

interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  photoId: string;
  expiresIn: number;
}

interface Suggestion<T> {
  value: T;
  confidence: number;
  alternatives: Array<{ value: T; confidence: number }>;
}

interface RecognitionResponse {
  recognitionId: string;
  confidence: number;
  suggestions: {
    category: Suggestion<{ id: number; name: string }> | null;
    manufacturer: Suggestion<{ id: number; name: string }> | null;
    model: Suggestion<{ id: number; name: string }> | null;
    serialNumber: Suggestion<string> | null;
    accuracyClass: Suggestion<string> | null;
  };
  uploadedPhotos: Array<{ photoId: string; s3Key: string; previewUrl: string }>;
  rawText: string;
}

type Phase = 'permission' | 'capture' | 'uploading' | 'recognizing' | 'review' | 'submitting';

export function PhotoRegisterScreen({ navigation }: Props) {
  const cameraRef = useRef<Camera>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>('permission');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<RecognitionResponse | null>(null);
  const [photoIds, setPhotoIds] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const status = await getCameraPermissionsAsync();
      setPermissionGranted(status.granted);
      if (status.granted) setPhase('capture');
    })();
  }, []);

  async function requestPermission(): Promise<void> {
    const status = await requestCameraPermissionsAsync();
    setPermissionGranted(status.granted);
    if (status.granted) setPhase('capture');
  }

  async function onCapture() {
    if (!cameraRef.current) return;
    try {
      const picture = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (!picture?.uri) throw new Error('촬영 실패');

      // Preprocess: max 1920px width, JPEG 80%
      const compressed = await manipulateAsync(
        picture.uri,
        [{ resize: { width: 1920 } }],
        { compress: 0.8, format: SaveFormat.JPEG },
      );

      setPreviewUri(compressed.uri);
      setPhase('uploading');

      // 1) Issue presigned upload URL
      const { uploadUrl, photoId } = await apiClient.post<UploadUrlResponse>('/photos/upload', {
        fileName: `nameplate-${Date.now()}.jpg`,
        contentType: 'image/jpeg',
      });

      // 2) PUT to S3
      await uploadToPresignedUrl(uploadUrl, compressed.uri, 'image/jpeg');

      const ids = [photoId];
      setPhotoIds(ids);
      setPhase('recognizing');

      // 3) Call AI
      const result = await apiClient.post<RecognitionResponse>('/ai/recognize-instrument', {
        photoIds: ids,
      });
      setRecognition(result);
      setPhase('review');
    } catch (err) {
      Alert.alert('오류', err instanceof Error ? err.message : '알 수 없는 오류');
      setPhase('capture');
    }
  }

  async function onConfirm() {
    if (!recognition) return;
    setPhase('submitting');
    try {
      const created = await apiClient.post<{ id: string }>('/instruments', {
        kolasCategoryId: recognition.suggestions.category?.value.id,
        manufacturerId: recognition.suggestions.manufacturer?.value.id,
        modelId: recognition.suggestions.model?.value.id,
        serialNumber: recognition.suggestions.serialNumber?.value,
        accuracyClass: recognition.suggestions.accuracyClass?.value,
        photoIds,
        aiRecognition: { recognitionId: recognition.recognitionId, confidence: recognition.confidence },
      });
      Alert.alert('등록 완료', `관리번호로 등록되었습니다.`, [
        { text: '확인', onPress: () => navigation.replace('Home') },
      ]);
    } catch (err) {
      Alert.alert('등록 실패', err instanceof Error ? err.message : '알 수 없는 오류');
      setPhase('review');
    }
  }

  if (permissionGranted === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permissionGranted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>카메라 권한이 필요합니다</Text>
        <Text style={styles.sub}>측정기 명판을 인식하려면 카메라 접근 권한이 필요합니다.</Text>
        <Pressable style={styles.primary} onPress={requestPermission}>
          <Text style={styles.primaryText}>권한 허용</Text>
        </Pressable>
      </View>
    );
  }

  if (phase === 'capture') {
    return (
      <View style={styles.cameraContainer}>
        <Camera ref={cameraRef} style={StyleSheet.absoluteFillObject} type={'back' as never} />
        <View style={styles.overlay}>
          <View style={styles.guideBox} />
          <Text style={styles.hint}>명판이 가이드 박스 안에 들어오게 촬영하세요</Text>
        </View>
        <Pressable style={styles.shutter} onPress={onCapture}>
          <View style={styles.shutterInner} />
        </Pressable>
      </View>
    );
  }

  if (phase === 'uploading' || phase === 'recognizing' || phase === 'submitting') {
    return (
      <View style={styles.center}>
        {previewUri && <Image source={{ uri: previewUri }} style={styles.preview} />}
        <ActivityIndicator size="large" color="#1d4ed8" style={{ marginTop: 16 }} />
        <Text style={styles.statusText}>
          {phase === 'uploading'
            ? '사진 업로드 중...'
            : phase === 'recognizing'
              ? 'AI 인식 중...'
              : '등록 중...'}
        </Text>
      </View>
    );
  }

  if (phase === 'review' && recognition) {
    return (
      <View style={styles.reviewContainer}>
        <Text style={styles.title}>인식 결과</Text>
        <ConfidenceBadge value={recognition.confidence} />
        {previewUri && <Image source={{ uri: previewUri }} style={styles.previewSmall} />}

        <ResultRow label="카테고리" suggestion={recognition.suggestions.category} />
        <ResultRow label="제조사" suggestion={recognition.suggestions.manufacturer} />
        <ResultRow label="모델" suggestion={recognition.suggestions.model} />
        <ResultRow
          label="시리얼"
          suggestion={
            recognition.suggestions.serialNumber
              ? {
                  value: { id: 0, name: recognition.suggestions.serialNumber.value },
                  confidence: recognition.suggestions.serialNumber.confidence,
                  alternatives: [],
                }
              : null
          }
        />

        <View style={styles.actions}>
          <Pressable style={[styles.secondary, { flex: 1 }]} onPress={() => setPhase('capture')}>
            <Text style={styles.secondaryText}>다시 촬영</Text>
          </Pressable>
          <Pressable style={[styles.primary, { flex: 1 }]} onPress={onConfirm}>
            <Text style={styles.primaryText}>확인하고 등록</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <View style={styles.center}><Text>준비 중...</Text></View>;
}

function ConfidenceBadge({ value }: { value: number }) {
  const tone = value >= 90 ? '#22c55e' : value >= 60 ? '#f59e0b' : '#ef4444';
  const label = value >= 90 ? '높음' : value >= 60 ? '보통' : '낮음 — 직접 확인 필요';
  return (
    <View style={[styles.badge, { backgroundColor: tone }]}>
      <Text style={styles.badgeText}>신뢰도 {value}% · {label}</Text>
    </View>
  );
}

function ResultRow({
  label,
  suggestion,
}: {
  label: string;
  suggestion: Suggestion<{ id: number; name: string }> | null;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {suggestion ? `${suggestion.value.name} (${suggestion.confidence}%)` : '인식 실패'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8fafc' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  sub: { color: '#475569', textAlign: 'center', marginBottom: 24 },
  cameraContainer: { flex: 1, backgroundColor: 'black' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  guideBox: {
    width: '80%', height: '40%', borderWidth: 2, borderColor: '#fff', borderRadius: 12,
  },
  hint: { color: '#fff', marginTop: 16, fontSize: 14 },
  shutter: {
    position: 'absolute', bottom: 48, alignSelf: 'center',
    width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  preview: { width: 240, height: 240, borderRadius: 8 },
  previewSmall: { width: 120, height: 120, borderRadius: 8, marginVertical: 12 },
  statusText: { marginTop: 12, color: '#475569' },
  reviewContainer: { flex: 1, padding: 24, backgroundColor: '#f8fafc' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, alignSelf: 'flex-start', marginVertical: 12 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  rowLabel: { fontWeight: '600' },
  rowValue: { color: '#475569', flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  primary: { backgroundColor: '#1d4ed8', padding: 14, borderRadius: 8, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '600' },
  secondary: { backgroundColor: '#e2e8f0', padding: 14, borderRadius: 8, alignItems: 'center' },
  secondaryText: { color: '#1e293b', fontWeight: '600' },
});
