import { View, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export default function RouteResultList({
  places,
  onPressPlace,
  onClose,
  onStartNavigation,
}: {
  places: any[];
  onPressPlace: (quest: any) => void;
  onClose?: () => void;
  onStartNavigation?: () => void;
}) {
  console.log('🔥 RouteResultList - places 개수:', places.length);
  console.log('🔥 RouteResultList - places 데이터:', places);
  places.forEach((p, i) => {
    console.log(`🔥 Place ${i + 1}: ${p.name}, 거리: ${p.distance_km ?? 'null'}km`);
  });

  return (
    <View style={styles.wrapper}>
      {/* 상단 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="menu" size={24} color="#fff" />
          <ThemedText style={styles.headerTitle}>Plan Chat</ThemedText>
        </View>
        <View style={styles.headerRight}>
          <Pressable style={styles.iconButton}>
            <Ionicons name="download-outline" size={22} color="#fff" />
          </Pressable>
          {onClose && (
            <Pressable onPress={onClose} style={styles.iconButton}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Best Route 배지 */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" style={{ marginRight: 6 }} />
            <ThemedText style={styles.badgeText}>Best route planned!</ThemedText>
          </View>
        </View>

        {/* 경로 카드들 */}
        {places.map((p, index) => (
          <View key={`route-card-${index}-${p.id}`} style={styles.routeItem}>
            {/* 왼쪽: 번호 + 거리 */}
            <View style={styles.leftIndicator}>
              <View style={styles.numberBox}>
                <ThemedText style={styles.numberText}>
                  {String(index + 1).padStart(2, '0')}
                </ThemedText>
              </View>
              {p.distance_km !== undefined && p.distance_km !== null && (
                <View style={styles.distanceIndicator}>
                  <ThemedText style={styles.distanceIndicatorText}>
                    {p.distance_km.toFixed(0)}km
                  </ThemedText>
                </View>
              )}
            </View>

            {/* 오른쪽: 카드 */}
            <Pressable
              style={styles.card}
              onPress={() => onPressPlace(p)}
            >
              {/* 이미지 */}
              <Image
                source={{ uri: p.place_image_url }}
                style={styles.cardImage}
                resizeMode="cover"
              />

              {/* 정보 영역 */}
              <View style={styles.cardInfo}>
                <View style={styles.cardHeader}>
                  <ThemedText style={styles.categoryText}>{p.category}</ThemedText>
                  <View style={styles.distanceBadge}>
                    <Ionicons name="navigate" size={10} color="#94A3B8" />
                    <ThemedText style={styles.distanceBadgeText}>
                      {p.distance_km?.toFixed(1) ?? '0.0'}km
                    </ThemedText>
                  </View>
                </View>

                <ThemedText style={styles.placeName} numberOfLines={1}>
                  {p.name}
                </ThemedText>

                <View style={styles.cardFooter}>
                  <ThemedText style={styles.districtText}>{p.district}</ThemedText>
                  <View style={styles.pointBadge}>
                    <Ionicons name="leaf" size={12} color="#fff" />
                    <ThemedText style={styles.pointText}>
                      {p.reward_point ?? 300}
                    </ThemedText>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {/* 하단 네비게이션 버튼 */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.navigationButton}
          onPress={onStartNavigation}
        >
          <Ionicons name="flag" size={20} color="#fff" style={{ marginRight: 8 }} />
          <ThemedText style={styles.navigationButtonText}>
            Start navigation with this route
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#1A2332',
  },

  // 상단 헤더
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: '#1A2332',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },

  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },

  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 스크롤 영역
  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // 하단 버튼 공간
  },

  // Best Route 배지
  badgeContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
  },

  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // 경로 아이템 (번호 + 카드)
  routeItem: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },

  // 왼쪽 번호 + 거리
  leftIndicator: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },

  numberBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },

  numberText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  distanceIndicator: {
    backgroundColor: '#0F1419',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },

  distanceIndicatorText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },

  // 카드
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2A3441',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3A4551',
  },

  cardImage: {
    width: 100,
    height: 100,
    backgroundColor: '#1A2332',
  },

  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  categoryText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1A2332',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  distanceBadgeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },

  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginVertical: 4,
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  districtText: {
    fontSize: 12,
    color: '#CBD5E1',
  },

  pointBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  pointText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  // 하단 네비게이션 버튼
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A2332',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
  },

  navigationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 28,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  navigationButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
