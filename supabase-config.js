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
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching advisors:", error.message);
    throw error;
  }
  return data;
};

/**
 * Fetch platform statistics (total sessions and active advisors)
 */
window.fetchPlatformStats = async function() {
  if (!supabaseClient) return { sessions: 0, advisors: 0 };
  
  try {
    const { count: sessionsCount } = await supabaseClient
      .from('chats')
      .select('*', { count: 'exact', head: true });
      
    const { count: advisorsCount } = await supabaseClient
      .from('advisors')
      .select('*', { count: 'exact', head: true });
      
    return {
      sessions: sessionsCount || 0,
      advisors: advisorsCount || 0
    };
  } catch (err) {
    console.error("Error fetching stats:", err);
    return { sessions: 0, advisors: 0 };
  }
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

  // Helper to start a local chat session
  const startLocalChat = () => {
    let mockChatId = localStorage.getItem(storageKey);
    if (!mockChatId || !mockChatId.startsWith('local-chat-')) {
      mockChatId = 'local-chat-' + Date.now();
    }
    localStorage.setItem(storageKey, mockChatId);
    return mockChatId;
  };

  // Offline / mock mode fast-path
  if (advisorId === 'mock-evode' || !supabaseClient) {
    return startLocalChat();
  }

  const existingChatId = localStorage.getItem(storageKey);

  try {
    // Verify existing chat is still valid
    if (existingChatId && !existingChatId.startsWith('local-chat-')) {
      const { data: existingChat, error: checkError } = await supabaseClient
        .from('chats')
        .select('id, is_active')
        .eq('id', existingChatId)
        .single();

      if (!checkError && existingChat && existingChat.is_active) {
        return existingChatId;
      }
    }

    // Create a new chat in Supabase
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
      console.warn("Supabase chat creation failed, falling back to local chat. Error:", error.message);
      return startLocalChat();
    }

    localStorage.setItem(storageKey, data.id);
    return data.id;
  } catch (err) {
    console.warn("Network or database error, falling back to local chat:", err);
    return startLocalChat();
  }
};

// =============================================
// MESSAGING FUNCTIONS
// =============================================

/**
 * Send a message to a chat.
 */
window.sendMessage = async function(chatId, senderId, senderRole, content) {
  // Offline / mock mode: store in localStorage
  if (String(chatId).startsWith('local-chat-')) {
    const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const msg = { id: msgId, chat_id: chatId, sender_id: senderId, role: senderRole, content: content, created_at: new Date().toISOString() };
    const key = `local_messages_${chatId}`;
    const msgs = JSON.parse(localStorage.getItem(key) || '[]');
    msgs.push(msg);
    localStorage.setItem(key, JSON.stringify(msgs));
    return msg;
  }

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
  // Offline / mock mode: load from localStorage
  if (String(chatId).startsWith('local-chat-')) {
    const key = `local_messages_${chatId}`;
    const msgs = JSON.parse(localStorage.getItem(key) || '[]');
    msgs.forEach(msg => callback(msg, true));
    return { unsubscribe: () => {} };
  }

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

// =============================================
// PROFILE PICTURE UPLOAD
// =============================================

/**
 * Upload a profile picture to Supabase Storage and return the public URL.
 * @param {string} userId - The advisor's UUID (used in filename)
 * @param {File} file - The image file to upload
 * @param {function} [onProgress] - Optional callback for status updates: onProgress(statusText)
 * @returns {Promise<string|null>} The public URL of the uploaded image, or null on failure
 */
window.uploadProfilePicture = async function(userId, file, onProgress) {
  if (!supabaseClient) {
    console.error("Supabase not initialized");
    return null;
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File is too large. Maximum size is 5MB.");
  }

  if (onProgress) onProgress("Uploading photo...");

  const fileExt = file.name.split('.').pop().toLowerCase();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  // Attempt upload
  const { data: uploadData, error: uploadErr } = await supabaseClient.storage
    .from('Profile')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadErr) {
    // Provide helpful error for missing bucket
    if (uploadErr.message.includes('bucket') || uploadErr.message.includes('not found') || uploadErr.message.includes('Bucket')) {
      throw new Error(
        "Storage bucket 'Profile' is not set up.\n\n" +
        "To fix: Go to Supabase Dashboard → Storage → New Bucket → Name: 'Profile' → Enable 'Public bucket' → Save."
      );
    }
    throw new Error("Upload failed: " + uploadErr.message);
  }

  if (onProgress) onProgress("Processing...");

  // Get public URL
  const { data: publicUrlData } = supabaseClient.storage
    .from('Profile')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

/**
 * Update the advisor's profile picture URL in the database.
 * @param {string} userId - The advisor's UUID
 * @param {string} url - The new profile picture URL
 */
window.updateAdvisorProfilePicture = async function(userId, url) {
  const { error } = await supabaseClient
    .from('advisors')
    .update({ profile_picture_url: url })
    .eq('id', userId);

  if (error) {
    console.error("Error updating profile picture:", error.message);
    throw error;
  }
};
