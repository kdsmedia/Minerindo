import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight } from '@/constants/theme';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <MaterialCommunityIcons name={name as any} size={24} color={color} />
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(245,197,24,0.12)',
  },
});

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0B1E',
          borderTopWidth: 1,
          borderTopColor: '#252640',
          height: Platform.select({
            ios: insets.bottom + 64,
            android: insets.bottom + 64,
            default: 70,
          }),
          paddingTop: 8,
          paddingBottom: Platform.select({
            ios: insets.bottom + 8,
            android: insets.bottom + 8,
            default: 8,
          }),
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#555577',
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="mesin"
        options={{
          title: 'Mesin',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cpu-64-bit" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bonus"
        options={{
          title: 'Bonus',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gift-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mining',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="pickaxe" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="dompet"
        options={{
          title: 'Dompet',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="wallet-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="akun"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="account-circle-outline" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
