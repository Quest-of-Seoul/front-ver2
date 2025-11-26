import { useState, useEffect } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function StampQuestScreen() {
  const router = useRouter();

  // 첫 화면 여부
  const [startScreen, setStartScreen] = useState(true);

  // key 이미지 상태 (false=key.png / true=key2.png)
  const [keys, setKeys] = useState([false, false, false]);

  // 스캔된 QR 코드 추적 (중복 방지)
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);

  // Box Opened 팝업 화면
  const [showBoxOpened, setShowBoxOpened] = useState(false);

  // Key Hunted 팝업 화면
  const [showKeyHunted, setShowKeyHunted] = useState(false);
  const [currentKeyIndex, setCurrentKeyIndex] = useState<number | null>(null);

  // 디버깅용
  const [lastScanned, setLastScanned] = useState<string>('');

  // 카메라 권한
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // 모든 키가 수집되었는지 확인
  const isComplete = keys.every(k => k === true);

  const validQRCodes = [
    "QUEST-STAMP-001", // → key1
    "QUEST-STAMP-002", // → key2
    "QUEST-STAMP-003"  // → key3
  ];

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  /** ------------------------------------
   * 모든 상태 초기화
   * ------------------------------------ */
  const resetAllStates = () => {
    setKeys([false, false, false]);
    setScannedCodes([]);
    setLastScanned('');
    setStartScreen(true);
    setShowBoxOpened(false);
    setShowKeyHunted(false);
    setCurrentKeyIndex(null);
    setScanning(false);
  };

  /** ------------------------------------
   * QR 스캔 핸들러
   * ------------------------------------ */
  const onBarcodeScanned = ({ data }: any) => {
    if (scanning) return;
    setScanning(true);

    // 디버깅: 원본 데이터 저장
    setLastScanned(data);
    console.log("🔍 RAW QR:", JSON.stringify(data));
    console.log("📏 길이:", data.length);

    // 공백 제거 및 대소문자 통일
    let clean = data.trim().toUpperCase()
      .replace(/^HTTPS?:\/\//i, '')
      .replace(/^WWW\./i, '');

    console.log("✅ CLEAN QR:", JSON.stringify(clean));

    // 이미 스캔한 QR 코드인지 확인 (중복 방지)
    if (scannedCodes.includes(clean)) {
      console.log("⚠️ 중복 스캔:", clean);
      setScanning(false);
      return;
    }

    const index = validQRCodes.indexOf(clean);

    if (index !== -1) {
      // 스캔 성공 - Key Hunted 화면으로 이동
      setCurrentKeyIndex(index);
      setScannedCodes([...scannedCodes, clean]);
      setShowKeyHunted(true);
    } else {
      alert(`잘못된 QR 코드입니다.\n\n원본: "${data}"\n정제: "${clean}"\n\n올바른 형식:\nQUEST-STAMP-001\nQUEST-STAMP-002\nQUEST-STAMP-003`);
    }

    setTimeout(() => setScanning(false), 1200);
  };

  /** ------------------------------------
   * Save the Key 핸들러
   * ------------------------------------ */
  const handleSaveKey = () => {
    if (currentKeyIndex === null) return;

    // key 이미지 변경
    const newKeys = [...keys];
    newKeys[currentKeyIndex] = true;
    setKeys(newKeys);

    // 첫 화면으로 복귀
    setShowKeyHunted(false);
    setCurrentKeyIndex(null);
    setStartScreen(true);
  };

  /** ------------------------------------
   *  🔑 Key Hunted 팝업 화면
   * ------------------------------------ */
  if (showKeyHunted) {
    return (
      <View style={styles.keyHuntedContainer}>
        {/* Background Image */}
        <Image
          source={require('@/assets/images/keysave.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Content Overlay */}
        <View style={styles.keyHuntedContent}>
          <Text style={styles.keyHuntedTitle}>Key{'\n'}Hunted!</Text>
          
          {/* Save the Key Button */}
          <Pressable
            style={styles.saveKeyButton}
            onPress={handleSaveKey}
          >
            <Text style={styles.saveKeyText}>Save the Key</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /** ------------------------------------
   *  🎉 Box Opened 팝업 화면
   * ------------------------------------ */
  if (showBoxOpened) {
    return (
      <View style={styles.boxOpenedContainer}>
        {/* Background Image */}
        <Image
          source={require('@/assets/images/background.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Content Overlay */}
        <View style={styles.boxOpenedContent}>
          <Text style={styles.boxOpenedTitle}>Box{'\n'}Opened!</Text>
          
          {/* See Result Button */}
          <Pressable
            style={styles.seeResultButton}
            onPress={() => {
              resetAllStates();
              router.back();
            }}
          >
            <Text style={styles.seeResultText}>See Result</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  /** ------------------------------------
   *  🔥 첫 화면
   * ------------------------------------ */
  if (startScreen) {
    return (
      <View style={styles.startContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.placeName}>Gyeongbokgung Palace</Text>
          <Pressable onPress={() => {
            resetAllStates();
            router.back();
          }}>
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* 타이틀 */}
        <Text style={styles.mainTitle}>
          Find QR Codes{'\n'}to open treasure box
        </Text>

        {/* 캐릭터 */}
        <Image
          source={require('@/assets/images/treasurehunt.png')}
          style={styles.tiger}
          resizeMode="contain"
        />

        {/* 보물상자 */}
        <View style={styles.treasureBoxContainer}>
          <Image
            source={require('@/assets/images/treasurebox.png')}
            style={styles.treasureBox}
            resizeMode="contain"
          />
        </View>

        {/* Keys 1~3 클릭 가능하지만 동작 없음 */}
        <View style={styles.keyRow}>
          {[0, 1, 2].map((i) => (
            <Pressable
              key={i}
              onPress={() => {}}
              style={styles.keyPressable}
            >
              <Image
                source={
                  keys[i]
                    ? require('@/assets/images/key2.png')
                    : require('@/assets/images/key.png')
                }
                style={styles.keyIcon}
              />
            </Pressable>
          ))}
        </View>

        {/* QR Scan / Done! 버튼 */}
        <Pressable
          style={[styles.scanButton, isComplete && styles.doneButton]}
          onPress={() => {
            if (isComplete) {
              setShowBoxOpened(true);
            } else {
              setStartScreen(false);
            }
          }}
        >
          <Text style={styles.scanButtonText}>
            {isComplete ? 'Done!' : 'QR Scan'}
          </Text>
        </Pressable>
      </View>
    );
  }

  /** ------------------------------------
   * 🔍 카메라 스캔 화면
   * ------------------------------------ */
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>카메라 권한이 필요합니다.</Text>
        <Pressable style={styles.scanButton} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>권한 허용하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      {/* Header */}
      <View style={styles.headerScan}>
        <Pressable onPress={() => setStartScreen(true)}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>QR Scan</Text>
        <View style={{ width: 26 }} />
      </View>

      {/* Progress */}
      <Text style={styles.progressText}>
        {scannedCodes.length} / 3 장소 스캔 완료
      </Text>

      {/* Debug Info */}
      {lastScanned && (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>마지막 스캔:</Text>
          <Text style={styles.debugText}>"{lastScanned}"</Text>
          <Text style={styles.debugHint}>길이: {lastScanned.length}자</Text>
        </View>
      )}

      {/* Camera */}
      <View style={styles.cameraBox}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={onBarcodeScanned}
        />
      </View>
    </View>
  );
}

/* -----------------------------------
 *          STYLES
 * ----------------------------------- */
const styles = StyleSheet.create({
  /* Key Hunted 팝업 화면 */
  keyHuntedContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyHuntedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  keyHuntedTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 280,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    lineHeight: 64,
  },
  saveKeyButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  saveKeyText: {
    color: '#5B7DFF',
    fontSize: 18,
    fontWeight: '700',
  },

  /* Box Opened 팝업 화면 */
  boxOpenedContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  boxOpenedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  boxOpenedTitle: {
    fontSize: 56,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 280,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    lineHeight: 64,
  },
  seeResultButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  seeResultText: {
    color: '#5B7DFF',
    fontSize: 18,
    fontWeight: '700',
  },

  /* 첫 화면 */
  startContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  placeName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  mainTitle: {
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    marginTop: 24,
    marginBottom: 8,
    lineHeight: 24,
    fontWeight: '600',
  },
  tiger: {
    width: '100%',
    height: 180,
    marginTop: 0,
    marginBottom: 10,
  },
  treasureBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingLeft: 40,
  },
  treasureBox: {
    width: 110,
    height: 110,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 20,
  },
  keyPressable: {
    padding: 4,
  },
  keyIcon: {
    width: 60,
    height: 60,
  },
  scanButton: {
    marginTop: 32,
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
  },
  doneButton: {
    backgroundColor: '#5B7DFF',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* 카메라 화면 */
  cameraContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  headerScan: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  progressText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  debugBox: {
    marginTop: 16,
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
  cameraBox: {
    marginTop: 20,
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
  },

  center: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
