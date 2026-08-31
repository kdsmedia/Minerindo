import { getSupabaseClient } from '@/template';
import { APP_CONFIG } from '@/constants/config';

export interface Withdrawal {
  id: string;
  user_id: string;
  wallet_type: string;
  account_name: string;
  account_number: string;
  amount: number;
  status: string;
  created_at: string;
  processed_at: string | null;
}

export const walletService = {
  async getWithdrawals(userId: string): Promise<Withdrawal[]> {
    const supabase = getSupabaseClient();

    // Update status of old "menunggu" withdrawals to "sukses"
    await supabase.rpc('update_withdrawal_status', { user_id_param: userId });

    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data || []) as Withdrawal[];
  },

  async checkEligibility(userId: string): Promise<{ eligible: boolean; reason?: string }> {
    const supabase = getSupabaseClient();

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('balance, ads_count, last_withdrawal')
      .eq('id', userId)
      .single();

    if (!profile) return { eligible: false, reason: 'Profil tidak ditemukan' };

    if ((profile.ads_count || 0) < APP_CONFIG.minAdsForWithdrawal) {
      return {
        eligible: false,
        reason: `Selesaikan ${APP_CONFIG.minAdsForWithdrawal} tugas terlebih dahulu (${profile.ads_count || 0}/${APP_CONFIG.minAdsForWithdrawal})`,
      };
    }

    if ((profile.balance || 0) < APP_CONFIG.minWithdrawal) {
      return {
        eligible: false,
        reason: `Saldo minimum Rp${APP_CONFIG.minWithdrawal.toLocaleString('id-ID')}`,
      };
    }

    if (profile.last_withdrawal) {
      const lastDate = new Date(profile.last_withdrawal);
      const today = new Date();
      if (
        lastDate.getDate() === today.getDate() &&
        lastDate.getMonth() === today.getMonth() &&
        lastDate.getFullYear() === today.getFullYear()
      ) {
        return { eligible: false, reason: 'Penarikan hanya 1x per hari' };
      }
    }

    return { eligible: true };
  },

  async requestWithdrawal(params: {
    userId: string;
    walletType: string;
    accountName: string;
    accountNumber: string;
    amount: number;
  }) {
    const supabase = getSupabaseClient();

    const eligible = await walletService.checkEligibility(params.userId);
    if (!eligible.eligible) return { error: eligible.reason, data: null };

    // Deduct balance
    const { data: deducted } = await supabase.rpc('deduct_balance', {
      user_id_param: params.userId,
      amount: params.amount,
    });

    if (!deducted) return { error: 'Saldo tidak mencukupi', data: null };

    const { data, error } = await supabase
      .from('withdrawals')
      .insert({
        user_id: params.userId,
        wallet_type: params.walletType,
        account_name: params.accountName,
        account_number: params.accountNumber,
        amount: params.amount,
        status: 'menunggu',
      })
      .select()
      .single();

    if (error) return { error: error.message, data: null };

    // Update last_withdrawal date
    await supabase
      .from('user_profiles')
      .update({ last_withdrawal: new Date().toISOString() })
      .eq('id', params.userId);

    // Send Telegram notification
    await walletService.sendTelegramNotification({
      walletType: params.walletType,
      accountName: params.accountName,
      accountNumber: params.accountNumber,
      amount: params.amount,
    });

    return { data, error: null };
  },

  async sendTelegramNotification(params: {
    walletType: string;
    accountName: string;
    accountNumber: string;
    amount: number;
  }) {
    try {
      const supabase = getSupabaseClient();
      await supabase.functions.invoke('send-telegram', {
        body: params,
      });
    } catch {
      // Silent fail — notification is non-critical
    }
  },

  async doCheckin(userId: string) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('do_checkin', {
      user_id_param: userId,
    });

    if (error) return { success: false, error: error.message };
    return { success: !!data, error: null };
  },

  async incrementAds(userId: string) {
    const supabase = getSupabaseClient();
    await supabase.rpc('increment_ads_count', { user_id_param: userId });
  },

  async getTodayCheckin(userId: string) {
    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('checkin_history')
      .select('*')
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .maybeSingle();

    return !!data;
  },

  async getCheckinStreak(userId: string) {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('checkin_history')
      .select('checkin_date')
      .eq('user_id', userId)
      .order('checkin_date', { ascending: false })
      .limit(30);

    return (data || []).length;
  },
};
