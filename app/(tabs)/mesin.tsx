import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { miningService, MachineRental } from '@/services/miningService';
import { MACHINES, MachineConfig, APP_CONFIG } from '@/constants/config';
import { colors, gradients, spacing, radius, fontSize, fontWeight, shadow } from '@/constants/theme';
import { formatRp, formatDuration, formatTimeCountdown, secondsUntilEndTime } from '@/utils/helpers';
import { useAlert } from '@/template';

export default function MesinScreen() {
  const insets = useSafeAreaInsets();
  const { user, balance, refreshProfile } = useApp();
  const { showAlert } = useAlert();

  const [activeRental, setActiveRental] = useState<MachineRental | null>(null);
  const [rentalHistory, setRentalHistory] = useState<MachineRental[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<MachineConfig | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const loadData = useCallback(async () => {
    if (!user) return;
    const [rental, hist] = await Promise.all([
      miningService.getActiveRental(user.id),
      miningService.getRentalHistory(user.id),
    ]);
    setActiveRental(rental);
    setRentalHistory(hist);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const timer = setInterval(loadData, APP_CONFIG.autoRefreshInterval);
      return () => clearInterval(timer);
    }, [loadData])
  );

  useEffect(() => {
    if (!activeRental) return;
    const tick = setInterval(() => {
      setCountdown(secondsUntilEndTime(activeRental.end_time));
    }, 1000);
    setCountdown(secondsUntilEndTime(activeRental.end_time));
    return () => clearInterval(tick);
  }, [activeRental]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  const openModal = (m: MachineConfig) => {
    setSelectedMachine(m);
    setModalVisible(true);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setModalVisible(false);
      setSelectedMachine(null);
    });
  };

  const handleRent = async () => {
    if (!user || !selectedMachine) return;
    if (balance < selectedMachine.price) {
      showAlert('Saldo Tidak Cukup', `Butuh ${formatRp(selectedMachine.price)}, saldo kamu ${formatRp(balance)}`);
      return;
    }
    setLoading(true);
    const { error } = await miningService.rentMachine({
      user_id: user.id,
      machine_id: selectedMachine.id,
      machine_name: selectedMachine.name,
      machine_quality: selectedMachine.quality,
      price: selectedMachine.price,
      duration_minutes: selectedMachine.durationMinutes,
      multiplier: selectedMachine.multiplier,
    });
    setLoading(false);
    if (error) {
      showAlert('Gagal Menyewa', error);
    } else {
      closeModal();
      await Promise.all([loadData(), refreshProfile()]);
      showAlert('Berhasil!', `${selectedMachine.name} aktif selama ${formatDuration(selectedMachine.durationMinutes)}`);
    }
  };

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
          <Text style={styles.headerTitle}>⚙️ MESIN MINING</Text>
          <LinearGradient colors={gradients.gold} style={styles.balanceBadge}>
            <Text style={styles.balanceText}>{formatRp(balance)}</Text>
          </LinearGradient>
        </View>
        <Text style={styles.headerSub}>Sewa mesin untuk meningkatkan kecepatan mining</Text>

        {/* Active Rental */}
        {activeRental && (
          <LinearGradient colors={['#1a1d3a', '#0d0f25']} style={styles.activeCard}>
            <View style={styles.activeRow}>
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.accentGreen} />
              <Text style={styles.activeTitle}>Mesin Aktif</Text>
              <View style={[styles.qualityBadge, { backgroundColor: 'rgba(46,204,113,0.15)', borderColor: colors.accentGreen }]}>
                <Text style={[styles.qualityText, { color: colors.accentGreen }]}>AKTIF</Text>
              </View>
            </View>
            <Text style={styles.activeName}>{activeRental.machine_name}</Text>
            <View style={styles.activeDetails}>
              <View style={styles.activeDetailItem}>
                <MaterialCommunityIcons name="speedometer" size={14} color={colors.primary} />
                <Text style={styles.activeDetailText}>{activeRental.multiplier}x Boost</Text>
              </View>
              <View style={styles.activeDetailItem}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.activeDetailText}>Sisa: {formatTimeCountdown(countdown)}</Text>
              </View>
            </View>
          </LinearGradient>
        )}

        {/* Machine Grid */}
        <Text style={styles.sectionTitle}>Pilih Mesin</Text>
        <View style={styles.grid}>
          {MACHINES.map((machine) => (
            <TouchableOpacity
              key={machine.id}
              style={styles.machineCardWrap}
              onPress={() => openModal(machine)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={machine.gradient} style={styles.machineCard}>
                <View style={[styles.qualityBadge, { backgroundColor: 'rgba(0,0,0,0.4)', borderColor: machine.qualityColor }]}>
                  <Text style={[styles.qualityText, { color: machine.qualityColor }]}>{machine.quality}</Text>
                </View>
                <MaterialCommunityIcons name={machine.icon as any} size={36} color="#fff" style={{ marginTop: 4 }} />
                <Text style={styles.machineName}>{machine.name}</Text>
                <Text style={styles.machineMultiplier}>{machine.multiplier}x Boost</Text>
                <LinearGradient colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']} style={styles.priceTag}>
                  <Text style={styles.priceText}>{formatRp(machine.price)}</Text>
                </LinearGradient>
                <Text style={styles.durationText}>{formatDuration(machine.durationMinutes)}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Confirm Modal */}
      <Modal transparent visible={modalVisible} onRequestClose={closeModal} animationType="none">
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }] }]}>
            <LinearGradient colors={['#1E2040', '#161830']} style={styles.modalCard}>
              <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {selectedMachine && (
                <>
                  <LinearGradient colors={selectedMachine.gradient} style={styles.modalIconWrap}>
                    <MaterialCommunityIcons name={selectedMachine.icon as any} size={48} color="#fff" />
                  </LinearGradient>
                  <Text style={styles.modalMachineName}>{selectedMachine.name}</Text>
                  <View style={[styles.qualityBadge, { backgroundColor: 'rgba(245,197,24,0.1)', borderColor: selectedMachine.qualityColor, alignSelf: 'center', marginBottom: spacing.lg }]}>
                    <Text style={[styles.qualityText, { color: selectedMachine.qualityColor }]}>{selectedMachine.quality}</Text>
                  </View>
                  <Text style={styles.modalDesc}>{selectedMachine.description}</Text>

                  <View style={styles.modalInfoRow}>
                    <InfoItem icon="speedometer" label="Boost Mining" value={`${selectedMachine.multiplier}x lebih cepat`} />
                    <InfoItem icon="clock-outline" label="Durasi" value={formatDuration(selectedMachine.durationMinutes)} />
                  </View>

                  <LinearGradient colors={['rgba(245,197,24,0.1)', 'rgba(245,197,24,0.05)']} style={styles.priceBox}>
                    <Text style={styles.priceBoxLabel}>Biaya Sewa</Text>
                    <Text style={styles.priceBoxAmount}>{formatRp(selectedMachine.price)}</Text>
                    <Text style={styles.priceBoxBalance}>Saldo kamu: {formatRp(balance)}</Text>
                  </LinearGradient>

                  <TouchableOpacity
                    style={[styles.rentBtn, loading && { opacity: 0.6 }]}
                    onPress={handleRent}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient colors={gradients.gold} style={styles.rentBtnGrad}>
                      <MaterialCommunityIcons name="shopping" size={18} color="#000" />
                      <Text style={styles.rentBtnText}>{loading ? 'Memproses...' : 'SEWA SEKARANG'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </Modal>
    </LinearGradient>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={iiStyles.wrap}>
      <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} />
      <Text style={iiStyles.label}>{label}</Text>
      <Text style={iiStyles.value}>{value}</Text>
    </View>
  );
}
const iiStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', gap: 4 },
  label: { fontSize: fontSize.xs, color: colors.textMuted },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.text, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  headerSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -8 },
  balanceBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  balanceText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  activeCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(46,204,113,0.3)',
    gap: spacing.sm,
  },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  activeTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, flex: 1 },
  activeName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  activeDetails: { flexDirection: 'row', gap: spacing.lg },
  activeDetailItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  activeDetailText: { fontSize: fontSize.sm, color: colors.textSecondary },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  machineCardWrap: { width: '31%' },
  machineCard: {
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...shadow.sm,
  },
  qualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  qualityText: { fontSize: 9, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
  machineName: { fontSize: 11, fontWeight: fontWeight.bold, color: '#fff', textAlign: 'center' },
  machineMultiplier: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  priceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: 2,
  },
  priceText: { fontSize: 10, fontWeight: fontWeight.bold, color: '#fff' },
  durationText: { fontSize: 9, color: 'rgba(255,255,255,0.5)' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContainer: { width: '100%', maxWidth: 360 },
  modalCard: { borderRadius: radius.xxl, padding: spacing.xl, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  modalClose: { position: 'absolute', top: spacing.md, right: spacing.md, padding: 4 },
  modalIconWrap: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  modalMachineName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.xs },
  modalDesc: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  modalInfoRow: { flexDirection: 'row', gap: spacing.md, width: '100%', marginBottom: spacing.md },
  priceBox: {
    width: '100%',
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.2)',
    marginBottom: spacing.lg,
    gap: 4,
  },
  priceBoxLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
  priceBoxAmount: { fontSize: fontSize.xxl, fontWeight: fontWeight.black, color: colors.primary },
  priceBoxBalance: { fontSize: fontSize.sm, color: colors.textMuted },
  rentBtn: { width: '100%', borderRadius: radius.full, overflow: 'hidden' },
  rentBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.full,
  },
  rentBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: '#000' },
});
