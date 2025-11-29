import { useState, useEffect, useRef } from "react";
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as FileSystem from "expo-file-system/legacy";
import * as ScreenCapture from "expo-screen-capture";
import { ThemedText } from "@/components/themed-text";

const { width, height } = Dimensions.get("window");

interface OverlayImage {
  id: number;
  source: any;
  position: { x: number; y: number };
}

export default function PhotoZoneCameraScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const questId = params.questId as string;
  const questName = params.questName as string;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [overlayImages, setOverlayImages] = useState<OverlayImage[]>([]);
  const [rawPhotoUri, setRawPhotoUri] = useState<string | null>(null);
  const [combinedPhoto, setCombinedPhoto] = useState<string | null>(null);

  const cameraRef = useRef<CameraView>(null);

  // QR 코드 리스트
  const validQRCodes = ["QUEST-STAMP-001", "QUEST-STAMP-002", "QUEST-STAMP-003"];

  const characterImages = [
    require("@/assets/images/c_1.png"),
    require("@/assets/images/c_2.png"),
    require("@/assets/images/c_3.png"),
  ];

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  const onBarcodeScanned = ({ data }: any) => {
    if (scanning) return;
    setScanning(true);

    let clean = data.trim().toUpperCase();

    const index = validQRCodes.indexOf(clean);

    if (index !== -1) {
      const newOverlay: OverlayImage = {
        id: Date.now(),
        source: characterImages[index],
        position: { x: width * 0.3, y: height * 0.3 },
      };

      setOverlayImages((prev) => [...prev, newOverlay]);
      Alert.alert("QR 성공!", `캐릭터 ${index + 1} 추가됨`);
    } else {
      Alert.alert("QR 실패", "올바른 QR 코드를 스캔해주세요");
    }

    setTimeout(() => setScanning(false), 2000);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      setRawPhotoUri(photo.uri);
    } catch (e) {
      Alert.alert("오류", "사진 촬영 실패");
    }
  };

  const mergeWithScreenshot = async () => {
    try {
      const uri = await ScreenCapture.captureScreenAsync({
        quality: 0.7,
      });

      setCombinedPhoto(uri);
    } catch (e) {
      console.log("스크린샷 오류:", e);
      Alert.alert("오류", "스크린샷 실패");
    }
  };

  const goToSaveScreen = () => {
    if (!combinedPhoto) return;

    router.push({
      pathname: "/photo-zone-save",
      params: {
        photoUri: combinedPhoto,
        questId: questId,
        questName: questName,
      },
    });
  };

  // =======================
  // 촬영 후 미리보기
  // =======================
  if (rawPhotoUri && !combinedPhoto) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: rawPhotoUri }} style={styles.previewImage} />

        {/* 오버레이 이미지 */}
        {overlayImages.map((overlay) => (
          <Image
            key={overlay.id}
            source={overlay.source}
            style={[
              styles.overlayImage,
              {
                left: overlay.position.x,
                top: overlay.position.y,
              },
            ]}
          />
        ))}

        <View style={styles.previewButtons}>
          <Pressable
            style={[styles.previewButton, styles.retakeButton]}
            onPress={() => {
              setRawPhotoUri(null);
              setOverlayImages([]);
            }}
          >
            <ThemedText style={styles.previewButtonText}>다시 찍기</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.previewButton, styles.saveButton]}
            onPress={mergeWithScreenshot}
          >
            <ThemedText style={styles.previewButtonText}>확정</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  // =======================
  // 최종 저장 화면 이동
  // =======================
  if (combinedPhoto) {
    goToSaveScreen();
    return null;
  }

  // =======================
  // 기본 카메라 화면
  // =======================
  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <ThemedText style={styles.permissionText}>카메라 권한이 필요합니다.</ThemedText>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <ThemedText style={styles.permissionButtonText}>권한 허용하기</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Photo Zone</ThemedText>
      </View>

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={onBarcodeScanned}
      >
        {overlayImages.map((overlay) => (
          <Image
            key={overlay.id}
            source={overlay.source}
            style={[
              styles.overlayImage,
              { left: overlay.position.x, top: overlay.position.y },
            ]}
          />
        ))}
      </CameraView>

      <Pressable style={styles.captureButton} onPress={takePicture}>
        <View style={styles.captureInner} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A", paddingTop: 60 },
  center: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  permissionText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  permissionButton: {
    backgroundColor: "#5B7DFF",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  permissionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  camera: {
    flex: 1,
    marginHorizontal: 20,
    backgroundColor: "#000",
    borderRadius: 16,
    overflow: "hidden",
  },

  overlayImage: {
    position: "absolute",
    width: 120,
    height: 120,
    resizeMode: "contain",
  },

  captureButton: {
    alignSelf: "center",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#5B7DFF",
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  previewButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  retakeButton: { backgroundColor: "#64748B" },
  saveButton: { backgroundColor: "#5B7DFF" },
  previewButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
