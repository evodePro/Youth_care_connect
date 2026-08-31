/**
 * Chat Repository
 * Data access layer for chat operations.
 */

const ChatRepository = (() => {
  const _table = 'chats';

  /**
   * Create a new chat session
   * @param {object} chatData - Chat creation data
   * @returns {Promise<object>} Standardized result with created chat
   */
  async function create(chatData) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .insert({
        youth_username: chatData.youthUsername,
        advisor_id: chatData.advisorId,
        is_active: true
      })
      .select()
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Fetch a single chat by UUID
   * @param {string} id - Chat UUID
   * @returns {Promise<object>} Standardized result with chat object
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
   * Fetch all chats for a specific advisor
   * @param {string} advisorId - Advisor UUID
   * @returns {Promise<object>} Standardized result with chats array
   */
  async function fetchByAdvisor(advisorId) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .select('*')
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Fetch active chat for a youth-advisor pair
   * @param {string} advisorId - Advisor UUID
   * @returns {Promise<object>} Standardized result
   */
  async function fetchActiveByAdvisor(advisorId) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .select('*')
      .eq('advisor_id', advisorId)
      .eq('is_active', true)
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * Update chat status
   * @param {string} id - Chat UUID
   * @param {boolean} isActive - Active status
   * @returns {Promise<object>} Standardized result
   */
  async function updateStatus(id, isActive) {
    const client = BaseRepository.getClient();
    const result = await client
      .from(_table)
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    
    if (result.error) {
      return { data: null, error: result.error };
    }
    
    return { data: result.data, error: null };
  }

  /**
   * End a chat session
   * @param {string} id - Chat UUID
   * @returns {Promise<object>} Standardized result
   */
  async function endChat(id) {
    return updateStatus(id, false);
  }

  /**
   * Check if a chat is valid and active
   * @param {string} chatId - Chat UUID
   * @returns {Promise<object>} Standardized result
   */
  async function isActive(chatId) {
    const result = await fetchById(chatId);
    
    if (result.error) {
      return { data: false, error: result.error };
    }
    
    return { data: result.data?.is_active === true, error: null };
  }

  return {
    create,
    fetchById,
    fetchByAdvisor,
    fetchActiveByAdvisor,
    updateStatus,
    endChat,
    isActive
  };
})();

if (typeof window !== 'undefined') {
  window.ChatRepository = ChatRepository;
}