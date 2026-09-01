import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/services/authService';
import { useAlert } from '@/template';
import { colors, gradients, spacing, radius, fontSize, fontWeight, shadow } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regReferral, setRegReferral] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const switchMode = (toLogin: boolean) => {
    if (toLogin === isLogin) return;
    Animated.timing(slideAnim, {
      toValue: toLogin ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsLogin(toLogin));
  };

  const handleLogin = async () => {
    if (!loginPhone.trim() || !loginPassword.trim()) {
      showAlert('Perhatian', 'Isi nomor dan sandi terlebih dahulu');
      return;
    }
    setLoading(true);
    const { error } = await authService.login({
      phone: loginPhone.trim(),
      password: loginPassword,
    });
    setLoading(false);
    if (error) {
      showAlert('Login Gagal', error);
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regPhone.trim() || !regPassword || !regConfirm) {
      showAlert('Perhatian', 'Lengkapi semua data pendaftaran');
      return;
    }
    if (regPassword !== regConfirm) {
      showAlert('Perhatian', 'Sandi dan konfirmasi sandi tidak cocok');
      return;
    }
    if (regPassword.length < 6) {
      showAlert('Perhatian', 'Sandi minimal 6 karakter');
      return;
    }
    const cleanPhone = regPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      showAlert('Perhatian', 'Nomor ponsel tidak valid');
      return;
    }
    setLoading(true);
    const { error } = await authService.register({
      name: regName.trim(),
      phone: cleanPhone,
      password: regPassword,
      referralCode: regReferral.trim() || undefined,
    });
    setLoading(false);
    if (error) {
      let msg = error;
      if (error.includes('already registered') || error.includes('already been registered')) {
        msg = 'Nomor ini sudah terdaftar, silakan login';
      }
      showAlert('Pendaftaran Gagal', msg);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <LinearGradient colors={['#050614', '#0A0B1E', '#111228']} style={styles.bg}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoWrap}>
            <Image
              source={{ uri: 'https://cdn-ai.onspace.ai/onspace/files/S7hXUesfWc3UCFsbRQ35PU/file_00000000f2bc820bb6ff8c504b7e7369.png' }}
              style={styles.logo}
              contentFit="contain"
              transition={300}
            />
            <Text style={styles.tagline}>Platform Mining Digital Indonesia</Text>
          </View>

          {/* Toggle */}
          <View style={styles.toggleWrap}>
            <TouchableOpacity
              style={[styles.toggleBtn, isLogin && styles.toggleActive]}
              onPress={() => { setIsLogin(true); }}
              activeOpacity={0.8}
            >
              {isLogin && <LinearGradient colors={gradients.gold} style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]} />}
              <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>MASUK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, !isLogin && styles.toggleActive]}
              onPress={() => { setIsLogin(false); }}
              activeOpacity={0.8}
            >
              {!isLogin && <LinearGradient colors={gradients.gold} style={[StyleSheet.absoluteFill, { borderRadius: radius.full }]} />}
              <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>DAFTAR</Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <LinearGradient colors={['#1E2040', '#161830']} style={styles.cardGradient}>
              {isLogin ? (
                <>
                  <Text style={styles.formTitle}>Selamat Datang Kembali</Text>
                  <InputField
                    label="Nomor Ponsel"
                    icon="cellphone"
                    value={loginPhone}
                    onChangeText={setLoginPhone}
                    keyboardType="phone-pad"
                    placeholder="Contoh: 08123456789"
                  />
                  <InputField
                    label="Sandi"
                    icon="lock-outline"
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secure={!showLoginPass}
                    placeholder="Masukkan sandi"
                    rightIcon={showLoginPass ? 'eye-off' : 'eye'}
                    onRightPress={() => setShowLoginPass(!showLoginPass)}
                  />
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleLogin}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <LinearGradient colors={gradients.gold} style={styles.submitGradient}>
                      {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="login" size={20} color="#000" />
                          <Text style={styles.submitText}>MASUK</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.formTitle}>Buat Akun Baru</Text>
                  <InputField
                    label="Nama Lengkap"
                    icon="account-outline"
                    value={regName}
                    onChangeText={setRegName}
                    placeholder="Masukkan nama lengkap"
                  />
                  <InputField
                    label="Nomor Ponsel"
                    icon="cellphone"
                    value={regPhone}
                    onChangeText={setRegPhone}
                    keyboardType="phone-pad"
                    placeholder="Contoh: 08123456789"
                  />
                  <InputField
                    label="Sandi"
                    icon="lock-outline"
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secure={!showRegPass}
                    placeholder="Min. 6 karakter"
                    rightIcon={showRegPass ? 'eye-off' : 'eye'}
                    onRightPress={() => setShowRegPass(!showRegPass)}
                  />
                  <InputField
                    label="Konfirmasi Sandi"
                    icon="lock-check-outline"
                    value={regConfirm}
                    onChangeText={setRegConfirm}
                    secure={!showRegPass}
                    placeholder="Ulangi sandi"
                  />
                  <InputField
                    label="Kode Referral (Opsional)"
                    icon="ticket-outline"
                    value={regReferral}
                    onChangeText={setRegReferral}
                    placeholder="Masukkan kode referral"
                    keyboardType="numeric"
                  />
                  {regReferral.length > 0 && (
                    <View style={styles.referralNote}>
                      <MaterialCommunityIcons name="gift" size={14} color={colors.accentGreen} />
                      <Text style={styles.referralNoteText}>Kamu dan pemberi kode masing-masing mendapat bonus Rp500</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleRegister}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <LinearGradient colors={gradients.gold} style={styles.submitGradient}>
                      {loading ? (
                        <ActivityIndicator color="#000" size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="account-plus" size={20} color="#000" />
                          <Text style={styles.submitText}>DAFTAR SEKARANG</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </LinearGradient>
          </View>

          <Text style={styles.footer}>© 2024 ALTOMEDIA · MINERINDO v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function InputField({
  label, icon, value, onChangeText, placeholder, secure, keyboardType, rightIcon, onRightPress,
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: any;
  rightIcon?: string;
  onRightPress?: () => void;
}) {
  return (
    <View style={iStyles.wrap}>
      <Text style={iStyles.label}>{label}</Text>
      <View style={iStyles.inputRow}>
        <MaterialCommunityIcons name={icon as any} size={18} color={colors.primary} style={iStyles.icon} />
        <TextInput
          style={iStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={iStyles.rightIcon}>
            <MaterialCommunityIcons name={rightIcon as any} size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const iStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 6, fontWeight: fontWeight.medium },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.body,
    paddingVertical: 14,
    includeFontPadding: false,
  },
  rightIcon: { padding: 4 },
});

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scroll: { paddingHorizontal: spacing.lg, alignItems: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { width: 120, height: 120, borderRadius: 28 },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 0.5,
  },
  toggleWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  toggleActive: {},
  toggleText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  toggleTextActive: { color: '#000', fontWeight: fontWeight.bold },
  card: { width: '100%', borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, ...shadow.md },
  cardGradient: { padding: spacing.lg },
  formTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  submitBtn: { marginTop: spacing.md, borderRadius: radius.full, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: radius.full,
  },
  submitText: { fontSize: fontSize.body, fontWeight: fontWeight.bold, color: '#000' },
  referralNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(46,204,113,0.1)',
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
  },
  referralNoteText: { fontSize: fontSize.xs, color: colors.accentGreen, flex: 1 },
  footer: { marginTop: spacing.xl, fontSize: fontSize.xs, color: colors.textMuted },
});
