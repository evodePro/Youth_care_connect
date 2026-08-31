/**
 * YouthCare Connect — Cycle Tracker Supabase Client
 * Handles all database interactions for the cycle tracker feature.
 * Strictly scopes all reads and writes to the current anonId.
 */

const CycleSupabase = (() => {
  'use strict';

  // Helper to ensure supabase is available
  function getClient() {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }
    return window.supabaseClient;
  }

  /**
   * Fetch all cycle logs for a given anonId.
   * @param {string} anonId 
   * @returns {Promise<Array>} Sorted array of log objects
   */
  async function fetchCycleLogs(anonId) {
    if (!anonId) throw new Error("anonId is required");
    
    const { data, error } = await getClient()
      .from('cycle_logs')
      .select('*')
      .eq('anon_id', anonId)
      .order('month_index', { ascending: true });

    if (error) {
      console.error("Error fetching cycle logs:", error);
      throw error;
    }
    return data || [];
  }

  /**
   * Upsert a single cycle log month via RPC.
   * @param {string} anonId 
   * @param {number} monthIndex (1-6)
   * @param {string} startDate 'YYYY-MM-DD'
   * @param {string} endDate 'YYYY-MM-DD'
   */
  async function upsertCycleLog(anonId, monthIndex, startDate, endDate) {
    if (!anonId || !monthIndex || !startDate || !endDate) {
      throw new Error("Missing required fields for upsertCycleLog");
    }

    const { error } = await getClient().rpc('upsert_cycle_log', {
      p_anon_id: anonId,
      p_month_index: monthIndex,
      p_period_start_date: startDate,
      p_period_end_date: endDate
    });

    if (error) {
      console.error(`Error upserting cycle log for month ${monthIndex}:`, error);
      throw error;
    }
  }

  /**
   * Fetch the cycle profile summary for an anonId.
   * @param {string} anonId 
   * @returns {Promise<Object|null>}
   */
  async function fetchCycleProfile(anonId) {
    if (!anonId) throw new Error("anonId is required");

    const { data, error } = await getClient()
      .from('cycle_profile')
      .select('*')
      .eq('anon_id', anonId)
      .single();

    if (error) {
      // PGRST116 means no rows found (which is expected for new users)
      if (error.code === 'PGRST116') return null;
      console.error("Error fetching cycle profile:", error);
      throw error;
    }
    return data;
  }

  /**
   * Upsert the cycle profile summary via RPC.
   * @param {string} anonId 
   * @param {Object} profileData 
   */
  async function upsertCycleProfile(anonId, profileData) {
    if (!anonId || !profileData) throw new Error("anonId and profileData required");

    const { error } = await getClient().rpc('upsert_cycle_profile', {
      p_anon_id: anonId,
      p_avg_cycle_length: profileData.avg_cycle_length || null,
      p_avg_period_length: profileData.avg_period_length || null,
      p_history_complete: profileData.history_complete || false,
      p_last_period_start_date: profileData.last_period_start_date || null,
      p_next_period_predicted: profileData.next_period_predicted || null,
      p_ovulation_predicted: profileData.ovulation_predicted || null,
      p_fertile_window_start: profileData.fertile_window_start || null,
      p_fertile_window_end: profileData.fertile_window_end || null
    });

    if (error) {
      console.error("Error upserting cycle profile:", error);
      throw error;
    }
  }

  /**
   * Delete ALL cycle data for a given anonId.
   * @param {string} anonId 
   */
  async function deleteAllCycleData(anonId) {
    if (!anonId) throw new Error("anonId is required");

    const client = getClient();
    
    // Delete logs
    const { error: logsError } = await client
      .from('cycle_logs')
      .delete()
      .eq('anon_id', anonId);

    if (logsError) {
      console.error("Error deleting cycle logs:", logsError);
      throw logsError;
    }

    // Delete profile
    const { error: profileError } = await client
      .from('cycle_profile')
      .delete()
      .eq('anon_id', anonId);

    if (profileError) {
      console.error("Error deleting cycle profile:", profileError);
      throw profileError;
    }
  }

  return {
    fetchCycleLogs,
    upsertCycleLog,
    fetchCycleProfile,
    upsertCycleProfile,
    deleteAllCycleData
  };
})();

if (typeof window !== 'undefined') {
  window.CycleSupabase = CycleSupabase;
}
