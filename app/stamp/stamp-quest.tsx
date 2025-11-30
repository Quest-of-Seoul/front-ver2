import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

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
  const [lastScanned, setLastScanned] = useState<string>("");

  // 카메라 권한
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // 모든 키가 수집되었는지 확인
  const isComplete = keys.every((k) => k === true);

  const validQRCodes = [
    "QUEST-STAMP-001", // → key1
    "QUEST-STAMP-002", // → key2
    "QUEST-STAMP-003", // → key3
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
    setLastScanned("");
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
    let clean = data
      .trim()
      .toUpperCase()
      .replace(/^HTTPS?:\/\//i, "")
      .replace(/^WWW\./i, "");

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
      alert(
        `잘못된 QR 코드입니다.\n\n원본: "${data}"\n정제: "${clean}"\n\n올바른 형식:\nQUEST-STAMP-001\nQUEST-STAMP-002\nQUEST-STAMP-003`
      );
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
          source={require("@/assets/images/keysave.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Content Overlay */}
        <View style={styles.keyHuntedContent}>
          <Text style={styles.keyHuntedTitle}>Key{"\n"}Hunted!</Text>

          {/* Save the Key Button */}
          <Pressable style={styles.saveKeyButton} onPress={handleSaveKey}>
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
          source={require("@/assets/images/background.jpg")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        {/* Content Overlay */}
        <View style={styles.boxOpenedContent}>
          <Text style={styles.boxOpenedTitle}>Box{"\n"}Opened!</Text>

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
        {/* 하단 그라디언트 배경 (z-index 가장 낮음) */}
        <LinearGradient
          colors={["#FEF5E7", "#34495E"]}
          locations={[0.426, 1]}
          style={styles.bottomGradient}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M-4.72253e-05 11.4228C-4.6972e-05 8.52616 2.35829 6.17783 5.26662 6.17783C5.79662 6.17783 7.00496 6.29949 7.59245 6.78783L8.32745 6.05616C8.75995 5.62533 8.64329 5.49866 8.45079 5.29033C8.37079 5.20283 8.27745 5.10199 8.20496 4.95783C8.20496 4.95783 7.59246 4.10449 8.20496 3.25033C8.57245 2.76283 9.60162 2.08033 10.7766 3.25033L11.0216 3.00699C11.0216 3.00699 10.2875 2.15283 10.8991 1.29866C11.2666 0.811161 12.2466 0.323661 13.1041 1.17699L13.9608 0.32366C14.5491 -0.262173 15.2675 0.0794944 15.5525 0.32366L16.2883 1.05533C16.9741 1.73866 16.5741 2.47866 16.2883 2.76366L9.91995 9.10533C9.91995 9.10533 10.5325 10.0803 10.5325 11.422C10.5325 14.3187 8.17412 16.667 5.26579 16.667C2.35745 16.667 -4.74784e-05 14.3187 -4.72253e-05 11.4228ZM5.26579 9.59282C4.7797 9.59194 4.31316 9.78413 3.96874 10.1271C3.62432 10.4702 3.43022 10.9359 3.42912 11.422C3.42956 11.6627 3.47741 11.9011 3.56995 12.1233C3.66249 12.3456 3.7979 12.5474 3.96845 12.7174C4.139 12.8873 4.34135 13.022 4.56395 13.1137C4.78655 13.2054 5.02503 13.2524 5.26579 13.252C5.50654 13.2524 5.74503 13.2054 5.96763 13.1137C6.19023 13.022 6.39258 12.8873 6.56313 12.7174C6.73368 12.5474 6.86909 12.3456 6.96163 12.1233C7.05416 11.9011 7.10202 11.6627 7.10245 11.422C7.10135 10.9359 6.90725 10.4702 6.56283 10.1271C6.21842 9.78413 5.75187 9.59194 5.26579 9.59282Z"
                fill="white"
              />
            </Svg>
            <Text style={styles.placeName}>Gyeongbokgung Palace</Text>
          </View>
          <Pressable
            onPress={() => {
              resetAllStates();
              router.back();
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* 타이틀 */}
        <Text style={styles.mainTitle}>
          Find QR Codes{"\n"}to open treasure box
        </Text>

        {/* 캐릭터 */}
        <Image
          source={require("@/assets/images/treasurehunt.png")}
          style={styles.tiger}
          resizeMode="contain"
        />

        {/* 보물상자 */}
        <View style={styles.treasureBoxContainer}>
          <Image
            source={require("@/assets/images/treasurebox.png")}
            style={styles.treasureBox}
            resizeMode="contain"
          />
        </View>

        {/* Keys 1~3 클릭 가능하지만 동작 없음 */}
        <View style={styles.keyRow}>
          {[0, 1, 2].map((i) => (
            <Pressable key={i} onPress={() => {}} style={styles.keyPressable}>
              <Image
                source={
                  keys[i]
                    ? require("@/assets/images/key2.png")
                    : require("@/assets/images/key.png")
                }
                style={styles.keyIcon}
              />
            </Pressable>
          ))}
        </View>

        {/* QR Scan / Done! 버튼 - 절대위치로 하단 40px 위 */}
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
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 3H3V9H5V5H9V3ZM3 21V15H5V19H9V21H3ZM15 3V5H19V9H21V3H15ZM19 15H21V21H15V19H19V15ZM7 7H11V11H7V7ZM7 13H11V17H7V13ZM17 7H13V11H17V7ZM13 13H17V17H13V13Z"
              fill="white"
            />
          </Svg>
          <Text style={styles.scanButtonText}>
            {isComplete ? "Done!" : "QR Scan"}
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
    backgroundColor: "#000",
  },
  keyHuntedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  keyHuntedTitle: {
    fontSize: 56,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 280,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    lineHeight: 64,
  },
  saveKeyButton: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  saveKeyText: {
    color: "#5B7DFF",
    fontSize: 18,
    fontWeight: "700",
  },

  /* Box Opened 팝업 화면 */
  boxOpenedContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  boxOpenedContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  boxOpenedTitle: {
    fontSize: 56,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 280,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    lineHeight: 64,
  },
  seeResultButton: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: "#fff",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  seeResultText: {
    color: "#5B7DFF",
    fontSize: 18,
    fontWeight: "700",
  },

  /* 첫 화면 */
  startContainer: {
    flex: 1,
    backgroundColor: "#34495E",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 91,
    left: 0,
    right: 0,
    height: 223,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  placeName: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
  },
  mainTitle: {
    textAlign: "center",
    fontFamily: "Pretendard",
    fontSize: 18,
    fontWeight: "400",
    color: "#FFF",
    marginTop: 53,
    marginBottom: 8,
  },
  tiger: {
    position: "absolute",
    left: 24,
    bottom: 270,
    width: 247,
    height: 242,
    aspectRatio: 247 / 242,
    zIndex: 1,
  },
  treasureBoxContainer: {
    position: "absolute",
    left: 205,
    bottom: 260,
    zIndex: 1000,
  },
  treasureBox: {
    width: 135,
    height: 113,
    aspectRatio: 135 / 113,
  },
  keyRow: {
    position: "absolute",
    bottom: 174,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
    zIndex: 999,
  },
  keyPressable: {
    padding: 4,
  },
  keyIcon: {
    width: 60,
    height: 60,
  },
  scanButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 35,
    backgroundColor: "#FF7F50",
  },
  doneButton: {
    backgroundColor: "#5B7DFF",
  },
  scanButtonText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "700",
  },

  /* 카메라 화면 */
  cameraContainer: {
    flex: 1,
    backgroundColor: "#0F172A",
    paddingTop: 70,
    paddingHorizontal: 20,
  },
  headerScan: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  progressText: {
    color: "#94A3B8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
  },
  debugBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#334155",
  },
  debugTitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  debugText: {
    color: "#FFA500",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  debugHint: {
    color: "#64748B",
    fontSize: 11,
  },
  cameraBox: {
    marginTop: 20,
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },

  center: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
});
