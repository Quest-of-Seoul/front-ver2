import { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function StampQuestScreen() {
  const router = useRouter();

  const [stamps, setStamps] = useState([false, false, false]);
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);
  const [giftVisible, setGiftVisible] = useState(false);
  const [currentStamp, setCurrentStamp] = useState<number | null>(null);
  const [lastScanned, setLastScanned] = useState<string>(''); // 디버깅용

  // 카메라 권한
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // 유효한 QR 코드 목록
  const validQRCodes = [
    "QUEST-STAMP-001",
    "QUEST-STAMP-002", 
    "QUEST-STAMP-003"
  ];

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  // QR 인식 시 호출
  const onBarcodeScanned = ({ data }: any) => {
    if (scanning) return; // 중복 스캔 방지
    setScanning(true);

    // 디버깅: 스캔된 값 저장 (공백 제거 전)
    setLastScanned(data);
    console.log("Scanned RAW:", JSON.stringify(data));
    console.log("Scanned Length:", data.length);

    // 공백 제거 및 대소문자 통일
    let cleanData = data.trim().toUpperCase();
    
    // URL 프리픽스 제거 (https://, http://, www. 등)
    cleanData = cleanData
      .replace(/^HTTPS?:\/\//i, '')  // https:// 또는 http:// 제거
      .replace(/^WWW\./i, '');        // www. 제거
    
    console.log("Scanned CLEAN:", JSON.stringify(cleanData));

    // 이미 스캔한 QR 코드인지 확인
    if (scannedCodes.includes(cleanData)) {
      alert("이미 스캔한 QR 코드입니다!");
      setTimeout(() => setScanning(false), 1500);
      return;
    }

    // 유효한 QR 코드인지 확인
    const stampIndex = validQRCodes.indexOf(cleanData);
    if (stampIndex !== -1) {
      setCurrentStamp(stampIndex);
      setScannedCodes([...scannedCodes, cleanData]);
      setGiftVisible(true);
    } else {
      alert(`올바르지 않은 QR 코드입니다.\n스캔된 값: "${cleanData}"`);
    }

    setTimeout(() => setScanning(false), 1500);
  };

  const openGift = () => {
    if (currentStamp === null) return;

    const newStamps = [...stamps];
    newStamps[currentStamp] = true;
    setStamps(newStamps);

    setGiftVisible(false);
    setCurrentStamp(null);
  };

  const isComplete = stamps.every(s => s);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>카메라 권한이 필요합니다.</Text>
        <Pressable style={styles.scanButton} onPress={requestPermission}>
          <Text style={{ color: "#fff" }}>권한 허용하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Stamp Quest</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Stamps */}
      <View style={styles.stampArea}>
        {stamps.map((done, i) => (
          <View key={i} style={[styles.stamp, done && styles.stampFilled]}>
            <Text style={styles.stampText}>{done ? "✓" : i + 1}</Text>
          </View>
        ))}
      </View>
      
      {/* Progress Text */}
      <Text style={styles.progressText}>
        {scannedCodes.length} / 3 장소 방문 완료
      </Text>
      
      {/* Debug Info */}
      {lastScanned && (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>마지막 스캔:</Text>
          <Text style={styles.debugText}>"{lastScanned}"</Text>
          <Text style={styles.debugHint}>길이: {lastScanned.length}자</Text>
        </View>
      )}

      {/* Camera Zone */}
      {!giftVisible && !isComplete && (
        <View style={{ marginTop: 20, height: 260, borderRadius: 12, overflow: 'hidden' }}>
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            onBarcodeScanned={onBarcodeScanned}
          />
        </View>
      )}

      {/* Gift Popup */}
      {giftVisible && (
        <View style={styles.giftPopup}>
          <View style={styles.giftBox}>
            <Text style={styles.giftEmoji}>🎁</Text>
          </View>
          <Pressable style={styles.openGiftButton} onPress={openGift}>
            <Text style={styles.openGiftText}>Open Gift</Text>
          </Pressable>
        </View>
      )}

      {/* Completion */}
      {isComplete && (
        <View style={styles.completeBox}>
          <Text style={styles.completeText}>🎉 Quest Complete!</Text>
          <Pressable
            style={styles.finishButton}
            onPress={() => router.push('/(tabs)/map')}
          >
            <Text style={styles.finishText}>Finish</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  stampArea: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stamp: {
    width: 70,
    height: 70,
    borderWidth: 2,
    borderColor: '#64748B',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampFilled: {
    backgroundColor: '#5B7DFF',
    borderColor: '#5B7DFF',
  },
  stampText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  scanButton: {
    marginTop: 20,
    backgroundColor: '#5B7DFF',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  giftPopup: {
    marginTop: 40,
    alignItems: 'center',
  },
  giftBox: {
    width: 140,
    height: 140,
    backgroundColor: '#FF884D',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  giftEmoji: {
    fontSize: 80,
  },
  openGiftButton: {
    backgroundColor: '#FF884D',
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 12,
  },
  openGiftText: {
    color: '#fff',
    fontWeight: '700',
  },
  completeBox: {
    marginTop: 60,
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
  },
  finishButton: {
    backgroundColor: '#5B7DFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  finishText: {
    color: '#fff',
    fontWeight: '700',
  },
  debugBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  debugTitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  debugText: {
    color: '#FFA500',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugHint: {
    color: '#64748B',
    fontSize: 11,
  },
});

