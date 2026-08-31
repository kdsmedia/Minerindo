import { getSupabaseClient } from '@/template';

export const rewardService = {
  async claimRentTask(userId: string): Promise<number> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('rent_task_reward', {
      user_id_param: userId,
    });
    if (error) throw new Error(error.message);
    return Number(data || 0);
  },

  async claimInviteTask(userId: string): Promise<number> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('claim_invite_reward', {
      user_id_param: userId,
    });
    if (error) throw new Error(error.message);
    return Number(data || 0);
  },
};