import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { walletService, Withdrawal } from '@/services/walletService';
import { APP_CONFIG } from '@/constants/config';
import { colors, gradients, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { formatRp, formatDateTime } from '@/utils/helpers';
import { useAlert } from '@/template';

const WALLET_TYPES = [
  { id: 'DANA', label: 'DANA', icon: 'credit-card-outline', color: '#0085FF' },
  { id: 'GOPAY', label: 'GoPay', icon: 'wallet', color: '#00AED6' },
];

export default function DompetScreen() {
  const insets = useSafeAreaInsets();
  const { user, balance, refreshProfile, adsCount } = useApp();
  const { showAlert } = useAlert();

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [walletType, setWalletType] = useState('DANA');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean; reason?: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [wds, elig] = await Promise.all([
      walletService.getWithdrawals(user.id),
      walletService.checkEligibility(user.id),
    ]);
    setWithdrawals(wds);
    setEligibility(elig);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const timer = setInterval(() => { loadData(); refreshProfile(); }, APP_CONFIG.autoRefreshInterval);
      return () => clearInterval(timer);
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadData(), refreshProfile()]);
    setRefreshing(false);
  }, [loadData, refreshProfile]);

  const handleSubmit = async () => {
    if (!user) return;
    const amtNum = parseInt(amount.replace(/\D/g, ''), 10);

    if (!accountName.trim()) {
      showAlert('Perhatian', 'Masukkan nama akun');
      return;
    }
    if (!accountNumber.trim()) {
      showAlert('Perhatian', 'Masukkan nomor akun');
      return;
    }
    if (!amtNum || amtNum < APP_CONFIG.minWithdrawal) {
      showAlert('Perhatian', `Minimal penarikan ${formatRp(APP_CONFIG.minWithdrawal)}`);
      return;
    }
    if (amtNum > balance) {
      showAlert('Perhatian', 'Nominal melebihi saldo');
      return;
    }

    setSubmitting(true);
    const { error } = await walletService.requestWithdrawal({
      userId: user.id,
      walletType,
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      amount: amtNum,
    });
    setSubmitting(false);

    if (error) {
      showAlert('Gagal', error);
    } else {
      setAccountName('');
      setAccountNumber('');
      setAmount('');
      await Promise.all([loadData(), refreshProfile()]);
      showAlert('Berhasil!', 'Permintaan penarikan sedang diproses (1x24 jam)');
    }
  };

  const canWithdraw = eligibility?.eligible && balance >= APP_CONFIG.minWithdrawal;

  return (
    <LinearGradient colors={['#050614', '#0A0B1E']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Text style={styles.headerTitle}>💰 DOMPET</Text>

          {/* Balance Card */}
          <LinearGradient colors={['#1a1d3a', '#0d0f25']} style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Saldo</Text>
            <Text style={styles.balanceAmount}>{formatRp(balance)}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <MaterialCommunityIcons name="counter" size={14} color={colors.primary} />
                <Text style={styles.balanceStatText}>{adsCount} / {APP_CONFIG.minAdsForWithdrawal} tugas</Text>
              </View>
              <View style={[styles.balanceStat, { gap: 4 }]}>
                <MaterialCommunityIcons
                  name={canWithdraw ? 'lock-open-outline' : 'lock-outline'}
                  size={14}
                  color={canWithdraw ? colors.accentGreen : colors.error}
                />
                <Text style={[styles.balanceStatText, { color: canWithdraw ? colors.accentGreen : colors.error }]}>
                  {canWithdraw ? 'Bisa Tarik' : 'Terkunci'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Requirements Banner */}
          {!canWithdraw && eligibility && (
            <LinearGradient colors={['#2a1010', '#1a0a0a']} style={styles.lockBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
              <Text style={styles.lockText}>{eligibility.reason}</Text>
            </LinearGradient>
          )}

          {/* Withdrawal Form */}
          <Text style={styles.sectionTitle}>Form Penarikan</Text>
          <LinearGradient colors={['#1E2040', '#161830']} style={styles.formCard}>
            {/* Wallet Type */}
            <Text style={styles.fieldLabel}>Metode Pembayaran</Text>
            <View style={styles.walletRow}>
              {WALLET_TYPES.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.walletBtn, walletType === w.id && { borderColor: w.color }]}
                  onPress={() => setWalletType(w.id)}
                  activeOpacity={0.8}
                >
                  {walletType === w.id && (
                    <LinearGradient
                      colors={[w.color + '33', w.color + '11']}
                      style={StyleSheet.absoluteFill}
                      borderRadius={radius.lg}
                    />
                  )}
                  <MaterialCommunityIcons name={w.icon as any} size={22} color={walletType === w.id ? w.color : colors.textMuted} />
                  <Text style={[styles.walletBtnText, walletType === w.id && { color: w.color }]}>{w.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormInput label="Nomor Akun" value={accountNumber} onChangeText={setAccountNumber} placeholder={`Masukkan nomor ${walletType}`} keyboardType="phone-pad" icon="phone-outline" />
            <FormInput label="Nama Pemilik" value={accountName} onChangeText={setAccountName} placeholder="Nama sesuai akun" icon="account-outline" />
            <FormInput
              label="Nominal (min. Rp25.000)"
              value={amount}
              onChangeText={(t) => setAmount(t.replace(/\D/g, ''))}
              placeholder="Masukkan nominal"
              keyboardType="numeric"
              icon="cash-multiple"
            />
            {amount.length > 0 && (
              <Text style={styles.amountPreview}>{formatRp(parseInt(amount || '0', 10))}</Text>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (!canWithdraw || submitting) && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={!canWithdraw || submitting}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={canWithdraw ? gradients.gold : ['#374151', '#1F2937']}
                style={styles.submitGrad}
              >
                <MaterialCommunityIcons
                  name={canWithdraw ? 'bank-transfer-out' : 'lock'}
                  size={20}
                  color={canWithdraw ? '#000' : colors.textMuted}
                />
                <Text style={[styles.submitText, { color: canWithdraw ? '#000' : colors.textMuted }]}>
                  {submitting ? 'Memproses...' : 'AJUKAN PENARIKAN'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>

          {/* Transaction History */}
          <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
          {withdrawals.length === 0 ? (
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="history" size={36} color={colors.textMuted} />
              <Text style={styles.emptyText}>Belum ada riwayat transaksi</Text>
            </View>
          ) : (
            withdrawals.map((item) => (
              <LinearGradient key={item.id} colors={['#1E2040', '#161830']} style={styles.txCard}>
                <View style={styles.txLeft}>
                  <MaterialCommunityIcons
                    name={item.wallet_type === 'DANA' ? 'credit-card-outline' : 'wallet'}
                    size={22}
                    color={item.wallet_type === 'DANA' ? '#0085FF' : '#00AED6'}
                  />
                  <View>
                    <Text style={styles.txName}>{item.account_name}</Text>
                    <Text style={styles.txMethod}>{item.wallet_type} · {item.account_number}</Text>
                    <Text style={styles.txDate}>{formatDateTime(item.created_at)}</Text>
                  </View>
                </View>
                <View style={styles.txRight}>
                  <Text style={styles.txAmount}>-{formatRp(item.amount)}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'sukses' ? 'rgba(46,204,113,0.1)' : 'rgba(232,53,53,0.1)' },
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: item.status === 'sukses' ? colors.accentGreen : colors.error },
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function FormInput({ label, value, onChangeText, placeholder, keyboardType, icon }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder: string; keyboardType?: any; icon: string;
}) {
  return (
    <View style={fiStyles.wrap}>
      <Text style={fiStyles.label}>{label}</Text>
      <View style={fiStyles.row}>
        <MaterialCommunityIcons name={icon as any} size={16} color={colors.primary} />
        <TextInput
          style={fiStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}
const fiStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: fontWeight.medium },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.bgDark, borderRadius: radius.md, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: fontSize.body, paddingVertical: 12, includeFontPadding: false },
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, gap: spacing.md },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  balanceCard: {
    padding: spacing.xl, borderRadius: radius.xxl, borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.2)', alignItems: 'center', gap: spacing.sm,
  },
  balanceLabel: { fontSize: fontSize.md, color: colors.textSecondary },
  balanceAmount: { fontSize: 36, fontWeight: fontWeight.black, color: colors.primary },
  balanceRow: { flexDirection: 'row', gap: spacing.lg },
  balanceStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  balanceStatText: { fontSize: fontSize.sm, color: colors.textSecondary },
  lockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(232,53,53,0.2)',
  },
  lockText: { fontSize: fontSize.sm, color: colors.error, flex: 1 },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textSecondary },
  formCard: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: fontWeight.medium },
  walletRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  walletBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border,
    overflow: 'hidden',
  },
  walletBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textMuted },
  amountPreview: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary, textAlign: 'center', marginBottom: spacing.sm },
  submitBtn: { marginTop: spacing.sm, borderRadius: radius.full, overflow: 'hidden' },
  submitGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: radius.full,
  },
  submitText: { fontSize: fontSize.body, fontWeight: fontWeight.bold },
  emptyBox: {
    alignItems: 'center', padding: spacing.xl, gap: spacing.sm,
    borderRadius: radius.lg, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
  },
  emptyText: { fontSize: fontSize.md, color: colors.textMuted },
  txCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
  },
  txLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  txName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  txMethod: { fontSize: fontSize.sm, color: colors.textSecondary },
  txDate: { fontSize: fontSize.xs, color: colors.textMuted },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.error },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: 'uppercase' },
});
