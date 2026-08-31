import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Modal,
  Linking,
  Share,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApp } from '@/hooks/useApp';
import { APP_CONFIG } from '@/constants/config';
import { colors, gradients, spacing, radius, fontSize, fontWeight } from '@/constants/theme';
import { formatRp, getReferralCode } from '@/utils/helpers';
import { useAlert } from '@/template';

type InfoModal = 'about' | 'privacy' | 'disclaimer' | 'terms' | null;

const MODAL_CONTENT: Record<string, { title: string; body: string }> = {
  about: {
    title: 'Tentang MINERINDO',
    body: `MINERINDO adalah platform penambangan digital yang memungkinkan pengguna mengumpulkan aset dari berbagai jenis mineral virtual.\n\nDikembangkan oleh ALTOMEDIA, MINERINDO hadir sebagai solusi earning digital yang mudah, menyenangkan, dan terpercaya untuk semua kalangan.\n\nVersi: 1.0.0\nDeveloper: ALTOMEDIA\nKontak: altomediaindonesia@gmail.com\nPackage: com.altomedia.minerindo`,
  },
  privacy: {
    title: 'Kebijakan Privasi',
    body: `Kebijakan Privasi MINERINDO\n\nKami di ALTOMEDIA berkomitmen untuk melindungi privasi pengguna kami.\n\n1. Data yang Dikumpulkan\nKami mengumpulkan nama, nomor ponsel, dan data aktivitas dalam aplikasi untuk keperluan layanan.\n\n2. Penggunaan Data\nData digunakan untuk memberikan layanan terbaik, keamanan akun, dan peningkatan fitur.\n\n3. Keamanan Data\nData disimpan dengan enkripsi standar industri dan tidak dibagikan kepada pihak ketiga tanpa izin.\n\n4. Hak Pengguna\nPengguna berhak mengakses, mengubah, atau menghapus data pribadi mereka kapan saja.\n\nHubungi kami: altomediaindonesia@gmail.com`,
  },
  disclaimer: {
    title: 'Disclaimer',
    body: `Disclaimer MINERINDO\n\nMINERINDO adalah aplikasi hiburan dan permainan digital.\n\n1. MINERINDO bukan instrumen investasi keuangan resmi.\n\n2. Penghasilan dalam aplikasi berupa saldo digital yang dapat ditarik sesuai syarat yang berlaku.\n\n3. ALTOMEDIA tidak bertanggung jawab atas kerugian yang timbul dari penggunaan aplikasi di luar ketentuan yang berlaku.\n\n4. Penarikan saldo tunduk pada verifikasi dan dapat diproses dalam waktu 1x24 jam.\n\n5. ALTOMEDIA berhak mengubah ketentuan layanan sewaktu-waktu tanpa pemberitahuan sebelumnya.\n\nDengan menggunakan MINERINDO, Anda menyetujui disclaimer ini.`,
  },
  terms: {
    title: 'Syarat & Ketentuan',
    body: `Syarat & Ketentuan MINERINDO\n\n1. Pendaftaran\nPengguna wajib mendaftar dengan data yang valid dan bertanggung jawab atas keamanan akun.\n\n2. Penggunaan\nDilarang menggunakan aplikasi untuk tujuan ilegal, penipuan, atau penyalahgunaan sistem.\n\n3. Saldo & Penarikan\nSaldo diperoleh melalui aktivitas dalam aplikasi. Penarikan dilakukan sesuai ketentuan yang berlaku.\n\n4. Referral\nProgram referral memberikan bonus kepada pengguna yang mengajak teman mendaftar.\n\n5. Penutupan Akun\nALTOMEDIA berhak menutup akun yang melanggar ketentuan tanpa pemberitahuan.\n\n6. Perubahan\nKetentuan dapat berubah sewaktu-waktu. Pengguna bertanggung jawab memantau perubahan.\n\nDengan mendaftar, Anda menyetujui syarat dan ketentuan ini.`,
  },
};

