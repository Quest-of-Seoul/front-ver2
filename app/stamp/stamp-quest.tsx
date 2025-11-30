import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

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
          source={require("@/assets/images/layer.png")}
          style={styles.keyHuntedBackgroundImage}
          resizeMode="cover"
        />

        {/* Content */}
        <View style={styles.keyHuntedContent}>
          <Text style={styles.keyHuntedTitle}>Key{"\n"}Hunted!</Text>

          {/* Key Image */}
          <Image
            source={require("@/assets/images/key-2.png")}
            style={styles.keyHuntedImage}
            resizeMode="contain"
          />

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
          source={require("@/assets/images/boxopen.png")}
          style={styles.boxOpenedBackgroundImage}
          resizeMode="cover"
        />

        {/* Candy Image */}
        <Image
          source={require("@/assets/images/candy.png")}
          style={styles.candyImage}
          resizeMode="contain"
        />

        {/* Candy3 Image */}
        <Image
          source={require("@/assets/images/candy 3.png")}
          style={styles.candy3Image}
          resizeMode="contain"
        />

        {/* Candy4 Image */}
        <Image
          source={require("@/assets/images/candy 4.png")}
          style={styles.candy4Image}
          resizeMode="contain"
        />

        {/* Content Overlay */}
        <View style={styles.boxOpenedContent}>
          <Text style={styles.boxOpenedTitle}>Box{"\n"}Opened!</Text>

          {/* Done Button with Points */}
          <Pressable
            style={styles.boxOpenedButton}
            onPress={() => {
              resetAllStates();
              router.back();
            }}
          >
            <Text style={styles.boxOpenedButtonText}>Done!</Text>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsPlus}>+</Text>
              <Svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                <Path
                  d="M20 6.01852V6.40604C20 6.95444 19.6761 7.42058 19.1766 7.73499C19.7955 8.2066 20.1267 8.90489 19.9385 9.56296L19.8281 9.92856C19.5241 10.9796 18.0185 11.3818 16.7518 10.753L15.6009 10.1845C15.2737 10.0249 14.9847 9.79533 14.754 9.51178C14.5684 9.77264 14.3614 10.0172 14.1351 10.243C13.5333 10.8518 12.8086 11.3225 12.0105 11.623C11.2123 11.9234 10.3595 12.0467 9.50997 11.9842C8.66045 11.9218 7.83422 11.6751 7.08756 11.2611C6.3409 10.847 5.69133 10.2753 5.18307 9.5849C4.96318 9.83235 4.69766 10.0341 4.40134 10.179L3.25044 10.7475C1.98373 11.3763 0.485391 10.9742 0.174141 9.92307L0.0637369 9.55747C-0.117222 8.90671 0.20671 8.20843 0.825589 7.7295C0.326142 7.41509 0.00221698 6.94346 0.00221698 6.40056V6.01852C0.0101927 5.75959 0.0822858 5.50681 0.211893 5.28329C0.3415 5.05976 0.524483 4.87261 0.744145 4.73893C0.201267 4.31119 -0.108158 3.68785 0.0347993 3.07548L0.121656 2.6989C0.362332 1.67158 1.75028 1.17255 3.02966 1.65697L4.224 2.11213C4.52453 2.22443 4.80229 2.39105 5.04373 2.60385C5.59192 1.79501 6.3284 1.13458 7.18842 0.680588C8.04845 0.226594 9.00569 -0.00705826 9.97604 0.00016241C10.9464 0.00738308 11.9001 0.25526 12.7534 0.722003C13.6067 1.18875 14.3335 1.86007 14.8698 2.67697C15.1289 2.42675 15.4372 2.23431 15.7746 2.11213L16.9671 1.65697C18.2483 1.17255 19.6345 1.67158 19.8751 2.6989L19.962 3.07548C20.105 3.68785 19.8009 4.31119 19.2526 4.73893C19.4733 4.87195 19.6574 5.05882 19.788 5.28239C19.9185 5.50596 19.9915 5.75907 20 6.01852Z"
                  fill="white"
                />
              </Svg>
              <Text style={styles.pointsValue}>200</Text>
            </View>
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
              <View style={styles.keyContainer}>
                {/* 베이스 key.png 이미지 */}
                <Image
                  source={require("@/assets/images/key.png")}
                  style={styles.keyIcon}
                />
                {/* 획득 시 황금 열쇠 SVG 오버레이 */}
                {keys[i] && (
                  <View style={styles.goldenKeyOverlay}>
                    <Svg
                      width="60.749"
                      height="60.749"
                      viewBox="0 0 86 86"
                      fill="none"
                    >
                      <G clipPath="url(#clip0_6_23041)">
                        <Path
                          d="M32 18.8229C38.0525 12.7706 47.8427 12.7537 53.8657 18.7766C59.8905 24.8014 59.8721 34.5939 53.8195 40.6465C53.2716 41.1944 52.2987 42.0396 51.1851 42.7713C50.0588 43.5112 48.8516 44.0926 47.8215 44.1876L47.3685 44.229L47.3678 44.6841L47.3602 47.8336V47.835C47.3585 48.7592 47.4758 49.4237 47.8698 49.8237C48.0781 50.0351 48.3252 50.133 48.5583 50.1821C48.7764 50.2279 49.0142 50.2362 49.217 50.2442L49.2177 50.2449C49.5815 50.2612 49.9338 50.277 50.3253 50.4065L50.3619 50.4183L50.4013 50.4245H50.4027C50.4061 50.4251 50.4125 50.4262 50.4213 50.4279C50.4391 50.4314 50.4674 50.4378 50.5049 50.4466C50.5801 50.4641 50.6919 50.4929 50.8287 50.537C51.1039 50.6257 51.4755 50.7741 51.8597 51.01C52.6196 51.4766 53.4216 52.2783 53.6544 53.6679C53.7708 54.4969 53.6568 55.7415 52.9604 56.7636C52.2848 57.7552 51.0069 58.6174 48.6253 58.6225H48.1281L48.126 59.1204L48.1225 60.1693L48.1212 60.6347L48.5838 60.6692C48.5842 60.6693 48.5854 60.6698 48.5873 60.6699C48.5913 60.6703 48.5988 60.6709 48.6087 60.672C48.6286 60.6741 48.6601 60.6773 48.7012 60.683C48.7839 60.6946 48.9057 60.7146 49.0548 60.7479C49.3546 60.815 49.7565 60.9346 50.17 61.1409C50.9875 61.5487 51.8302 62.2824 52.06 63.6468C52.1729 64.4526 51.9944 65.5727 51.3784 66.4801C50.7795 67.3622 49.7506 68.0698 48.079 68.0738L47.5819 68.0752L47.5798 68.5731L47.5736 72.246C47.5712 73.3302 47.091 74.0214 46.4901 74.4675C45.8764 74.9231 45.1292 75.1233 44.634 75.1649L41.5017 75.1746C40.1945 75.1769 39.4277 74.6448 38.9709 74.0097C38.4957 73.3488 38.3329 72.5397 38.3335 72.0064L38.3909 44.7075L38.3915 44.3077L38.0021 44.2193L37.9966 44.2179C37.9916 44.2168 37.9837 44.2151 37.9731 44.2124C37.9508 44.2069 37.916 44.198 37.8702 44.1855C37.7784 44.1605 37.6413 44.1204 37.4669 44.064C37.118 43.951 36.6202 43.7707 36.0341 43.5026C34.8598 42.9653 33.3416 42.0806 31.9537 40.6928C25.9289 34.668 25.9473 24.8755 32 18.8229ZM38.627 25.4513C38.063 26.0135 37.6156 26.6814 37.3095 27.4166C37.0032 28.1523 36.8441 28.9412 36.8427 29.7381C36.8412 30.5351 36.9969 31.325 37.3005 32.0618C37.6041 32.7984 38.0501 33.4681 38.6125 34.0326L38.6139 34.034C39.7542 35.1691 41.2986 35.805 42.9076 35.8017C44.5167 35.7984 46.0588 35.1558 47.1945 34.016H47.1931C48.3323 32.8804 48.9748 31.3398 48.9781 29.7312C48.9814 28.1222 48.3455 26.5778 47.2104 25.4375L47.209 25.4361C46.6445 24.8737 45.9749 24.4277 45.2382 24.1241C44.5013 23.8205 43.7115 23.6648 42.9145 23.6663C42.1178 23.6677 41.3292 23.8262 40.5937 24.1324C39.858 24.4387 39.1895 24.8868 38.627 25.4513Z"
                          fill="url(#paint0_radial_6_23041)"
                          stroke="#E7AC2A"
                        />
                      </G>
                      <Defs>
                        <RadialGradient
                          id="paint0_radial_6_23041"
                          cx="0"
                          cy="0"
                          r="1"
                          gradientUnits="userSpaceOnUse"
                          gradientTransform="translate(42.9559 42.9568) rotate(-135) scale(25.3123 25.3126)"
                        >
                          <Stop stopColor="#E7AC2A" />
                          <Stop offset="1" stopColor="#F9E92B" />
                        </RadialGradient>
                        <ClipPath id="clip0_6_23041">
                          <Rect
                            width="60.7489"
                            height="60.7489"
                            fill="white"
                            transform="translate(0 42.9561) rotate(-45)"
                          />
                        </ClipPath>
                      </Defs>
                    </Svg>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* QR Scan / See Result 버튼 - 절대위치로 하단 40px 위 */}
        <Pressable
          style={[styles.scanButton, isComplete && styles.completeButton]}
          onPress={() => {
            if (isComplete) {
              setShowBoxOpened(true);
            } else {
              setStartScreen(false);
            }
          }}
        >
          {!isComplete && (
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9 3H3V9H5V5H9V3ZM3 21V15H5V19H9V21H3ZM15 3V5H19V9H21V3H15ZM19 15H21V21H15V19H19V15ZM7 7H11V11H7V7ZM7 13H11V17H7V13ZM17 7H13V11H17V7ZM13 13H17V17H13V13Z"
                fill="white"
              />
            </Svg>
          )}
          <Text style={[styles.scanButtonText, isComplete && styles.completeButtonText]}>
            {isComplete ? "See Result" : "QR Scan"}
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
        <View style={styles.headerScanLeft}>
          <Svg width="17" height="17" viewBox="0 0 17 17" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M-4.72253e-05 11.4228C-4.6972e-05 8.52616 2.35829 6.17783 5.26662 6.17783C5.79662 6.17783 7.00496 6.29949 7.59245 6.78783L8.32745 6.05616C8.75995 5.62533 8.64329 5.49866 8.45079 5.29033C8.37079 5.20283 8.27745 5.10199 8.20496 4.95783C8.20496 4.95783 7.59246 4.10449 8.20496 3.25033C8.57245 2.76283 9.60162 2.08033 10.7766 3.25033L11.0216 3.00699C11.0216 3.00699 10.2875 2.15283 10.8991 1.29866C11.2666 0.811161 12.2466 0.323661 13.1041 1.17699L13.9608 0.32366C14.5491 -0.262173 15.2675 0.0794944 15.5525 0.32366L16.2883 1.05533C16.9741 1.73866 16.5741 2.47866 16.2883 2.76366L9.91995 9.10533C9.91995 9.10533 10.5325 10.0803 10.5325 11.422C10.5325 14.3187 8.17412 16.667 5.26579 16.667C2.35745 16.667 -4.74784e-05 14.3187 -4.72253e-05 11.4228ZM5.26579 9.59282C4.7797 9.59194 4.31316 9.78413 3.96874 10.1271C3.62432 10.4702 3.43022 10.9359 3.42912 11.422C3.42956 11.6627 3.47741 11.9011 3.56995 12.1233C3.66249 12.3456 3.7979 12.5474 3.96845 12.7174C4.139 12.8873 4.34135 13.022 4.56395 13.1137C4.78655 13.2054 5.02503 13.2524 5.26579 13.252C5.50654 13.2524 5.74503 13.2054 5.96763 13.1137C6.19023 13.022 6.39258 12.8873 6.56313 12.7174C6.73368 12.5474 6.86909 12.3456 6.96163 12.1233C7.05416 11.9011 7.10202 11.6627 7.10245 11.422C7.10135 10.9359 6.90725 10.4702 6.56283 10.1271C6.21842 9.78413 5.75187 9.59194 5.26579 9.59282Z"
              fill="white"
            />
          </Svg>
          <Text style={styles.headerScanTitle}>Code Scan</Text>
        </View>
        <Pressable
          onPress={() => {
            resetAllStates();
            router.back();
          }}
        >
          <Svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M1.82891 0.313458C1.62684 0.118289 1.35619 0.0102947 1.07527 0.0127358C0.794342 0.015177 0.525614 0.127858 0.326962 0.32651C0.128311 0.525161 0.0156299 0.793889 0.0131887 1.07481C0.0107476 1.35574 0.118742 1.62638 0.313911 1.82846L5.98498 7.49953L0.313911 13.1706C0.211579 13.2694 0.129955 13.3877 0.0738023 13.5184C0.0176498 13.6491 -0.0119069 13.7897 -0.0131431 13.932C-0.0143794 14.0742 0.0127296 14.2153 0.066602 14.347C0.120474 14.4787 0.200031 14.5983 0.300631 14.6989C0.40123 14.7995 0.520857 14.879 0.652532 14.9329C0.784206 14.9868 0.925291 15.0139 1.06756 15.0127C1.20982 15.0114 1.35041 14.9819 1.48113 14.9257C1.61185 14.8696 1.73008 14.7879 1.82891 14.6856L7.49998 9.01453L13.1711 14.6856C13.3731 14.8808 13.6438 14.9888 13.9247 14.9863C14.2056 14.9839 14.4743 14.8712 14.673 14.6726C14.8717 14.4739 14.9843 14.2052 14.9868 13.9242C14.9892 13.6433 14.8812 13.3727 14.6861 13.1706L9.01498 7.49953L14.6861 1.82846C14.8812 1.62638 14.9892 1.35574 14.9868 1.07481C14.9843 0.793889 14.8717 0.525161 14.673 0.32651C14.4743 0.127858 14.2056 0.015177 13.9247 0.0127358C13.6438 0.0102947 13.3731 0.118289 13.1711 0.313458L7.49998 5.98453L1.82891 0.313458Z"
              fill="white"
            />
          </Svg>
        </Pressable>
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
  },
  keyHuntedBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  keyHuntedContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  keyHuntedTitle: {
    marginTop: 110,
    fontSize: 48,
    fontFamily: "BagelFatOne-Regular",
    fontWeight: "400",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 48,
  },
  keyHuntedImage: {
    position: "absolute",
    top: "50%",
    marginTop: -119,
    width: 255,
    height: 238,
    aspectRatio: 15 / 14,
  },
  saveKeyButton: {
    position: "absolute",
    bottom: 40,
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 35,
    backgroundColor: "#FFF",
  },
  saveKeyText: {
    color: "#659DF2",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "700",
  },

  /* Box Opened 팝업 화면 */
  boxOpenedContainer: {
    flex: 1,
  },
  boxOpenedBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  candyImage: {
    position: "absolute",
    top: 179,
    right: 10,
    zIndex: 9999,
  },
  candy3Image: {
    position: "absolute",
    top: 237,
    left: 10,
    zIndex: 9999,
  },
  candy4Image: {
    position: "absolute",
    top: 75,
    left: 60,
    zIndex: 9999,
  },
  boxOpenedContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
  },
  boxOpenedTitle: {
    marginTop: 110,
    fontSize: 48,
    fontFamily: "BagelFatOne-Regular",
    fontWeight: "400",
    color: "#FFF",
    textAlign: "center",
    lineHeight: 48,
  },
  boxOpenedButton: {
    position: "absolute",
    bottom: 40,
    flexDirection: "row",
    width: 320,
    height: 50,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 35,
    backgroundColor: "#76C7AD",
  },
  boxOpenedButtonText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "700",
  },
  pointsBadge: {
    flexDirection: "row",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    gap: 2,
  },
  pointsPlus: {
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
  },
  pointsValue: {
    color: "#FFF",
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 16,
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
    zIndex: 2,
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
    bottom: 300,
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
  keyContainer: {
    position: "relative",
    width: 60,
    height: 60,
  },
  keyIcon: {
    width: 60,
    height: 60,
  },
  goldenKeyOverlay: {
    position: "absolute",
    top: -25,
    left: 0,
    width: 60.749,
    height: 60.749,
    justifyContent: "center",
    alignItems: "center",
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
  completeButton: {
    backgroundColor: "#FFF",
  },
  scanButtonText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
  },
  completeButtonText: {
    color: "#659DF2",
    fontFamily: "Inter",
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
  headerScanLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerScanTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
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
