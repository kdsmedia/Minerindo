import { getSupabaseClient } from '@/template';

export interface MiningSession {
  id?: string;
  user_id: string;
  coin_type: string;
  coin_name: string;
  start_time?: string;
  end_time?: string;
  hashrate: number;
  earned_rp: number;
  machine_name?: string;
  is_active: boolean;
  created_at?: string;
}

export interface MachineRental {
  id: string;
  user_id: string;
  machine_id: string;
  machine_name: string;
  machine_quality: string;
  price: number;
  duration_minutes: number;
  multiplier: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export const miningService = {
  async startSession(session: Omit<MiningSession, 'id' | 'created_at'>) {
    const supabase = getSupabaseClient();
    // Deactivate any previous active sessions
    await supabase
      .from('mining_sessions')
      .update({ is_active: false, end_time: new Date().toISOString() })
      .eq('user_id', session.user_id)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('mining_sessions')
      .insert({ ...session, is_active: true })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  async stopSession(sessionId: string, earnedRp: number, hashrate: number) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('mining_sessions')
      .update({
        is_active: false,
        end_time: new Date().toISOString(),
        earned_rp: earnedRp,
        hashrate,
      })
      .eq('id', sessionId);

    return { error: error?.message || null };
  },

  async getActiveMiningSession(userId: string) {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    return data as MiningSession | null;
  },

  async getMiningHistory(userId: string, limit = 20) {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('mining_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []) as MiningSession[];
  },

  async rentMachine(rental: {
    user_id: string;
    machine_id: string;
    machine_name: string;
    machine_quality: string;
    price: number;
    duration_minutes: number;
    multiplier: number;
  }) {
    const supabase = getSupabaseClient();

    // Deduct balance first
    const { data: deducted } = await supabase.rpc('deduct_balance', {
      user_id_param: rental.user_id,
      amount: rental.price,
    });

    if (!deducted) return { error: 'Saldo tidak mencukupi', data: null };

    const endTime = new Date(Date.now() + rental.duration_minutes * 60 * 1000).toISOString();

    // Deactivate old rentals
    await supabase
      .from('machine_rentals')
      .update({ is_active: false })
      .eq('user_id', rental.user_id)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('machine_rentals')
      .insert({ ...rental, end_time: endTime, is_active: true })
      .select()
      .single();

    return { data, error: error?.message || null };
  },

  async getActiveRental(userId: string) {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('machine_rentals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('end_time', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data as MachineRental | null;
  },

  async getRentalHistory(userId: string, limit = 10) {
    const supabase = getSupabaseClient();
    const { data } = await supabase
      .from('machine_rentals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []) as MachineRental[];
  },

  async addMiningBalance(userId: string, amount: number) {
    const supabase = getSupabaseClient();
    await supabase.rpc('add_mining_balance', {
      user_id_param: userId,
      amount,
    });
  },
};
