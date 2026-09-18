// BizStacks / BusinessBox — Supabase configuration
// Public frontend configuration.
// NEVER put a service_role key, sb_secret_ key, database password,
// Stripe secret, or any other private credential in this file.

window.BIZSTACKS_CONFIG = {
  supabaseUrl: "https://mmpcjehktchtujkxvojm.supabase.co",
  supabasePublishableKey: "sb_publishable_oCT25UTRHABzjgxOUCvJSA_2cPvOM17"
};

(function initialiseSupabase(){
  const cfg = window.BIZSTACKS_CONFIG;
  const configured =
    cfg &&
    /^https:\/\/.+\.supabase\.co$/i.test(cfg.supabaseUrl || "") &&
    !String(cfg.supabaseUrl).includes("PASTE_") &&
    /^sb_publishable_/i.test(cfg.supabasePublishableKey || "");

  window.BIZSTACKS_SUPABASE_CONFIGURED = configured;

  if (!configured) {
    window.supabaseClient = null;
    return;
  }

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase JS library did not load.");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    cfg.supabaseUrl,
    cfg.supabasePublishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
