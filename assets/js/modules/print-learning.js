/* ===== PRINT INVOICE ===== */
function printInvoice(id){
  const inv=DB.invoices.find(v=>v.id===id);if(!inv)return;
  const c=DB.customers.find(x=>x.id===inv.customerId);
  const wh=DB.warehouses.find(w=>w.id===(inv.whId||'utama'));
  const items=inv.items.map(l=>{
    const it=DB.items.find(x=>x.id===l.itemId);
    return{...l,nama:it?it.nama:l.itemId,satuan:it?it.satuan:''};
  });
  const html=`
    <div style="padding:20px;font-family:system-ui,sans-serif;color:#0f172a;max-width:800px;margin:0 auto">
      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #2563eb;padding-bottom:14px;margin-bottom:18px">
        <div>
          <h1 style="font-size:22px;color:#2563eb;margin:0 0 4px">${esc(DB.company.nama)}</h1>
          <div style="font-size:12px;color:#64748b">${esc(DB.company.alamat)}</div>
          <div style="font-size:12px;color:#64748b">Telp: ${esc(DB.company.telp)} · NPWP: ${esc(DB.company.npwp)}</div>
        </div>
        <div style="text-align:right">
          <h2 style="font-size:20px;margin:0 0 4px">INVOICE</h2>
          <div style="font-size:13px">${inv.no}</div>
          <div style="font-size:12px;color:#64748b">Tanggal: ${inv.tanggal}</div>
          ${inv.dueDate?`<div style="font-size:12px;color:#64748b">Jatuh Tempo: ${inv.dueDate}</div>`:''}
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:18px;font-size:13px">
        <div>
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;margin-bottom:4px">Kepada</div>
          <div style="font-weight:600">${esc(c?c.nama:'Pelanggan Umum')}</div>
          ${c&&c.alamat?`<div style="color:#64748b">${esc(c.alamat)}</div>`:''}
          ${c&&c.telp?`<div style="color:#64748b">Telp: ${esc(c.telp)}</div>`:''}
        </div>
        <div style="text-align:right">
          <div style="color:#64748b;font-size:11px;text-transform:uppercase;margin-bottom:4px">Gudang</div>
          <div>${esc(wh?wh.nama:'-')}</div>
          <div style="color:#64748b;margin-top:6px">Pembayaran: <b>${inv.bayar}</b></div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">
        <thead><tr style="background:#f1f5f9">
          <th style="padding:8px;text-align:left;border-bottom:1px solid #e2e8f0">Item</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">Qty</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">Harga</th>
          <th style="padding:8px;text-align:right;border-bottom:1px solid #e2e8f0">Subtotal</th>
        </tr></thead>
        <tbody>
          ${items.map(l=>`<tr>
            <td style="padding:8px;border-bottom:1px solid #f1f5f9">${esc(l.nama)}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #f1f5f9">${l.qty} ${esc(l.satuan)}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #f1f5f9">${fmt(l.harga)}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #f1f5f9">${fmt(l.qty*l.harga)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end">
        <table style="font-size:13px;min-width:280px">
          <tr><td style="padding:5px 10px;color:#64748b">Subtotal</td><td style="padding:5px 10px;text-align:right">${fmt(inv.subtotal||inv.total)}</td></tr>
          ${inv.ppn?`<tr><td style="padding:5px 10px;color:#64748b">PPN 11%</td><td style="padding:5px 10px;text-align:right">${fmt(inv.tax||0)}</td></tr>`:''}
          <tr style="border-top:2px solid #2563eb"><td style="padding:8px 10px;font-weight:700">Total</td><td style="padding:8px 10px;text-align:right;font-weight:700;color:#2563eb">${fmt(inv.total)}</td></tr>
          <tr><td style="padding:5px 10px;color:#64748b">Sudah Bayar</td><td style="padding:5px 10px;text-align:right">${fmt(inv.paidAmount||0)}</td></tr>
          <tr><td style="padding:5px 10px;color:#64748b">Sisa</td><td style="padding:5px 10px;text-align:right;color:#dc2626;font-weight:600">${fmt(getSisaInvoice(inv))}</td></tr>
        </table>
      </div>
      <div style="margin-top:40px;font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px">
        Terima kasih atas kepercayaan Anda. Invoice ini dicetak otomatis oleh sistem pada ${new Date().toLocaleString('id-ID')}.
      </div>
    </div>`;
  document.getElementById('printArea').innerHTML=html;
  document.body.classList.add('print-mode');
  setTimeout(()=>{window.print();setTimeout(()=>document.body.classList.remove('print-mode'),300)},100);
}
window.printInvoice=printInvoice;

/* ===== ROADMAP ===== */
const phases=[
  {id:0,title:"Fase 0 — Fondasi Akuntansi Dasar",dur:"3–5 hari",tasks:[
    "Tulis ulang beda Neraca vs Laba Rugi",
    "Buat 10 transaksi harian + tentukan akunnya",
    "Pahami debit & kredit",
    "Hafal 5 jenis akun"]},
  {id:1,title:"Fase 1 — Konsep ERP Umum",dur:"2–3 hari",tasks:[
    "Ringkasan 'Apa itu ERP'",
    "Tulis 3 kesamaan ERP vs RME",
    "Pelajari modul umum ERP"]},
  {id:2,title:"Fase 2 — Setup Sistem Ini",dur:"± 1 minggu",tasks:[
    "Isi Profil Perusahaan",
    "Rapikan COA",
    "Buat 2 gudang",
    "Input 5 pelanggan & 5 vendor",
    "Input 10 barang/jasa"]},
  {id:3,title:"Fase 3 — Siklus Transaksi + PPN",dur:"1–1,5 minggu",tasks:[
    "Buat 5 invoice tanpa PPN & 5 dengan PPN",
    "Buat 5 faktur pembelian (2 dengan PPN)",
    "Catat penerimaan & pengeluaran kas",
    "Lakukan pelunasan invoice & pembayaran utang"]},
  {id:4,title:"Fase 4 — Persediaan & Aset",dur:"± 1 minggu",tasks:[
    "Cek Kartu Stok per gudang",
    "Lakukan Stock Opname",
    "Coba Transfer Gudang",
    "Input 2 aset tetap + posting penyusutan bulanan"]},
  {id:5,title:"Fase 5 — Laporan & Closing",dur:"± 1 minggu",tasks:[
    "Buka Laba Rugi, Neraca, Arus Kas",
    "Buka Rekap PPN",
    "Cetak 1 invoice (PDF)",
    "Kunci 1 periode closing",
    "Pastikan Neraca Balance"]},
  {id:6,title:"Fase 6 — Portofolio",dur:"1 minggu+",tasks:[
    "Screenshot semua laporan",
    "Export JSON sebagai backup",
    "Update CV"]}
];
function renderRoadmap(){
  const done=JSON.parse(localStorage.getItem(LS+'_roadmap')||'{}');
  document.getElementById('roadmap').innerHTML=`
    <h2>Roadmap Belajar</h2><p class="sub">Progres tersimpan otomatis.</p>
    ${phases.map(p=>`<details class="phase" ${p.id===0?'open':''}>
      <summary>${p.title}<span class="badge">${p.dur}</span></summary>
      <div class="body">${p.tasks.map((t,i)=>{
        const k=p.id+'-'+i;
        return`<div class="task ${done[k]?'done':''}"><input type="checkbox" ${done[k]?'checked':''} onchange="toggleRoadmap('${k}',this)"><label>${t}</label></div>`;
      }).join('')}</div></details>`).join('')}`;
}
function toggleRoadmap(k,el){
  const d=JSON.parse(localStorage.getItem(LS+'_roadmap')||'{}');
  d[k]=el.checked;localStorage.setItem(LS+'_roadmap',JSON.stringify(d));
  el.parentElement.classList.toggle('done',el.checked);
}
window.toggleRoadmap=toggleRoadmap;

/* ===== KUIS ===== */
const quiz=[
  {q:"Apa kepanjangan ERP?",o:["Enterprise Resource Planning","Electronic Report Program","Economic Resource Process"],a:0},
  {q:"Akun yang bertambah di sisi DEBIT?",o:["Kas","Utang Usaha","Modal","Pendapatan"],a:0},
  {q:"Aset = Liabilitas + Ekuitas adalah rumus?",o:["Neraca","Laba Rugi","Arus Kas","Jurnal"],a:0},
  {q:"Penjualan kredit → akun yang didebit?",o:["Piutang Usaha","Kas","Pendapatan","Persediaan"],a:0},
  {q:"PPN Keluaran muncul saat?",o:["Menjual barang kena PPN","Membeli barang","Bayar gaji","Hitung stok"],a:0},
  {q:"Pelunasan piutang jurnalnya?",o:["Kas (D) / Piutang (K)","Piutang (D) / Kas (K)","Kas (D) / Pendapatan (K)","Beban (D) / Kas (K)"],a:0},
  {q:"Penyusutan garis lurus = ?",o:["Harga perolehan ÷ umur","Harga × 11%","Stok × harga","Kas ÷ 12"],a:0},
  {q:"Closing periode berguna untuk?",o:["Kunci transaksi bulan lalu","Hapus data","Cetak laporan","Tambah gudang"],a:0},
  {q:"Transfer gudang mempengaruhi?",o:["Stok antar gudang","Kas","Piutang","Modal"],a:0},
  {q:"Sertifikasi dasar Accurate bernama?",o:["CADE","CAP","CAE","CPS"],a:0}
];
let quizState={};
function renderKuis(){
  quizState={};
  document.getElementById('kuis').innerHTML=`
    <h2>Kuis Akuntansi & ERP</h2><p class="sub">Pilih jawaban lalu klik Periksa.</p>
    ${quiz.map((x,i)=>`<div class="q" data-i="${i}"><p>${i+1}. ${x.q}</p>
      ${x.o.map((o,j)=>`<label class="opt"><input type="radio" name="q${i}" value="${j}" onchange="quizState[${i}]=${j}"> ${o}</label>`).join('')}</div>`).join('')}
    <button onclick="checkKuis()">Periksa</button>
    <button class="ghost" onclick="renderKuis()" style="margin-left:6px">Ulangi</button>
    <div class="fb" id="kuis_fb"></div>`;
}
function checkKuis(){
  let s=0;
  quiz.forEach((x,i)=>{
    const q=document.querySelector(`.q[data-i="${i}"]`);const p=quizState[i];
    q.querySelectorAll('.opt').forEach((el,j)=>{
      el.classList.remove('correct','wrong');
      if(j===x.a)el.classList.add('correct');
      if(p===j&&j!==x.a)el.classList.add('wrong');
    });
    if(p===x.a)s++;
  });
  const fb=document.getElementById('kuis_fb');
  fb.className='fb '+(s>=7?'ok':'bad');
  fb.textContent=`Skor: ${s}/10 ${s>=7?'🎉':'💪'}`;
}
window.checkKuis=checkKuis;window.renderKuis=renderKuis;
