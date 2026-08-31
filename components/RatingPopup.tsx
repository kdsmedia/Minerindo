import React, { useEffect, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { APP_CONFIG } from '@/constants/config';

const STORAGE_KEY = '@minerindo_last_rating_prompt';

export function RatingPopup() {
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const show = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.8, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  };

  const checkAndShow = async () => {
    try {
      const lastShown = await AsyncStorage.getItem(STORAGE_KEY);
      const now = Date.now();
      if (!lastShown || now - parseInt(lastShown, 10) >= APP_CONFIG.ratingPopupInterval) {
        await AsyncStorage.setItem(STORAGE_KEY, String(now));
        show();
      }
    } catch {}
  };

  useEffect(() => {
    const interval = setInterval(checkAndShow, APP_CONFIG.ratingPopupInterval);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleRate = async () => {
    hide();
    await Linking.openURL(APP_CONFIG.playstore);
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={hide}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={gradients.card} style={styles.card}>
            <TouchableOpacity style={styles.closeBtn} onPress={hide}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <MaterialCommunityIcons key={s} name="star" size={32} color={colors.primary} />
              ))}
            </View>

            <Text style={styles.title}>Suka MINERINDO?</Text>
            <Text style={styles.subtitle}>
              Berikan penilaian agar kami bisa terus meningkatkan layanan untuk kamu!
            </Text>

            <TouchableOpacity onPress={handleRate} activeOpacity={0.8}>
              <LinearGradient colors={gradients.gold} style={styles.rateBtn}>
                <MaterialCommunityIcons name="star-circle" size={18} color="#000" />
                <Text style={styles.rateBtnText}>Beri Rating</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={hide} style={styles.laterBtn}>
              <Text style={styles.laterText}>Nanti saja</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  container: { width: '100%', maxWidth: 340 },
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: 4,
  },
  starRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  rateBtnText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: '#000',
  },
  laterBtn: { padding: spacing.sm },
  laterText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
});
