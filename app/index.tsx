import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/hooks/useApp';
import { colors, gradients } from '@/constants/theme';

export default function RootScreen() {
  const { user, loading } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [user, loading]);

  return (
    <LinearGradient colors={gradients.darkDeep} style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
