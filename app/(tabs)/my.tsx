import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/store/useAuthStore';
import { usePointsStore } from '@/store/usePointsStore';

export default function MyScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isGuest, logout } = useAuthStore();
  const { totalPoints, transactions, isLoading, fetchPoints } = usePointsStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPoints();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleGuestToLogin = async () => {
    await logout();
    router.replace('/login');
  };

  if (!isAuthenticated) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title">My</ThemedText>
        <ThemedText style={styles.description}>
          로그인이 필요합니다.
        </ThemedText>
        <Pressable
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <ThemedText style={styles.loginButtonText}>로그인</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={['#7EC8E3', '#4A90E2']}
        style={styles.header}
      >
        <View style={styles.profileContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <ThemedText type="title" style={styles.name}>
            {user?.nickname || user?.email || '사용자'}
          </ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
          {isGuest && (
            <View style={styles.guestBadge}>
              <Ionicons name="information-circle" size={16} color="#FFA500" />
              <ThemedText style={styles.guestBadgeText}>게스트 모드</ThemedText>
            </View>
          )}
          <View style={styles.pointsContainer}>
            <Ionicons name="cash-outline" size={20} color="#fff" />
            <ThemedText style={styles.pointsText}>
              {isLoading ? '...' : `${totalPoints.toLocaleString()} 포인트`}
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {isGuest && (
          <View style={styles.guestNotice}>
            <Ionicons name="alert-circle" size={24} color="#FFA500" />
            <View style={styles.guestNoticeContent}>
              <ThemedText style={styles.guestNoticeTitle}>게스트 모드로 이용 중입니다</ThemedText>
              <ThemedText style={styles.guestNoticeText}>
                전체 기능을 사용하려면 로그인이 필요합니다.
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            계정 정보
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>이메일</ThemedText>
            <ThemedText style={styles.infoValue}>{user?.email}</ThemedText>
          </View>

          {user?.nickname && (
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>닉네임</ThemedText>
              <ThemedText style={styles.infoValue}>{user.nickname}</ThemedText>
            </View>
          )}

          <View style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>포인트</ThemedText>
            <ThemedText style={styles.infoValue}>
              {isLoading ? '...' : `${totalPoints.toLocaleString()} P`}
            </ThemedText>
          </View>
        </View>

        {!isGuest && (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              포인트 내역
            </ThemedText>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#5B7DFF" />
              </View>
            ) : transactions.length === 0 ? (
              <ThemedText style={styles.emptyText}>포인트 내역이 없습니다.</ThemedText>
            ) : (
              <FlatList
                data={transactions.slice(0, 10)}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.transactionRow}>
                    <View style={styles.transactionInfo}>
                      <ThemedText style={styles.transactionReason}>{item.reason}</ThemedText>
                      <ThemedText style={styles.transactionDate}>
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={[
                        styles.transactionValue,
                        item.value > 0 ? styles.positiveValue : styles.negativeValue,
                      ]}
                    >
                      {item.value > 0 ? '+' : ''}
                      {item.value.toLocaleString()} P
                    </ThemedText>
                  </View>
                )}
                scrollEnabled={false}
              />
            )}
          </View>
        )}

        {isGuest ? (
          <Pressable style={styles.loginToFullButton} onPress={handleGuestToLogin}>
            <Ionicons name="log-in-outline" size={20} color="#fff" />
            <ThemedText style={styles.loginToFullButtonText}>로그인하고 전체 기능 이용하기</ThemedText>
          </Pressable>
        ) : (
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <ThemedText style={styles.logoutButtonText}>로그아웃</ThemedText>
          </Pressable>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#F47A3A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 'auto',
    gap: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    marginTop: 12,
    textAlign: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  positiveValue: {
    color: '#4CAF50',
  },
  negativeValue: {
    color: '#FF4444',
  },
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  guestBadgeText: {
    color: '#FFA500',
    fontSize: 13,
    fontWeight: '600',
  },
  guestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 12,
  },
  guestNoticeContent: {
    flex: 1,
  },
  guestNoticeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
  },
  guestNoticeText: {
    fontSize: 13,
    color: '#F57C00',
  },
  loginToFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 'auto',
    gap: 8,
  },
  loginToFullButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
