/* Where condolences posted on the site are stored (Supabase). Both values are
   public by design: the database's rules, not secrecy, limit this key to
   reading messages and posting new ones (see condolences/supabase-setup.sql).
   Leave them empty to make the condolence form email-only again. */
window.STERLING_LIVE = {
  url: "",
  key: "",
};
