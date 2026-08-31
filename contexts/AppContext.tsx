import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, UserProfile } from '@/services/authService';
import { getSupabaseClient } from '@/template';

interface AppContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  balance: number;
  adsCount: number;
  refreshProfile: () => Promise<void>;
  setBalance: (b: number) => void;
  setAdsCount: (n: number) => void;
  logout: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [adsCount, setAdsCount] = useState(0);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await authService.loadProfile(user.id);
    if (p) {
      setProfile(p);
      setBalance(p.balance || 0);
      setAdsCount(p.ads_count || 0);
    }
  }, [user]);

  useEffect(() => {
    const init = async () => {
      const session = await authService.getSession();
      if (session?.user) {
        setUser(session.user);
        const p = await authService.loadProfile(session.user.id);
        if (p) {
          setProfile(p);
          setBalance(p.balance || 0);
          setAdsCount(p.ads_count || 0);
        }
      }
      setLoading(false);
    };
    init();

    const sub = authService.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        const p = await authService.loadProfile(session.user.id);
        if (p) {
          setProfile(p);
          setBalance(p.balance || 0);
          setAdsCount(p.ads_count || 0);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setBalance(0);
        setAdsCount(0);
      }
    });

    return () => {
      if (sub && typeof sub.unsubscribe === 'function') sub.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
    setBalance(0);
    setAdsCount(0);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        profile,
        loading,
        balance,
        adsCount,
        refreshProfile,
        setBalance,
        setAdsCount,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
