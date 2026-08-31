import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { adminService, AdminUser } from '@/services/adminService';
import { colors, gradients, spacing, radius, fontSize, fontWeight, shadow } from '@/constants/theme';
import { formatRp } from '@/utils/helpers';
import { useAlert } from '@/template';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deltaInput, setDeltaInput] = useState('');

  const loadData = useCallback(async () => {
    try {
      const list = await adminService.listUsers();
      setUsers(list);
    } catch (e: any) {
      showAlert('Gagal', e?.message || 'Tidak dapat memuat data');
    }
  }, [showAlert]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSetBalance = async () => {
    if (!editUser) return;
    const raw = deltaInput.replace(/[^0-9-]/g, '');
    const delta = parseInt(raw || '0', 10);
    if (delta === 0) {
      showAlert('Perhatian', 'Masukkan nominal (gunakan tanda minus untuk potong saldo)');
      return;
    }
    try {
      await adminService.setBalance(editUser.id, delta);
      if (delta > 0) {
        showAlert('Berhasil', `Saldo ${editUser.full_name || 'user'} ditambah ${formatRp(delta)}`);
      } else {
        showAlert('Berhasil', `Saldo ${editUser.full_name || 'user'} dikurangi ${formatRp(Math.abs(delta))}`);
      }
      setEditUser(null);
      setDeltaInput('');
      await loadData();
    } catch (e: any) {
      showAlert('Gagal', e?.message || 'Tidak dapat mengubah saldo');
    }
  };

  const handleToggleBlock = async (u: AdminUser) => {
    try {
      const blocked = await adminService.toggleBlock(u.id);
      showAlert('Berhasil', `${u.full_name || 'User'} kini ${blocked ? 'diblokir' : 'tidak diblokir'}`);
      await loadData();
    } catch (e: any) {
      showAlert('Gagal', e?.message || 'Gagal mengubah status blokir');
    }
  };

  const handleDelete = (u: AdminUser) => {
    Alert.alert('Hapus Akun', `Yakin hapus akun ${u.full_name || 'user'} (${u.phone || u.referral_code || u.id})?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminService.deleteUser(u.id);
            showAlert('Berhasil', 'Akun dihapus');
            await loadData();
          } catch (e: any) {
            showAlert('Gagal', e?.message || 'Gagal menghapus akun');
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#050614', '#0A0B1E']} style={styles.bg}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ADMIN</Text>
          <View style={{ width: 32 }} />
        </View>
        <Text style={styles.headerSub}>Kelola pengguna MINERINDO</Text>

        {users.map((u) => (
          <LinearGradient key={u.id} colors={['#1E2040', '#161830']} style={styles.userCard}>
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(u.full_name || 'U')[0].toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.userName}>{u.full_name || 'Tanpa nama'}</Text>
                <Text style={styles.userMeta}>{u.phone || '-'} · ID {u.referral_code || '-'}</Text>
                <Text style={styles.userMeta2}>
                  {u.is_admin ? 'ADMIN · ' : ''}{u.is_blocked ? 'Diblokir' : 'Aktif'}
                </Text>
              </View>
              <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel}>Saldo</Text>
                <Text style={styles.balanceValue}>{formatRp(u.balance)}</Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.primary }]}
                onPress={() => { setEditUser(u); setDeltaInput(''); }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="currency-usd" size={16} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>Saldo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: u.is_blocked ? colors.accentGreen : colors.warning }]}
                onPress={() => handleToggleBlock(u)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={u.is_blocked ? 'lock-open-outline' : 'lock-outline'}
                  size={16}
                  color={u.is_blocked ? colors.accentGreen : colors.warning}
                />
                <Text style={[styles.actionText, { color: u.is_blocked ? colors.accentGreen : colors.warning }]}>
                  {u.is_blocked ? 'Buka Blokir' : 'Blokir'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { borderColor: colors.error }]}
                onPress={() => handleDelete(u)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={colors.error} />
                <Text style={[styles.actionText, { color: colors.error }]}>Hapus</Text>
              </TouchableOpacity>
            </View>

            {editUser?.id === u.id && (
              <View style={styles.editBox}>
                <Text style={styles.editLabel}>
                  Ubah saldo {editUser.full_name || 'user'} (gunakan tanda minus untuk potong:
                </Text>
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.editInput}
                    value={deltaInput}
                    onChangeText={(t) => setDeltaInput(t.replace(/[^0-9-]/g, ''))}
                    placeholder="Contoh: 10000 atau -5000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.editSave} onPress={handleSetBalance} activeOpacity={0.85}>
                    <LinearGradient colors={gradients.gold} style={styles.editSaveGrad}>
                      <Text style={styles.editSaveText}>Simpan</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editCancel}
                    onPress={() => { setEditUser(null); setDeltaInput(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.editCancelText}>Batal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </LinearGradient>
        ))}
        {users.length === 0 && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="account-search-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>Belum ada pengguna</Text>
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { paddingHorizontal: spacing.md, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  headerSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: -8 },
  userCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    ...shadow.sm,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgCardLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontWeight: fontWeight.black, color: colors.primary },
  userName: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: colors.text },
  userMeta: { fontSize: fontSize.xs, color: colors.textSecondary },
  userMeta2: { fontSize: fontSize.xs, color: colors.textMuted },
  balanceBox: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  balanceValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  actionText: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  editBox: {
    backgroundColor: colors.bgDark,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editInput: {
    flex: 1,
    backgroundColor: colors.bgCard,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: fontSize.md,
  },
  editSave: { borderRadius: radius.md, overflow: 'hidden' },
  editSaveGrad: { paddingHorizontal: spacing.lg, paddingVertical: 10 },
  editSaveText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  editCancel: { paddingHorizontal: spacing.sm },
  editCancelText: { fontSize: fontSize.sm, color: colors.textMuted },
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
});