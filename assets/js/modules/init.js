/* ===== INIT ===== */
(async function init(){
  loadDB();
  renderDashboard();
  await initSupabase();
})();

