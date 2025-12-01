import { View, Image, StyleSheet, Pressable, ScrollView, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";

export default function DayPassScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("@/assets/images/daypass.jpg")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["rgba(52, 73, 94, 0.00)", "#34495E"]}
          locations={[0, 1]}
          style={styles.gradient}
        >
          <ScrollView style={styles.scrollContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <Path
                    d="M10.4884 2.15533C10.1759 1.84274 9.75207 1.66709 9.31008 1.66699H3.33341C2.89139 1.66699 2.46746 1.84259 2.1549 2.15515C1.84234 2.46771 1.66675 2.89163 1.66675 3.33366V9.31033C1.66684 9.75232 1.8425 10.1762 2.15508 10.4887L8.82175 17.1553C9.13429 17.4678 9.55814 17.6433 10.0001 17.6433C10.442 17.6433 10.8659 17.4678 11.1784 17.1553L17.1551 11.1787C17.4675 10.8661 17.6431 10.4423 17.6431 10.0003C17.6431 9.55839 17.4675 9.13454 17.1551 8.82199L10.4884 2.15533ZM5.83341 7.50033C5.39128 7.50021 4.96729 7.32447 4.65473 7.01175C4.34217 6.69904 4.16664 6.27496 4.16675 5.83283C4.16686 5.39069 4.3426 4.9667 4.65532 4.65414C4.96804 4.34158 5.39211 4.16605 5.83425 4.16616C6.27639 4.16627 6.70037 4.34201 7.01293 4.65473C7.32549 4.96745 7.50103 5.39152 7.50091 5.83366C7.5008 6.2758 7.32506 6.69978 7.01234 7.01234C6.69963 7.3249 6.27555 7.50044 5.83341 7.50033Z"
                    fill="white"
                  />
                </Svg>
                <ThemedText style={styles.headerTitle}>Day Pass Purchase</ThemedText>
              </View>
              <Pressable onPress={() => router.back()}>
                <Ionicons name="close" size={26} color="#fff" />
              </Pressable>
            </View>

            {/* Title */}
            <View style={styles.titleBox}>
              <ThemedText style={styles.title}>Your best choice{'\n'}for Seoul Tour</ThemedText>
            </View>

            {/* Main Title */}
            <View style={styles.mainTitleBox}>
              <ThemedText style={styles.mainTitle}>Quest of Seoul{'\n'}Day Pass Trials</ThemedText>
              <Image
                source={require("@/assets/images/main-2.png")}
                style={styles.mainIcon}
                resizeMode="contain"
              />
            </View>

            {/* 3-day pass option */}
            <View style={styles.passCard}>
              <ThemedText style={styles.passTitle}>3 Day</ThemedText>

              <View style={styles.passDescContainer}>
                <View style={styles.passDescRow}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M11 15H6L13 1V9H18L11 23V15Z" fill="white"/>
                  </Svg>
                  <ThemedText style={styles.passDesc}>Mint 1.3X collects</ThemedText>
                </View>

                <View style={styles.passDescRow}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M17 7C14.906 7 13.389 8.567 11.999 10.346C10.609 8.567 9.09301 7 7.00001 7C4.24301 7 2.00001 9.243 2.00001 12C1.99841 12.6561 2.12647 13.3061 2.37686 13.9126C2.62724 14.5191 2.99501 15.0701 3.45902 15.534C3.92132 15.9998 4.47147 16.3692 5.07759 16.6209C5.68371 16.8725 6.33374 17.0014 6.99001 17H7.00201C9.09101 16.995 10.607 15.428 11.998 13.649C13.389 15.431 14.906 17 17 17C19.757 17 22 14.757 22 12C22 9.243 19.757 7 17 7ZM6.99801 15L6.99001 16V15C6.19101 15 5.44001 14.688 4.87601 14.122C4.45801 13.7016 4.17376 13.1669 4.05905 12.5852C3.94434 12.0035 4.00432 11.4009 4.23141 10.8533C4.45851 10.3057 4.84258 9.83746 5.33525 9.50767C5.82792 9.17788 6.40715 9.00124 7.00001 9C8.33001 9 9.56002 10.438 10.746 11.998C9.55802 13.557 8.32801 14.997 6.99801 15ZM17 15C15.67 15 14.439 13.56 13.251 11.998C14.438 10.438 15.668 9 17 9C18.654 9 20 10.346 20 12C20 13.654 18.654 15 17 15Z" fill="white"/>
                  </Svg>
                  <ThemedText style={styles.passDesc}>Infinite AI Docent Chat</ThemedText>
                </View>

                <View style={styles.passDescRow}>
                  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M6 3.99961C6.2 3.79961 6.43767 3.69961 6.713 3.69961C6.98833 3.69961 7.22567 3.79961 7.425 3.99961L9 5.59961C9.2 5.79961 9.3 6.03294 9.3 6.29961C9.3 6.56628 9.2 6.79961 9 6.99961C8.8 7.19961 8.56267 7.29961 8.288 7.29961C8.01333 7.29961 7.77567 7.19961 7.575 6.99961L5.975 5.42461C5.775 5.22461 5.679 4.98728 5.687 4.71261C5.695 4.43794 5.79933 4.20028 6 3.99961ZM13 1.09961C13.2833 1.09961 13.521 1.19561 13.713 1.38761C13.905 1.57961 14.0007 1.81694 14 2.09961V4.34961C14 4.63294 13.904 4.87061 13.712 5.06261C13.52 5.25461 13.2827 5.35028 13 5.34961C12.7173 5.34894 12.48 5.25328 12.288 5.06261C12.096 4.87194 12 4.63428 12 4.34961V2.09961C12 1.81628 12.096 1.57894 12.288 1.38761C12.48 1.19628 12.7173 1.10028 13 1.09961ZM17 14.9996C17.2 14.7996 17.4377 14.6996 17.713 14.6996C17.9883 14.6996 18.2257 14.7996 18.425 14.9996L20 16.5996C20.2 16.7996 20.3 17.0329 20.3 17.2996C20.3 17.5663 20.2 17.7996 20 17.9996C19.8 18.1996 19.5623 18.2996 19.287 18.2996C19.0117 18.2996 18.7743 18.1996 18.575 17.9996L16.975 16.4246C16.775 16.2246 16.679 15.9873 16.687 15.7126C16.695 15.4379 16.7993 15.2003 17 14.9996ZM20 3.99961C20.2 4.19961 20.3 4.43728 20.3 4.71261C20.3 4.98794 20.2 5.22528 20 5.42461L18.4 7.02461C18.2 7.22461 17.9667 7.32061 17.7 7.31261C17.4333 7.30461 17.2 7.20028 17 6.99961C16.8 6.79894 16.7 6.56161 16.7 6.28761C16.7 6.01361 16.8 5.77594 17 5.57461L18.575 3.99961C18.775 3.79961 19.0127 3.69961 19.288 3.69961C19.5633 3.69961 19.8007 3.79961 20 3.99961ZM22.9 10.9996C22.9 11.2829 22.804 11.5206 22.612 11.7126C22.42 11.9046 22.1827 12.0003 21.9 11.9996H19.65C19.3667 11.9996 19.1293 11.9036 18.938 11.7116C18.7467 11.5196 18.6507 11.2823 18.65 10.9996C18.6493 10.7169 18.7453 10.4796 18.938 10.2876C19.1307 10.0956 19.368 9.99961 19.65 9.99961H21.9C22.1833 9.99961 22.421 10.0956 22.613 10.2876C22.805 10.4796 22.9007 10.7169 22.9 10.9996ZM5.125 21.6996L2.3 18.8746C2.1 18.6746 2 18.4413 2 18.1746C2 17.9079 2.1 17.6746 2.3 17.4746L11.375 8.37461C11.9583 7.79128 12.6667 7.49961 13.5 7.49961C14.3333 7.49961 15.0417 7.79128 15.625 8.37461C16.2083 8.95794 16.5 9.66628 16.5 10.4996C16.5 11.3329 16.2083 12.0413 15.625 12.6246L6.525 21.6996C6.325 21.8996 6.09167 21.9996 5.825 21.9996C5.55833 21.9996 5.325 21.8996 5.125 21.6996ZM12.1 13.3246L14.2 11.1996C14.4 10.9996 14.5 10.7663 14.5 10.4996C14.5 10.2329 14.4 9.99961 14.2 9.79961C14 9.59961 13.7667 9.49961 13.5 9.49961C13.2333 9.49961 13 9.59961 12.8 9.79961L10.675 11.9246L12.1 13.3246Z" fill="white"/>
                  </Svg>
                  <ThemedText style={styles.passDesc}>Automatic tour route generate</ThemedText>
                </View>
              </View>

              <View style={styles.priceContainer}>
                <ThemedText style={styles.priceAmount}>12 $</ThemedText>
                <ThemedText style={styles.priceDuration}>(72hrs)</ThemedText>
              </View>
            </View>

            {/* CTA Button */}
            <Pressable style={styles.ctaButton}>
              <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <Path d="M10.586 0.586C10.211 0.210901 9.70239 0.000113275 9.172 0H2C1.46957 0 0.960859 0.210714 0.585786 0.585786C0.210714 0.960859 0 1.46957 0 2V9.172C0.000113275 9.70239 0.210901 10.211 0.586 10.586L8.586 18.586C8.96106 18.9609 9.46967 19.1716 10 19.1716C10.5303 19.1716 11.0389 18.9609 11.414 18.586L18.586 11.414C18.9609 11.0389 19.1716 10.5303 19.1716 10C19.1716 9.46967 18.9609 8.96106 18.586 8.586L10.586 0.586ZM5 7C4.46943 6.99987 3.96065 6.78897 3.58558 6.41371C3.21051 6.03845 2.99987 5.52957 3 4.999C3.00013 4.46843 3.21103 3.95965 3.58629 3.58458C3.96155 3.20951 4.47043 2.99887 5.001 2.999C5.53157 2.99913 6.04035 3.21003 6.41542 3.58529C6.79049 3.96055 7.00113 4.46943 7.001 5C7.00087 5.53057 6.78997 6.03935 6.41471 6.41442C6.03945 6.78949 5.53057 7.00013 5 7Z" fill="white"/>
              </Svg>
              <ThemedText style={styles.ctaText}>Get Day Pass Trial</ThemedText>
              <ThemedText style={styles.ctaTextLight}>3 Day</ThemedText>
            </Pressable>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#34495E"
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
  },

  titleBox: {
    paddingHorizontal: 20,
    marginTop: 31,
  },
  title: {
    color: "#8BFFDA",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: 0,
  },

  mainTitleBox: {
    paddingHorizontal: 20,
    marginTop: 95,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  mainTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
    letterSpacing: 0,
  },
  mainIcon: {
    width: 148,
    height: 141,
    aspectRatio: 148 / 141,
    marginRight: 10,
  },

  passCard: {
    width: 170,
    padding: 10,
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#76C7AD",
    backgroundColor: "#76C7AD",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    marginHorizontal: 20,
    marginVertical: 20,
    alignSelf: "center",
  },
  passTitle: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.18,
  },
  passDescContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 5,
    alignSelf: "stretch",
  },
  passDescRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  passDesc: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 22,
    letterSpacing: -0.18,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  priceAmount: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
    letterSpacing: -0.18,
  },
  priceDuration: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.18,
  },

  ctaButton: {
    backgroundColor: "#FF7F50",
    width: 320,
    height: 50,
    padding: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderRadius: 35,
    marginHorizontal: 20,
    marginBottom: 40,
    alignSelf: "center",
  },
  ctaText: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "700",
  },
  ctaTextLight: {
    color: "#FFF",
    fontFamily: "Pretendard",
    fontSize: 16,
    fontWeight: "400",
  },
});






