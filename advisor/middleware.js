// Note: This file no longer uses "import" to maintain compatibility with the file:// protocol.
// It assumes 'window.supabaseClient' has been initialized by supabase-config.js.

// Get current page name from URL
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const isAuthPage = currentPage === 'login.html' || currentPage === 'register.html';
const isPendingPage = currentPage === 'pending.html';

async function checkAuth() {
  if (!window.supabaseClient) {
    console.warn("Supabase not initialized yet.");
    return;
  }

  const { data: { session } } = await window.supabaseClient.auth.getSession();

  if (!session) {
    if (!isAuthPage) {
      // If we are deep in the advisor folder and not logged in, go to login
      window.location.href = 'login.html';
    }
    return;
  }

  // If there is a session, check approval status in advisors table
  const { data: profile, error } = await window.supabaseClient
    .from('advisors')
    .select('is_approved')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.warn("Could not fetch advisor profile", error);
    return;
  }

  const isApproved = profile && profile.is_approved;

  if (isApproved) {
    if (isAuthPage || isPendingPage) {
      window.location.href = 'dashboard.html';
    }
  } else {
    // If NOT approved, force to pending UNLESS they are already on an auth page
    if (!isPendingPage && !isAuthPage) {
      window.location.href = 'pending.html';
    }
  }
}

// Run immediately
checkAuth();

// Listen for changes
if (window.supabaseClient) {
  window.supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = 'login.html';
    } else if (event === 'SIGNED_IN') {
      checkAuth();
    }
  });
}
