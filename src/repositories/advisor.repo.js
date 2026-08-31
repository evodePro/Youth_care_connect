/**
 * Advisor Repository
 * Data access layer for advisor operations.
 */

const AdvisorRepository = (() => {
  const _table = 'advisors';

  /**
   * Fetch all approved advisors (public directory)
   * @returns {Promise<object>} Standardized result with advisors array
   */
  async function fetchApproved() {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Fetch a single advisor by UUID
   * @param {string} id - Advisor UUID
   * @returns {Promise<object>} Standardized result with advisor object
   */
  async function fetchById(id) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Fetch advisor by user ID (auth ID)
   * @param {string} userId - Auth user UUID
   * @returns {Promise<object>} Standardized result
   */
  async function fetchByUserId(userId) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .select('*')
      .eq('id', userId)
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Create a new advisor profile
   * @param {object} advisorData - Advisor data object
   * @returns {Promise<object>} Standardized result with created advisor
   */
  async function create(advisorData) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .insert(advisorData)
      .select()
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Update an advisor's profile
   * @param {string} id - Advisor UUID
   * @param {object} updates - Fields to update
   * @returns {Promise<object>} Standardized result with updated advisor
   */
  async function update(id, updates) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Check if an advisor is approved
   * @param {string} id - Advisor UUID
   * @returns {Promise<object>} Standardized result with boolean
   */
  async function isApproved(id) {
    const result = await fetchById(id);
    
    if (result.error) {
      return { data: false, error: result.error };
    }
    
    return { data: result.data?.is_approved === true, error: null };
  }

  return {
    fetchApproved,
    fetchById,
    fetchByUserId,
    create,
    update,
    isApproved
  };
})();

if (typeof window !== 'undefined') {
  window.AdvisorRepository = AdvisorRepository;
}