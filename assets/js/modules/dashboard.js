function goto(t){document.querySelector(`.nav a[data-target="${t}"]`).click()}
window.goto=goto;

function openModal(t,b,f){document.getElementById('mTitle').textContent=t;document.getElementById('mBody').innerHTML=b;document.getElementById('mFoot').innerHTML=f||'';document.getElementById('modal').classList.add('show')}
function closeModal(){document.getElementById('modal').classList.remove('show')}
window.closeModal=closeModal;
document.getElementById('modal').onclick=e=>{if(e.target.id==='modal')closeModal()};

function renderDashboard(){
  const kas=saldo('1001'),bank=saldo('1002');
  const pPN=saldo('2101')-saldo('1202');
  const pendapatan=DB.coa.filter(a=>a.tipe==='Pendapatan').reduce((s,a)=>s+saldo(a.kode),0);
  const beban=DB.coa.filter(a=>a.tipe==='Beban').reduce((s,a)=>s+saldo(a.kode),0);
  const laba=pendapatan-beban;
  document.getElementById('dashboard').innerHTML=`
    <h2>Dashboard</h2><p class="sub">${esc(DB.company.nama)}</p>
    <div class="grid">
      <div class="stat"><div class="label">Kas</div><div class="val">${fmt(kas)}</div></div>
      <div class="stat"><div class="label">Bank</div><div class="val">${fmt(bank)}</div></div>
      <div class="stat"><div class="label">Piutang Outstanding</div><div class="val">${fmt(totalPiutangOutstanding())}</div></div>
      <div class="stat"><div class="label">Utang Outstanding</div><div class="val">${fmt(totalUtangOutstanding())}</div></div>
      <div class="stat"><div class="label">Piutang Lewat Tempo</div><div class="val" style="color:#dc2626">${fmt(totalPiutangLewatTempo())}</div></div>
      <div class="stat"><div class="label">PPN Neto</div><div class="val">${fmt(pPN)}</div></div>
      <div class="stat"><div class="label">Pendapatan</div><div class="val">${fmt(pendapatan)}</div></div>
      <div class="stat"><div class="label">Laba / Rugi</div><div class="val" style="color:${laba>=0?'#16a34a':'#dc2626'}">${fmt(laba)}</div></div>
    </div>
    <div class="card" style="margin-top:14px">
      <h3 class="sec" style="margin-top:0">Aksi Cepat</h3>
      <div class="row">
        <button onclick="goto('penjualan')">+ Penjualan</button>
        <button onclick="goto('pembelian')">+ Pembelian</button>
        <button onclick="goto('lappiutang')">📥 Piutang</button>
        <button onclick="goto('laputang')">📤 Utang</button>
        <button class="ghost" onclick="goto('aset')">🏭 Aset Tetap</button>
        <button class="ghost" onclick="goto('closing')">🔒 Closing</button>
        <button class="ok" onclick="seedDemoData()">🌱 Isi Data Demo</button>
      </div>
    </div>
    <div class="card">
      <h3 class="sec" style="margin-top:0">5 Transaksi Terakhir</h3>
      ${DB.journals.length===0?'<div class="empty">Belum ada transaksi</div>':`
      <div class="tbl-wrap"><table>
        <tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th class="num">Debit</th></tr>
        ${[...DB.journals].sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).slice(0,5).map(j=>`
          <tr><td>${j.tanggal}</td><td>${esc(j.ref)}</td><td>${esc(j.ket)}</td><td class="num">${fmt(j.lines.reduce((s,l)=>s+(+l.debit||0),0))}</td></tr>`).join('')}
      </table></div>`}
    </div>
    <div class="card">
      <div class="row">
        <button class="danger" onclick="resetAllData()">Reset Data</button>
        <button class="ghost" onclick="exportData()">Export JSON</button>
        <button class="ghost" onclick="document.getElementById('impFile').click()">Import JSON</button>
        <input type="file" id="impFile" accept=".json" style="display:none" onchange="importData(event)">
      </div>
    </div>`;
}
function resetAllData(){if(!confirm('Reset semua data?'))return;localStorage.removeItem(LS);DB=freshDB();save();goto('dashboard');toast('Data direset')}
function exportData(){const b=new Blob([JSON.stringify(DB,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='erp-backup-'+today()+'.json';a.click()}
function importData(e){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{DB=JSON.parse(r.result);migrateDB();save();toast('Data diimport');goto('dashboard')}catch(x){toast('File tidak valid','bad')}};r.readAsText(f)}
window.resetAllData=resetAllData;window.exportData=exportData;window.importData=importData;

