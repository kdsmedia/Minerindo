import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { walletService } from '@/services/walletService';
import { miningService } from '@/services/miningService';
import { APP_CONFIG } from '@/constants/config';
import { colors, gradients, spacing, radius, fontSize, fontWeight, shadow } from '@/constants/theme';
import { formatRp, isToday } from '@/utils/helpers';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';

export default function BonusScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, refreshProfile, adsCount, setAdsCount } = useApp();
  const { showAlert } = useAlert();

  const [refreshing, setRefreshing] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [streak, setStreak] = useState(0);
  const [taskRentDone, setTaskRentDone] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const loadData = useCallback(async () => {
    if (!user) return;
    const [ci, s, rental] = await Promise.all([
      walletService.getTodayCheckin(user.id),
      walletService.getCheckinStreak(user.id),
      miningService.getActiveRental(user.id),
    ]);
    setCheckedInToday(ci);
    setStreak(s);
    setTaskRentDone(!!rental);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const timer = setInterval(loadData, APP_CONFIG.autoRefreshInterval);
      return () => clearInterval(timer);
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  const handleCheckin = async () => {
    if (!user || checkedInToday || checkinLoading) return;

    // Tampilkan animasi klaim
    setCheckinLoading(true);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();

    // Tunggu sejenak simulasi proses
    await new Promise((r) => setTimeout(r, 2000));

    const { success, error } = await walletService.doCheckin(user.id);
    await walletService.incrementAds(user.id);

    if (success) {
      setCheckedInToday(true);
      setStreak((s) => s + 1);
      setAdsCount((prev) => prev + 1);
      await refreshProfile();
      showAlert('Klaim Berhasil!', `Kamu mendapat bonus ${formatRp(APP_CONFIG.checkinReward)}`);
    } else if (error) {
      showAlert('Gagal', error);
    } else {
      showAlert('Info', 'Kamu sudah klaim hari ini');
    }
    setCheckinLoading(false);
  };

  const handleInviteTask = () => {
    showAlert('Bagikan Kode Referral', `Kode referral kamu ada di tab Akun. Ajak teman mendaftar menggunakan kode tersebut.`);
  };

  const handleRentTask = () => {
    if (taskRentDone) {
      showAlert('Tugas Selesai', 'Kamu sudah menyewa mesin hari ini!');
    } else {
      showAlert('Info', 'Sewa mesin di tab Mesin untuk menyelesaikan tugas ini');
    }
  };

  const invitedCount = profile?.invited_count || 0;
  const inviteProgress = Math.min(invitedCount / APP_CONFIG.inviteFriendsTask.required, 1);

  return (
    <LinearGradient colors={['#050614', '#0A0B1E']} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🎁 BONUS</Text>
          <LinearGradient colors={gradients.gold} style={styles.balanceBadge}>
            <MaterialCommunityIcons name="wallet" size={13} color="#000" />
            <Text style={styles.balanceText}>{formatRp(profile?.balance || 0)}</Text>
          </LinearGradient>
        </View>

        {/* Streak Banner */}
        <LinearGradient colors={['#1a1d3a', '#0d0f25']} style={styles.streakCard}>
          <MaterialCommunityIcons name="fire" size={32} color="#F59E0B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.streakLabel}>Streak Klaim</Text>
            <Text style={styles.streakValue}>{streak} hari berturut-turut</Text>
          </View>
          <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primary} />
        </LinearGradient>

        {/* Daily Checkin */}
        <Text style={styles.sectionTitle}>Klaim Harian</Text>
        <LinearGradient
          colors={checkedInToday ? ['#1a2e1a', '#0d1a0d'] : ['#1E2040', '#161830']}
          style={styles.checkinCard}
        >
          <View style={styles.checkinLeft}>
            <View style={[styles.rewardIcon, checkedInToday && { backgroundColor: 'rgba(46,204,113,0.15)' }]}>
              <MaterialCommunityIcons
                name="calendar-star"
                size={32}
                color={checkedInToday ? colors.accentGreen : colors.primary}
              />
            </View>
            <View>
              <Text style={styles.checkinTitle}>Check-In Harian</Text>
              <Text style={styles.checkinReward}>Reward: {formatRp(APP_CONFIG.checkinReward)}</Text>
              <Text style={styles.checkinNote}>Selesaikan untuk klaim</Text>
            </View>
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPress={handleCheckin}
              disabled={checkedInToday || checkinLoading}
              activeOpacity={0.85}
            >
              {checkedInToday ? (
                <View style={styles.claimedBtn}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.accentGreen} />
                  <Text style={styles.claimedText}>Diklaim</Text>
                </View>
              ) : (
                <LinearGradient colors={checkinLoading ? gradients.dark : gradients.gold} style={styles.claimBtn}>
                  <MaterialCommunityIcons
                    name={checkinLoading ? 'loading' : 'gift-open'}
                    size={16}
                    color={checkinLoading ? colors.textSecondary : '#000'}
                  />
                  <Text style={[styles.claimBtnText, checkinLoading && { color: colors.textSecondary }]}>
                    {checkinLoading ? 'Memuat...' : 'KLAIM'}
                  </Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>

        {/* Daily Tasks */}
        <Text style={styles.sectionTitle}>Tugas Harian</Text>

        {/* Task 1: Invite Friends */}
        <LinearGradient colors={['#1E2040', '#161830']} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <MaterialCommunityIcons name="account-multiple-plus" size={24} color={colors.accentBlue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>Undang 10 Teman</Text>
              <Text style={styles.taskReward}>Reward: {formatRp(APP_CONFIG.inviteFriendsTask.reward)}</Text>
            </View>
            <TouchableOpacity onPress={handleInviteTask} activeOpacity={0.8}>
              {invitedCount >= APP_CONFIG.inviteFriendsTask.required ? (
                <View style={styles.claimedBtn}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.accentGreen} />
                  <Text style={styles.claimedText}>Selesai</Text>
                </View>
              ) : (
                <LinearGradient colors={gradients.blue} style={styles.taskBtn}>
                  <Text style={styles.taskBtnText}>Undang</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={gradients.blue}
                style={[styles.progressFill, { width: `${inviteProgress * 100}%` }]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {invitedCount}/{APP_CONFIG.inviteFriendsTask.required} teman
            </Text>
          </View>
        </LinearGradient>

        {/* Task 2: Rent Machine */}
        <LinearGradient colors={['#1E2040', '#161830']} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <MaterialCommunityIcons name="cpu-64-bit" size={24} color={colors.accentPurple} />
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>Sewa Mesin Mining</Text>
              <Text style={styles.taskReward}>Reward: {formatRp(APP_CONFIG.rentMachineTask.reward)}</Text>
            </View>
            <TouchableOpacity onPress={handleRentTask} activeOpacity={0.8}>
              {taskRentDone ? (
                <View style={styles.claimedBtn}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={colors.accentGreen} />
                  <Text style={styles.claimedText}>Selesai</Text>
                </View>
              ) : (
                <LinearGradient colors={gradients.purple} style={styles.taskBtn}>
                  <Text style={styles.taskBtnText}>Sewa</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.taskDesc}>
            Sewa minimal 1 mesin mining hari ini untuk mendapatkan bonus
          </Text>
        </LinearGradient>

        {/* Banner Placeholder */}
        <LinearGradient colors={['#1E2040', '#161830']} style={styles.adsCard}>
          <MaterialCommunityIcons name="counter" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.adsTitle}>Progress Tugas</Text>
            <Text style={styles.adsValue}>{adsCount} / {APP_CONFIG.minAdsForWithdrawal}</Text>
            <Text style={styles.adsNote}>Selesaikan untuk membuka penarikan</Text>
          </View>
          <View style={styles.adsProgress}>
            <Text style={styles.adsPercent}>
              {Math.min(100, Math.round((adsCount / APP_CONFIG.minAdsForWithdrawal) * 100))}%
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  balanceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full,
  },
  balanceText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textSecondary },
  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  streakLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  streakValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  checkinCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border,
  },
  checkinLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  rewardIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(245,197,24,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  checkinTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  checkinReward: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  checkinNote: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  claimBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full,
  },
  claimBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  claimedBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full,
    backgroundColor: 'rgba(46,204,113,0.1)', borderWidth: 1, borderColor: colors.accentGreen,
  },
  claimedText: { fontSize: fontSize.sm, color: colors.accentGreen, fontWeight: fontWeight.semibold },
  taskCard: {
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, gap: spacing.sm,
  },
  taskHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  taskTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  taskReward: { fontSize: fontSize.sm, color: colors.primary, fontWeight: fontWeight.semibold },
  taskDesc: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: 20 },
  taskBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.full },
  taskBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#fff' },
  progressWrap: { gap: 6 },
  progressBar: {
    height: 6, backgroundColor: colors.bgDark, borderRadius: radius.full, overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: radius.full },
  progressLabel: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'right' },
  adsCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(245,197,24,0.2)',
  },
  adsTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  adsValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
  adsNote: { fontSize: fontSize.xs, color: colors.textMuted },
  adsProgress: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,197,24,0.1)',
  },
  adsPercent: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
});
