import { getSupabaseClient } from '@/template';
import { getPhoneEmail, getReferralCode } from '@/utils/helpers';

export interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string;
  username: string | null;
  referral_code: string | null;
  balance: number;
  ads_count: number;
  last_checkin: string | null;
  last_withdrawal: string | null;
  invited_count: number;
  invited_by: string | null;
}

export interface RegisterParams {
  name: string;
  phone: string;
  password: string;
  referralCode?: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export const authService = {
  async register({ name, phone, password, referralCode }: RegisterParams) {
    const supabase = getSupabaseClient();
    const email = getPhoneEmail(phone);
    const code = getReferralCode(phone);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone, referral_code: code },
      },
    });

    if (authError) return { error: authError.message, user: null };
    if (!authData.user) return { error: 'Gagal membuat akun', user: null };

    // Update user_profiles with all fields
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        full_name: name,
        phone: phone.replace(/\D/g, ''),
        referral_code: code,
        balance: 0,
        ads_count: 0,
        invited_count: 0,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      // Try insert if update fails
      await supabase.from('user_profiles').insert({
        id: authData.user.id,
        email,
        full_name: name,
        phone: phone.replace(/\D/g, ''),
        referral_code: code,
        balance: 0,
        ads_count: 0,
        invited_count: 0,
      });
    }

    // Process referral if provided
    if (referralCode && referralCode.trim().length >= 6) {
      await supabase.rpc('process_referral_reward', {
        referrer_code: referralCode.trim(),
        new_user_id: authData.user.id,
      });
    }

    return { error: null, user: authData.user };
  },

  async login({ phone, password }: LoginParams) {
    const supabase = getSupabaseClient();
    const email = getPhoneEmail(phone);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let msg = error.message;
      if (msg.includes('Invalid login')) msg = 'Nomor atau sandi salah';
      if (msg.includes('Email not confirmed')) msg = 'Akun belum dikonfirmasi';
      return { error: msg, user: null };
    }

    return { error: null, user: data.user };
  },

  async logout() {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    return { error: error?.message || null };
  },

  async loadProfile(userId: string): Promise<UserProfile | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data as UserProfile;
  },

  async getSession() {
    const supabase = getSupabaseClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const supabase = getSupabaseClient();
    const { data } = supabase.auth.onAuthStateChange(callback);
    return data.subscription;
  },
};