export default function AkunScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, balance, refreshProfile, logout } = useApp();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState<InfoModal>(null);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      const timer = setInterval(refreshProfile, APP_CONFIG.autoRefreshInterval);
      return () => clearInterval(timer);
    }, [refreshProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  }, [refreshProfile]);

  const phone = profile?.phone || '';
  const referralCode = profile?.referral_code || getReferralCode(phone);
  const referralLink = `${APP_CONFIG.playstore}&referral=${referralCode}`;
  const userId = referralCode;

  const copyToClipboard = (text: string, label: string) => {
    Clipboard.setString(text);
    showAlert('Disalin!', `${label} berhasil disalin ke clipboard`);
  };

  const shareReferral = async () => {
    await Share.share({
      message: `Bergabunglah di MINERINDO! Gunakan kode referral saya: ${referralCode}\nDaftar di: ${referralLink}`,
      title: 'Ajak Teman ke MINERINDO',
    });
  };

  const handleLogout = () => {
    showAlert('Keluar', 'Yakin ingin keluar dari akun?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
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
        <Text style={styles.headerTitle}>👤 AKUN</Text>

        {/* Profile Card */}
        <LinearGradient colors={['#1a1d3a', '#0d0f25']} style={styles.profileCard}>
          <LinearGradient colors={gradients.gold} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(profile?.full_name || 'U')[0].toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{profile?.full_name || 'Pengguna'}</Text>
            <Text style={styles.profilePhone}>{phone || '-'}</Text>
            <LinearGradient colors={gradients.gold} style={styles.balanceMini}>
              <Text style={styles.balanceMiniText}>{formatRp(balance)}</Text>
            </LinearGradient>
          </View>
        </LinearGradient>

        {/* ID & Referral */}
        <LinearGradient colors={['#1E2040', '#161830']} style={styles.refCard}>
          <View style={styles.refRow}>
            <MaterialCommunityIcons name="identifier" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.refLabel}>ID Pengguna</Text>
              <Text style={styles.refValue}>{userId}</Text>
            </View>
            <TouchableOpacity onPress={() => copyToClipboard(userId, 'ID')} style={styles.copyBtn}>
              <MaterialCommunityIcons name="content-copy" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.refRow}>
            <MaterialCommunityIcons name="ticket-percent" size={18} color={colors.accentGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.refLabel}>Kode Referral</Text>
              <Text style={styles.refValue}>{referralCode}</Text>
              <Text style={styles.refSub}>Teman daftar = {formatRp(500)} untuk masing-masing</Text>
            </View>
            <TouchableOpacity onPress={() => copyToClipboard(referralCode, 'Kode referral')} style={styles.copyBtn}>
              <MaterialCommunityIcons name="content-copy" size={18} color={colors.accentGreen} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={shareReferral} activeOpacity={0.85}>
            <LinearGradient colors={gradients.success} style={styles.shareBtn}>
              <MaterialCommunityIcons name="share-variant" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>Bagikan Link Referral</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard icon="account-group" label="Teman Diundang" value={String(profile?.invited_count || 0)} color={colors.accentBlue} />
          <StatCard icon="counter" label="Total Tugas" value={String(profile?.ads_count || 0)} color={colors.primary} />
        </View>

        {/* AdMob Banner */}
        <View style={styles.adBanner}>
          <Text style={styles.adText}>◆ MINERINDO by ALTOMEDIA</Text>
        </View>

        {/* Info Links */}
        <Text style={styles.sectionTitle}>Informasi</Text>
        <LinearGradient colors={['#1E2040', '#161830']} style={styles.linksCard}>
          {[
            { key: 'about', icon: 'information-outline', label: 'Tentang Aplikasi' },
            { key: 'privacy', icon: 'shield-outline', label: 'Kebijakan Privasi' },
            { key: 'disclaimer', icon: 'alert-outline', label: 'Disclaimer' },
            { key: 'terms', icon: 'file-document-outline', label: 'Syarat & Ketentuan' },
          ].map((item, idx, arr) => (
            <React.Fragment key={item.key}>
              <TouchableOpacity
                style={styles.linkItem}
                onPress={() => setModal(item.key as InfoModal)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.textSecondary} />
                <Text style={styles.linkLabel}>{item.label}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </LinearGradient>

        {/* Social */}
        <Text style={styles.sectionTitle}>Hubungi Kami</Text>
        <TouchableOpacity
          onPress={() => Linking.openURL(APP_CONFIG.whatsapp)}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#075E54', '#128C7E']} style={styles.waBtn}>
            <MaterialCommunityIcons name="whatsapp" size={24} color="#fff" />
            <Text style={styles.waBtnText}>Ikuti Channel WhatsApp</Text>
            <MaterialCommunityIcons name="open-in-new" size={16} color="rgba(255,255,255,0.7)" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Contact */}
        <TouchableOpacity
          onPress={() => Linking.openURL(`mailto:${APP_CONFIG.contact}`)}
          style={styles.contactBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="email-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.contactText}>{APP_CONFIG.contact}</Text>
        </TouchableOpacity>

        {/* Logout */}
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.85}>
          <LinearGradient colors={['#2a0a0a', '#1a0505']} style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Keluar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.version}>MINERINDO v1.0 · © 2024 ALTOMEDIA</Text>
      </ScrollView>

      {/* Info Modal */}
      <Modal visible={!!modal} transparent animationType="slide" onRequestClose={() => setModal(null)}>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={['#1E2040', '#161830']} style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modal ? MODAL_CONTENT[modal]?.title : ''}</Text>
              <TouchableOpacity onPress={() => setModal(null)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBody}>{modal ? MODAL_CONTENT[modal]?.body : ''}</Text>
            </ScrollView>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <LinearGradient colors={['#1E2040', '#161830']} style={scStyles.card}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text style={[scStyles.value, { color }]}>{value}</Text>
      <Text style={scStyles.label}>{label}</Text>
    </LinearGradient>
  );
}
const scStyles = StyleSheet.create({
  card: {
    flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: radius.lg,
    gap: 4, borderWidth: 1, borderColor: colors.border,
  },
  value: { fontSize: fontSize.xl, fontWeight: fontWeight.black },
  label: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.md, gap: spacing.md },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.black, color: colors.text },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    padding: spacing.xl, borderRadius: radius.xxl, borderWidth: 1, borderColor: 'rgba(245,197,24,0.2)',
  },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, fontWeight: fontWeight.black, color: '#000' },
  profileName: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  profilePhone: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: 8 },
  balanceMini: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, alignSelf: 'flex-start' },
  balanceMiniText: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: '#000' },
  refCard: { padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, gap: spacing.md },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  refLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  refValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text },
  refSub: { fontSize: fontSize.xs, color: colors.accentGreen, marginTop: 2 },
  copyBtn: { padding: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: spacing.md, borderRadius: radius.full, marginTop: spacing.xs,
  },
  shareBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: '#fff' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
  adBanner: {
    backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: colors.border, minHeight: 60, justifyContent: 'center',
  },
  adText: { fontSize: fontSize.sm, color: colors.textMuted },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.textSecondary },
  linksCard: { borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  linkItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  linkLabel: { flex: 1, fontSize: fontSize.body, color: colors.text },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg, borderRadius: radius.xl,
  },
  waBtnText: { flex: 1, fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: '#fff' },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    justifyContent: 'center', padding: spacing.sm,
  },
  contactText: { fontSize: fontSize.sm, color: colors.textSecondary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    padding: spacing.lg, borderRadius: radius.xl, borderWidth: 1, borderColor: 'rgba(232,53,53,0.3)',
  },
  logoutText: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: colors.error },
  version: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: {
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xl, maxHeight: '80%', borderWidth: 1, borderColor: colors.border,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  modalClose: { padding: 4 },
  modalBody: { fontSize: fontSize.body, color: colors.textSecondary, lineHeight: 24, paddingBottom: spacing.xl },
});
