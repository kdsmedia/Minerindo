import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  RefreshControl,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { miningService, MiningSession, MachineRental } from '@/services/miningService';
import { COINS, CoinConfig, APP_CONFIG } from '@/constants/config';
import { colors, gradients, spacing, radius, fontSize, fontWeight, shadow } from '@/constants/theme';
import { formatRp, formatHash, formatTimeCountdown, formatDateTime } from '@/utils/helpers';

export default function MiningScreen() {
  const insets = useSafeAreaInsets();
  const { user, balance, refreshProfile } = useApp();

  const [selectedCoin, setSelectedCoin] = useState<CoinConfig>(COINS[0]);
  const [isMining, setIsMining] = useState(false);
  const [earnedRp, setEarnedRp] = useState(0);
  const [hashrate, setHashrate] = useState(0);
  const [ratePerSec, setRatePerSec] = useState(0);
  const [miningDuration, setMiningDuration] = useState(0);
  const [activeRental, setActiveRental] = useState<MachineRental | null>(null);
  const [activeSession, setActiveSession] = useState<MiningSession | null>(null);
  const [history, setHistory] = useState<MiningSession[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [rentalCountdown, setRentalCountdown] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const earnedRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopAnims = () => {
    pulseAnim.stopAnimation();
    rotateAnim.stopAnimation();
    glowAnim.stopAnimation();
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);
    glowAnim.setValue(0.3);
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    const [rental, sess, hist] = await Promise.all([
      miningService.getActiveRental(user.id),
      miningService.getActiveMiningSession(user.id),
      miningService.getMiningHistory(user.id),
    ]);
    setActiveRental(rental);
    setHistory(hist);

    if (sess && sess.is_active && !isMining) {
      // Restore active session from another device
      setActiveSession(sess);
    }
  }, [user, isMining]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const timer = setInterval(loadData, APP_CONFIG.autoRefreshInterval);
      return () => clearInterval(timer);
    }, [loadData])
  );

  // Rental countdown
  useEffect(() => {
    if (!activeRental) return;
    const tick = setInterval(() => {
      const { secondsUntilEndTime } = require('@/utils/helpers');
      const secs = secondsUntilEndTime(activeRental.end_time);
      setRentalCountdown(secs);
      if (secs <= 0) {
        setActiveRental(null);
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [activeRental]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  const startMining = async () => {
    if (!user) return;
    setIsMining(true);
    setEarnedRp(0);
    setMiningDuration(0);
    durationRef.current = 0;
    earnedRef.current = 0;
    startPulse();

    const multiplier = activeRental ? activeRental.multiplier : 1;
    const { data: session } = await miningService.startSession({
      user_id: user.id,
      coin_type: selectedCoin.id,
      coin_name: selectedCoin.name,
      hashrate: 0,
      earned_rp: 0,
      machine_name: activeRental?.machine_name || 'Manual',
      is_active: true,
    });
    setActiveSession(session);

    intervalRef.current = setInterval(() => {
      const randomFactor = 0.25 + Math.random() * 0.75;
      const hr = selectedCoin.baseHashrateMH * multiplier * randomFactor;
      const rpSec = selectedCoin.ratePerSec * selectedCoin.rpPerCoin * multiplier * randomFactor;

      setHashrate(hr);
      setRatePerSec(rpSec);
      setEarnedRp((prev) => {
        earnedRef.current = prev + rpSec;
        return earnedRef.current;
      });
      setMiningDuration((prev) => {
        durationRef.current = prev + 1;
        return durationRef.current;
      });
    }, 1000);
  };

  const stopMining = async () => {
    if (!user) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsMining(false);
    stopAnims();

    const finalEarned = earnedRef.current;
    const finalHash = selectedCoin.baseHashrateMH * (activeRental?.multiplier || 1);

    if (activeSession?.id && finalEarned > 0) {
      await miningService.stopSession(activeSession.id, finalEarned, finalHash);
      await miningService.addMiningBalance(user.id, finalEarned);
      await refreshProfile();
    }

    setEarnedRp(0);
    setHashrate(0);
    setRatePerSec(0);
    setMiningDuration(0);
    setActiveSession(null);
    await loadData();
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

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
          <View>
            <Text style={styles.headerTitle}>⛏ MINING</Text>
            <Text style={styles.headerSub}>Tambang, Kumpulkan, Tukarkan</Text>
          </View>
          <LinearGradient colors={gradients.gold} style={styles.balanceBadge}>
            <MaterialCommunityIcons name="wallet" size={14} color="#000" />
            <Text style={styles.balanceText}>{formatRp(balance)}</Text>
          </LinearGradient>
        </View>

        {/* Active Machine Banner */}
        {activeRental ? (
          <LinearGradient colors={['#1a1d3a', '#0d0f25']} style={styles.machineBanner}>
            <MaterialCommunityIcons name="cpu-64-bit" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.machineLabel}>Mesin Aktif: {activeRental.machine_name}</Text>
              <Text style={styles.machineTimer}>Berakhir dalam: {formatTimeCountdown(rentalCountdown)}</Text>
            </View>
            <View style={styles.multiplierBadge}>
              <Text style={styles.multiplierText}>{activeRental.multiplier}x</Text>
            </View>
          </LinearGradient>
        ) : (
          <View style={styles.noMachineBanner}>
            <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
            <Text style={styles.noMachineText}>Sewa mesin di tab Mesin untuk mining lebih cepat</Text>
          </View>
        )}

        {/* Mining Animation */}
        <View style={styles.miningCenter}>
          <Animated.View style={[styles.glowRing, { opacity: glowAnim, transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.iconRing, { transform: [{ rotate: spin }] }]}>
            <LinearGradient
              colors={isMining ? gradients.gold : ['#1E2040', '#252650']}
              style={styles.iconCircle}
            >
              <MaterialCommunityIcons
                name="pickaxe"
                size={52}
                color={isMining ? '#000' : colors.textMuted}
              />
            </LinearGradient>
          </Animated.View>

          {isMining && (
            <View style={styles.statsRow}>
              <StatBox label="Hashrate" value={formatHash(hashrate)} icon="lightning-bolt" />
              <StatBox label="Rate" value={`${formatRp(ratePerSec)}/s`} icon="chart-line" />
              <StatBox label="Diperoleh" value={formatRp(earnedRp)} icon="gold" />
            </View>
          )}
        </View>

        {/* Coin Selector */}
        <Text style={styles.sectionTitle}>Pilih Jenis Koin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coinScroll}>
          <View style={styles.coinRow}>
            {COINS.map((coin) => (
              <TouchableOpacity
                key={coin.id}
                onPress={() => !isMining && setSelectedCoin(coin)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={selectedCoin.id === coin.id ? coin.gradient : ['#1E2040', '#161830']}
                  style={[styles.coinCard, selectedCoin.id === coin.id && styles.coinCardActive]}
                >
                  <MaterialCommunityIcons name={coin.icon as any} size={24} color={selectedCoin.id === coin.id ? '#fff' : coin.color} />
                  <Text style={[styles.coinName, selectedCoin.id === coin.id && { color: '#fff', fontWeight: fontWeight.bold }]}>
                    {coin.name}
                  </Text>
                  <Text style={styles.coinRate}>{formatRp(coin.ratePerSec * coin.rpPerCoin)}/s</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Duration */}
        {isMining && (
          <View style={styles.durationRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.durationText}>Durasi: {formatTimeCountdown(miningDuration)}</Text>
          </View>
        )}

        {/* Start/Stop */}
        <TouchableOpacity
          style={styles.mainBtn}
          onPress={isMining ? stopMining : startMining}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={isMining ? gradients.danger : gradients.success}
            style={styles.mainBtnGrad}
          >
            <MaterialCommunityIcons name={isMining ? 'stop-circle' : 'play-circle'} size={26} color="#fff" />
            <Text style={styles.mainBtnText}>{isMining ? 'STOP' : 'MULAI'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* AdMob Banner Placeholder */}
        <View style={styles.adBanner}>
          <Text style={styles.adBannerText}>◆ MINERINDO</Text>
        </View>

        {/* History */}
        <Text style={styles.sectionTitle}>Riwayat Mining</Text>
        {history.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="history" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada riwayat mining</Text>
          </View>
        ) : (
          history.map((item) => (
            <LinearGradient key={item.id} colors={['#1E2040', '#161830']} style={styles.historyCard}>
              <View style={styles.historyLeft}>
                <MaterialCommunityIcons
                  name={COINS.find((c) => c.id === item.coin_type)?.icon as any || 'pickaxe'}
                  size={20}
                  color={COINS.find((c) => c.id === item.coin_type)?.color || colors.primary}
                />
                <View>
                  <Text style={styles.historyName}>{item.coin_name}</Text>
                  <Text style={styles.historyDate}>{item.start_time ? formatDateTime(item.start_time) : ''}</Text>
                </View>
              </View>
              <Text style={styles.historyEarned}>+{formatRp(item.earned_rp)}</Text>
            </LinearGradient>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <LinearGradient colors={['#1E2040', '#161830']} style={sbStyles.box}>
      <MaterialCommunityIcons name={icon as any} size={14} color={colors.primary} />
      <Text style={sbStyles.val}>{value}</Text>
      <Text style={sbStyles.lbl}>{label}</Text>
    </LinearGradient>
  );
}

const sbStyles = StyleSheet.create({
  box: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    minWidth: 90,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  val: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  lbl: { fontSize: fontSize.xs, color: colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  headerSub: { fontSize: fontSize.sm, color: colors.textSecondary },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  balanceText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  machineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
  },
  machineLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  machineTimer: { fontSize: fontSize.sm, color: colors.primary },
  multiplierBadge: {
    backgroundColor: 'rgba(245,197,24,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  multiplierText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  noMachineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noMachineText: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  miningCenter: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.lg },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary,
    opacity: 0.3,
  },
  iconRing: { width: 140, height: 140, borderRadius: 70, ...shadow.gold },
  iconCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textSecondary },
  coinScroll: { marginHorizontal: -spacing.md },
  coinRow: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm, paddingBottom: 4 },
  coinCard: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  coinCardActive: { borderColor: 'rgba(245,197,24,0.5)' },
  coinName: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  coinRate: { fontSize: fontSize.xs, color: colors.textMuted },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  durationText: { fontSize: fontSize.md, color: colors.textSecondary },
  mainBtn: { borderRadius: radius.full, overflow: 'hidden', ...shadow.md },
  mainBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
    borderRadius: radius.full,
  },
  mainBtnText: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: '#fff', letterSpacing: 2 },
  adBanner: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    justifyContent: 'center',
  },
  adBannerText: { fontSize: fontSize.sm, color: colors.textMuted },
  emptyBox: {
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  historyName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  historyDate: { fontSize: fontSize.xs, color: colors.textMuted },
  historyEarned: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.accentGreen },
});
