import { getSupabaseClient } from '@/template';

export interface AdminUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  referral_code: string | null;
  balance: number;
  ads_count: number;
  is_blocked: boolean;
  is_admin: boolean;
  invited_count: number;
  created_at: string;
}

export const adminService = {
  async listUsers(): Promise<AdminUser[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('admin_list_users');
    if (error) {
      console.warn('[Admin] listUsers error:', error.message);
      throw new Error(error.message);
    }
    return (data || []) as AdminUser[];
  },

  async setBalance(userId: string, delta: number): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('admin_set_balance', {
      target_user_id: userId,
      delta,
    });
    if (error) throw new Error(error.message);
  },

  async deleteUser(userId: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('admin_delete_user', {
      target_user_id: userId,
    });
    if (error) throw new Error(error.message);
  },

  async toggleBlock(userId: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('admin_toggle_block', {
      target_user_id: userId,
    });
    if (error) throw new Error(error.message);
    return !!data;
  },
};