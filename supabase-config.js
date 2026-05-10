// =============================================
// SUPABASE CONFIG — YouthCare Connect
// =============================================
// This file initializes the Supabase client and exposes
// all backend functions on `window` for use across pages.
// It assumes the Supabase UMD library is loaded via a <script> tag in HTML.

const supabaseUrl = 'https://sbkynohpfovewirneggn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNia3lub2hwZm92ZXdpcm5lZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTk1MzksImV4cCI6MjA5MTQ3NTUzOX0.fPdU8NXFarXnfAM9HlxCIkBUUrxxLMSSc6G3Nz-q8OI';

// Declare at top level so all functions below can access it
let supabaseClient = null;

// Guard: Supabase CDN must be loaded first
if (!window.supabase || !window.supabase.createClient) {
  console.error("FATAL: Supabase CDN has not loaded. Make sure <script src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'></script> is in your HTML <head>.");
} else {
  supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  window.supabaseClient = supabaseClient;
}

// =============================================
// ADVISOR FUNCTIONS
// =============================================

/**
 * Fetch all approved advisors for the public directory.
 */
window.fetchApprovedAdvisors = async function() {
  const { data, error } = await supabaseClient
    .from('advisors')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching advisors:", error.message);
    return [];
  }
  return data;
};

/**
 * Fetch a single advisor by their UUID (for chat header display).
 */
window.getAdvisorById = async function(id) {
  const { data, error } = await supabaseClient
    .from('advisors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching advisor:", error.message);
    return null;
  }
  return data;
};

/**
 * Fetch a single chat by its UUID (for advisor chat page).
 */
window.getChatById = async function(chatId) {
  const { data, error } = await supabaseClient
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();

  if (error) {
    console.error("Error fetching chat:", error.message);
    return null;
  }
  return data;
};

// =============================================
// YOUTH CHAT FUNCTIONS
// =============================================

/**
 * Initialize a youth chat session.
 * If a session already exists in localStorage for this advisor, reuse it.
 * Otherwise, create a new chat row in the database.
 */
window.initializeYouthSession = async function(username, advisorId) {
  const storageKey = `active_chat_${advisorId}`;
  const existingChatId = localStorage.getItem(storageKey);

  // Verify existing chat is still valid
  if (existingChatId) {
    const { data: existingChat } = await supabaseClient
      .from('chats')
      .select('id, is_active')
      .eq('id', existingChatId)
      .single();

    if (existingChat && existingChat.is_active) {
      return existingChatId;
    } else {
      // Chat was ended or deleted, clear it
      localStorage.removeItem(storageKey);
    }
  }

  // Create a new chat
  const { data, error } = await supabaseClient
    .from('chats')
    .insert({
      youth_username: username || 'Anonymous',
      advisor_id: advisorId,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating chat:", error.message);
    throw error;
  }

  localStorage.setItem(storageKey, data.id);
  return data.id;
};

// =============================================
// MESSAGING FUNCTIONS
// =============================================

/**
 * Send a message to a chat.
 */
window.sendMessage = async function(chatId, senderId, senderRole, content) {
  const { data, error } = await supabaseClient
    .from('messages')
    .insert({
      chat_id: chatId,
      sender_id: senderId,
      role: senderRole,
      content: content
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error.message);
    throw error;
  }
  return data;
};

/**
 * Delete a message by its ID.
 */
window.deleteMessage = async function(messageId) {
  const { error } = await supabaseClient
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error("Error deleting message:", error.message);
    throw error;
  }
};

/**
 * Fetch all existing messages for a chat, then subscribe to real-time new messages.
 * Returns an object with an `unsubscribe` method to clean up.
 * 
 * The callback receives each message object and a boolean `isHistory`:
 *   callback(message, isHistory)
 * - isHistory=true  → message loaded from database (initial fetch)
 * - isHistory=false → message arrived via real-time subscription
 */
/**
 * Listen for messages in a chat.
 * @param {string} chatId
 * @param {function} callback - Called with (message, isHistory) for new/existing messages
 * @param {function} onDelete - Called with (messageId) when a message is deleted
 */
window.listenForMessages = function(chatId, callback, onDelete) {
  // Set to track message IDs we've already delivered to avoid duplicates
  const deliveredIds = new Set();

  // 1. Initial fetch of existing messages
  supabaseClient
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .then(({ data, error }) => {
      if (!error && data) {
        data.forEach(msg => {
          deliveredIds.add(msg.id);
          callback(msg, true);
        });
      }
    });

  // 2. Real-time subscription for new AND deleted messages
  const channel = supabaseClient
    .channel(`chat_${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        // Deduplicate: skip if we already delivered this message ID
        if (!deliveredIds.has(payload.new.id)) {
          deliveredIds.add(payload.new.id);
          callback(payload.new, false);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      },
      (payload) => {
        if (onDelete && payload.old && payload.old.id) {
          deliveredIds.delete(payload.old.id);
          onDelete(payload.old.id);
        }
      }
    )
    .subscribe();

  return channel;
};

/**
 * End a chat session (mark as inactive).
 */
window.endChat = async function(chatId) {
  const { error } = await supabaseClient
    .from('chats')
    .update({ is_active: false })
    .eq('id', chatId);

  if (error) {
    console.error("Error ending chat:", error.message);
    throw error;
  }
};
