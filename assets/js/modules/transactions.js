  /* ===== PENJUALAN ===== */
let invLines=[{itemId:'',qty:1,harga:0}];
function renderPenjualan(){
  invLines=[{itemId:'',qty:1,harga:0}];
  document.getElementById('penjualan').innerHTML=`
    <h2>Penjualan</h2><p class="sub">Buat invoice penjualan. PPN 11% opsional. Jurnal & stok otomatis.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Tanggal</span><input type="date" id="inv_tgl" value="${today()}"></label>
        <label class="f"><span>Pelanggan</span><select id="inv_cust"><option value="">— Umum —</option>
          ${DB.customers.map(c=>`<option value="${c.id}">${esc(c.nama)}</option>`).join('')}</select></label>
      </div>
      <div class="split3">
        <label class="f"><span>Gudang</span><select id="inv_wh">
          ${DB.warehouses.map(w=>`<option value="${w.id}">${esc(w.nama)}</option>`).join('')}</select></label>
        <label class="f"><span>Pembayaran</span><select id="inv_bayar" onchange="toggleDueDate()">
          <option value="tunai">Tunai (Kas)</option><option value="transfer">Transfer (Bank)</option><option value="kredit">Kredit (Piutang)</option>
        </select></label>
        <label class="f" id="inv_due_wrap" style="display:none"><span>Jatuh Tempo</span><input type="date" id="inv_due" value="${addDays(today(),30)}"></label>
      </div>
      <label class="chk"><input type="checkbox" id="inv_ppn" onchange="renderInvLines()"> Kena PPN 11%</label>
      <h3 class="sec">Item</h3>
      <div id="inv_items"></div>
      <button class="ghost sm" onclick="addInvLine()">+ Tambah Baris</button>
      <div style="text-align:right;margin-top:10px;font-size:14px" id="inv_summary"></div>
      <div class="row end" style="margin-top:10px"><button onclick="saveInvoice()">Simpan Invoice</button></div>
    </div>
    <div class="card" style="padding:0">
      <div style="padding:12px 14px;background:var(--soft);font-weight:600;font-size:13px">Riwayat Invoice</div>
      ${DB.invoices.length===0?'<div class="empty">Belum ada invoice</div>':`
      <div class="tbl-wrap" style="border:0"><table>
        <tr><th>No</th><th>Tanggal</th><th>Pelanggan</th><th>Bayar</th><th class="num">Total</th><th>Status</th><th></th></tr>
        ${DB.invoices.slice().reverse().map(v=>{
          const c=DB.customers.find(x=>x.id===v.customerId);const s=getSisaInvoice(v);
          return`<tr><td>${v.no}</td><td>${v.tanggal}</td><td>${esc(c?c.nama:'Umum')}</td>
            <td><span class="badge ${v.bayar==='kredit'?'warn':'ok'}">${v.bayar}${v.ppn?' +PPN':''}</span></td>
            <td class="num">${fmt(v.total)}</td><td>${getStatusLabel(v.status)}</td>
            <td style="text-align:right">
              <button class="sm ghost" onclick="printInvoice('${v.id}')">🖨️</button>
              ${s>0?`<button class="sm ok" onclick="openPelunasanInvoice('${v.id}')">Lunasi</button>`:''}
              <button class="sm danger" onclick="delInvoice('${v.id}')">×</button>
            </td></tr>`;
        }).join('')}
      </table></div>`}
    </div>`;
  renderInvLines();
}
function toggleDueDate(){const b=inv_bayar.value;document.getElementById('inv_due_wrap').style.display=b==='kredit'?'block':'none'}
window.toggleDueDate=toggleDueDate;
function renderInvLines(){
  const whId=inv_wh.value;
  document.getElementById('inv_items').innerHTML=invLines.map((l,i)=>`
    <div class="jline">
      <select onchange="invChange(${i},'itemId',this.value)">
        <option value="">— pilih barang —</option>
        ${DB.items.map(x=>`<option value="${x.id}" ${x.id===l.itemId?'selected':''}>${esc(x.nama)} (stok ${getStok(x.id,whId)||0})</option>`).join('')}
      </select>
      <input type="number" placeholder="Qty" value="${l.qty}" onchange="invChange(${i},'qty',+this.value)" min="1">
     <input type="text" inputmode="numeric" class="money" placeholder="Harga" value="${money(l.harga)}" onchange="invChange(${i},'harga',num(this.value))">
      <button class="sm danger" onclick="invDel(${i})">×</button>
    </div>`).join('');
  const sub=invLines.reduce((s,l)=>s+(+l.qty||0)*(+l.harga||0),0);
  const ppn=inv_ppn.checked?Math.round(sub*PPN_RATE):0;
  document.getElementById('inv_summary').innerHTML=`Subtotal: <b>${fmt(sub)}</b> · PPN: <b>${fmt(ppn)}</b> · Total: <b>${fmt(sub+ppn)}</b>`;
}
function invChange(i,f,v){invLines[i][f]=v;if(f==='itemId'){const x=DB.items.find(a=>a.id===v);if(x)invLines[i].harga=x.hargaJual}renderInvLines()}
function addInvLine(){invLines.push({itemId:'',qty:1,harga:0});renderInvLines()}
function invDel(i){invLines.splice(i,1);if(!invLines.length)invLines.push({itemId:'',qty:1,harga:0});renderInvLines()}
window.addInvLine=addInvLine;window.invDel=invDel;window.invChange=invChange;

function saveInvoice(){
  const valid=invLines.filter(l=>l.itemId&&l.qty>0);
  if(!valid.length)return toast('Minimal 1 item','bad');
  const tanggal=inv_tgl.value,customerId=inv_cust.value,bayar=inv_bayar.value,whId=inv_wh.value;
  if(isLocked(tanggal))return toast('Periode '+monthOf(tanggal)+' sudah dikunci','bad');
  for(const l of valid){
    const it=DB.items.find(x=>x.id===l.itemId);
    if(l.qty>(getStok(it.id,whId)||0))return toast(`Stok ${it.nama} di gudang ini tidak cukup (${getStok(it.id,whId)||0})`,'bad');
  }
  const subtotal=valid.reduce((s,l)=>s+l.qty*l.harga,0);
  const ppn=inv_ppn.checked;
  const tax=ppn?Math.round(subtotal*PPN_RATE):0;
  const total=subtotal+tax;
  const hpp=valid.reduce((s,l)=>{const it=DB.items.find(x=>x.id===l.itemId);return s+l.qty*(it.hargaBeli||0)},0);
  DB.counters.inv=(DB.counters.inv||0)+1;
  const no='INV-'+String(DB.counters.inv).padStart(4,'0');
  valid.forEach(l=>addStok(l.itemId,whId,-l.qty));
  const cust=DB.customers.find(c=>c.id===customerId);
  const lines=[];
  const kas=bayar==='kredit'?'1101':(bayar==='transfer'?'1002':'1001');
  lines.push({kode:kas,debit:total,kredit:0});
  lines.push({kode:'4001',debit:0,kredit:subtotal});
  if(tax>0)lines.push({kode:'2101',debit:0,kredit:tax});
  if(hpp>0){lines.push({kode:'5001',debit:hpp,kredit:0});lines.push({kode:'1201',debit:0,kredit:hpp})}
  const j=postJournal({tanggal,ref:no,ket:`Penjualan ke ${cust?cust.nama:'Umum'}`,lines,source:'invoice'});
  if(!j)return;
  DB.invoices.push({id:j.id,no,tanggal,customerId,bayar,whId,subtotal,tax,ppn,total,hpp,
    paidAmount:bayar==='kredit'?0:total,status:bayar==='kredit'?'belum':'lunas',
    dueDate:bayar==='kredit'?(inv_due.value||addDays(tanggal,30)):null,
    items:valid.map(l=>({...l}))});
  save();renderPenjualan();toast('Invoice disimpan');
}
function delInvoice(id){
  if(!confirm('Hapus invoice? Stok dikembalikan & jurnal dihapus.'))return;
  const inv=DB.invoices.find(v=>v.id===id);
  inv.items.forEach(l=>addStok(l.itemId,inv.whId||'utama',l.qty));
  DB.journals=DB.journals.filter(j=>j.id!==id);
  DB.invoices=DB.invoices.filter(v=>v.id!==id);
  DB.payments=DB.payments.filter(p=>p.refId!==id);
  save();renderPenjualan();toast('Terhapus');
}
window.saveInvoice=saveInvoice;window.delInvoice=delInvoice;

/* ===== PEMBELIAN ===== */
let purLines=[{itemId:'',qty:1,harga:0}];
function renderPembelian(){
  purLines=[{itemId:'',qty:1,harga:0}];
  document.getElementById('pembelian').innerHTML=`
    <h2>Pembelian</h2><p class="sub">Faktur pembelian. PPN masukan opsional.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Tanggal</span><input type="date" id="pur_tgl" value="${today()}"></label>
        <label class="f"><span>Vendor</span><select id="pur_vend"><option value="">— Umum —</option>
          ${DB.vendors.map(v=>`<option value="${v.id}">${esc(v.nama)}</option>`).join('')}</select></label>
      </div>
      <div class="split3">
        <label class="f"><span>Gudang Tujuan</span><select id="pur_wh">
          ${DB.warehouses.map(w=>`<option value="${w.id}">${esc(w.nama)}</option>`).join('')}</select></label>
        <label class="f"><span>Pembayaran</span><select id="pur_bayar" onchange="togglePurDueDate()">
          <option value="tunai">Tunai (Kas)</option><option value="transfer">Transfer (Bank)</option><option value="kredit">Kredit (Utang)</option>
        </select></label>
        <label class="f" id="pur_due_wrap" style="display:none"><span>Jatuh Tempo</span><input type="date" id="pur_due" value="${addDays(today(),30)}"></label>
      </div>
      <label class="chk"><input type="checkbox" id="pur_ppn" onchange="renderPurLines()"> Kena PPN Masukan 11%</label>
      <h3 class="sec">Item</h3>
      <div id="pur_items"></div>
      <button class="ghost sm" onclick="addPurLine()">+ Tambah Baris</button>
      <div style="text-align:right;margin-top:10px;font-size:14px" id="pur_summary"></div>
      <div class="row end" style="margin-top:10px"><button onclick="savePurchase()">Simpan Faktur</button></div>
    </div>
    <div class="card" style="padding:0">
      <div style="padding:12px 14px;background:var(--soft);font-weight:600;font-size:13px">Riwayat Pembelian</div>
      ${DB.purchases.length===0?'<div class="empty">Belum ada pembelian</div>':`
      <div class="tbl-wrap" style="border:0"><table>
        <tr><th>No</th><th>Tanggal</th><th>Vendor</th><th>Bayar</th><th class="num">Total</th><th>Status</th><th></th></tr>
        ${DB.purchases.slice().reverse().map(v=>{
          const c=DB.vendors.find(x=>x.id===v.vendorId);const s=getSisaInvoice(v);
          return`<tr><td>${v.no}</td><td>${v.tanggal}</td><td>${esc(c?c.nama:'Umum')}</td>
            <td><span class="badge ${v.bayar==='kredit'?'warn':'ok'}">${v.bayar}${v.ppn?' +PPN':''}</span></td>
            <td class="num">${fmt(v.total)}</td><td>${getStatusLabel(v.status)}</td>
            <td style="text-align:right">
              ${s>0?`<button class="sm ok" onclick="openPelunasanPurchase('${v.id}')">Bayar</button>`:''}
              <button class="sm danger" onclick="delPurchase('${v.id}')">×</button>
            </td></tr>`;
        }).join('')}
      </table></div>`}
    </div>`;
  renderPurLines();
}
function togglePurDueDate(){document.getElementById('pur_due_wrap').style.display=pur_bayar.value==='kredit'?'block':'none'}
window.togglePurDueDate=togglePurDueDate;
function renderPurLines(){
  document.getElementById('pur_items').innerHTML=purLines.map((l,i)=>`
    <div class="jline">
      <select onchange="purChange(${i},'itemId',this.value)">
        <option value="">— pilih barang —</option>
        ${DB.items.map(x=>`<option value="${x.id}" ${x.id===l.itemId?'selected':''}>${esc(x.nama)}</option>`).join('')}
      </select>
      <input type="number" value="${l.qty}" onchange="purChange(${i},'qty',+this.value)" min="1">
     <input type="text" inputmode="numeric" class="money" value="${money(l.harga)}" onchange="purChange(${i},'harga',num(this.value))">
      <button class="sm danger" onclick="purDel(${i})">×</button>
    </div>`).join('');
  const sub=purLines.reduce((s,l)=>s+(+l.qty||0)*(+l.harga||0),0);
  const ppn=pur_ppn.checked?Math.round(sub*PPN_RATE):0;
  document.getElementById('pur_summary').innerHTML=`Subtotal: <b>${fmt(sub)}</b> · PPN: <b>${fmt(ppn)}</b> · Total: <b>${fmt(sub+ppn)}</b>`;
}
function purChange(i,f,v){purLines[i][f]=v;if(f==='itemId'){const x=DB.items.find(a=>a.id===v);if(x)purLines[i].harga=x.hargaBeli}renderPurLines()}
function addPurLine(){purLines.push({itemId:'',qty:1,harga:0});renderPurLines()}
function purDel(i){purLines.splice(i,1);if(!purLines.length)purLines.push({itemId:'',qty:1,harga:0});renderPurLines()}
window.addPurLine=addPurLine;window.purDel=purDel;window.purChange=purChange;

function savePurchase(){
  const valid=purLines.filter(l=>l.itemId&&l.qty>0);
  if(!valid.length)return toast('Minimal 1 item','bad');
  const tanggal=pur_tgl.value,vendorId=pur_vend.value,bayar=pur_bayar.value,whId=pur_wh.value;
  if(isLocked(tanggal))return toast('Periode '+monthOf(tanggal)+' sudah dikunci','bad');
  const subtotal=valid.reduce((s,l)=>s+l.qty*l.harga,0);
  const ppn=pur_ppn.checked;
  const tax=ppn?Math.round(subtotal*PPN_RATE):0;
  const total=subtotal+tax;
  DB.counters.pur=(DB.counters.pur||0)+1;
  const no='PUR-'+String(DB.counters.pur).padStart(4,'0');
  valid.forEach(l=>{const it=DB.items.find(x=>x.id===l.itemId);addStok(l.itemId,whId,l.qty);it.hargaBeli=l.harga});
  const vend=DB.vendors.find(c=>c.id===vendorId);
  const lines=[];
  const kas=bayar==='kredit'?'2001':(bayar==='transfer'?'1002':'1001');
  lines.push({kode:'1201',debit:subtotal,kredit:0});
  if(tax>0)lines.push({kode:'1202',debit:tax,kredit:0});
  lines.push({kode:kas,debit:0,kredit:total});
  const j=postJournal({tanggal,ref:no,ket:`Pembelian dari ${vend?vend.nama:'Umum'}`,lines,source:'purchase'});
  if(!j)return;
  DB.purchases.push({id:j.id,no,tanggal,vendorId,bayar,whId,subtotal,tax,ppn,total,
    paidAmount:bayar==='kredit'?0:total,status:bayar==='kredit'?'belum':'lunas',
    dueDate:bayar==='kredit'?(pur_due.value||addDays(tanggal,30)):null,
    items:valid.map(l=>({...l}))});
  save();renderPembelian();toast('Faktur disimpan');
}
function delPurchase(id){
  if(!confirm('Hapus faktur? Stok dikembalikan & jurnal dihapus.'))return;
  const v=DB.purchases.find(x=>x.id===id);
  v.items.forEach(l=>addStok(l.itemId,v.whId||'utama',-l.qty));
  DB.journals=DB.journals.filter(j=>j.id!==id);
  DB.purchases=DB.purchases.filter(x=>x.id!==id);
  DB.payments=DB.payments.filter(p=>p.refId!==id);
  save();renderPembelian();toast('Terhapus');
}
window.savePurchase=savePurchase;window.delPurchase=delPurchase;

/* ===== PELUNASAN AR/AP ===== */
function openPelunasanInvoice(id){
  const inv=DB.invoices.find(v=>v.id===id);if(!inv)return;
  const s=getSisaInvoice(inv);const c=DB.customers.find(x=>x.id===inv.customerId);
  openModal('Pelunasan Invoice '+inv.no,`
    <p style="margin-bottom:8px">Pelanggan: <b>${esc(c?c.nama:'Umum')}</b></p>
    <div class="grid" style="margin-bottom:12px">
      <div class="stat"><div class="label">Total</div><div class="val" style="font-size:16px">${fmt(inv.total)}</div></div>
      <div class="stat"><div class="label">Sudah Bayar</div><div class="val" style="font-size:16px">${fmt(inv.paidAmount||0)}</div></div>
      <div class="stat"><div class="label">Sisa</div><div class="val" style="font-size:16px;color:#dc2626">${fmt(s)}</div></div>
    </div>
    <label class="f"><span>Tanggal</span><input type="date" id="pel_tgl" value="${today()}"></label>
   <label class="f"><span>Jumlah Bayar</span><input type="text" inputmode="numeric" class="money" id="pel_jml" value="${money(s)}"></label>
    <label class="f"><span>Masuk ke</span><select id="pel_akun"><option value="1001">Kas</option><option value="1002">Bank</option></select></label>
    <label class="f"><span>Keterangan</span><input id="pel_ket" placeholder="mis: Transfer BCA"></label>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="savePelunasanInvoice('${id}')">Simpan</button>`);
}
function savePelunasanInvoice(id){
  const inv=DB.invoices.find(v=>v.id===id);const jml=num(pel_jml.value);const s=getSisaInvoice(inv);
  if(!jml||jml<=0)return toast('Jumlah wajib','bad');
  if(jml>s)return toast('Melebihi sisa','bad');
  if(isLocked(pel_tgl.value))return toast('Periode dikunci','bad');
  const c=DB.customers.find(x=>x.id===inv.customerId);
  const lines=[{kode:pel_akun.value,debit:jml,kredit:0},{kode:'1101',debit:0,kredit:jml}];
  postJournal({tanggal:pel_tgl.value,ref:'PAY-'+Date.now().toString().slice(-5),ket:`Pelunasan ${inv.no} - ${c?c.nama:'Umum'}${pel_ket.value?' ('+pel_ket.value+')':''}`,lines,source:'payment'});
  inv.paidAmount=(inv.paidAmount||0)+jml;
  inv.status=inv.paidAmount>=inv.total?'lunas':'sebagian';
  DB.payments.push({id:uid(),tanggal:pel_tgl.value,tipe:'AR',refId:inv.id,refNo:inv.no,jumlah:jml,akunKas:pel_akun.value});
  save();closeModal();toast('Pelunasan disimpan');
}
window.openPelunasanInvoice=openPelunasanInvoice;window.savePelunasanInvoice=savePelunasanInvoice;

function openPelunasanPurchase(id){
  const pur=DB.purchases.find(v=>v.id===id);if(!pur)return;
  const s=getSisaInvoice(pur);const v=DB.vendors.find(x=>x.id===pur.vendorId);
  openModal('Pembayaran Faktur '+pur.no,`
    <p style="margin-bottom:8px">Vendor: <b>${esc(v?v.nama:'Umum')}</b></p>
    <div class="grid" style="margin-bottom:12px">
      <div class="stat"><div class="label">Total</div><div class="val" style="font-size:16px">${fmt(pur.total)}</div></div>
      <div class="stat"><div class="label">Sudah Bayar</div><div class="val" style="font-size:16px">${fmt(pur.paidAmount||0)}</div></div>
      <div class="stat"><div class="label">Sisa</div><div class="val" style="font-size:16px;color:#dc2626">${fmt(s)}</div></div>
    </div>
    <label class="f"><span>Tanggal</span><input type="date" id="pel_tgl" value="${today()}"></label>
   <label class="f"><span>Jumlah Bayar</span><input type="text" inputmode="numeric" class="money" id="pel_jml" value="${money(s)}"></label>
    <label class="f"><span>Keluar dari</span><select id="pel_akun"><option value="1001">Kas</option><option value="1002">Bank</option></select></label>
    <label class="f"><span>Keterangan</span><input id="pel_ket" placeholder="mis: Transfer Mandiri"></label>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="savePelunasanPurchase('${id}')">Simpan</button>`);
}
function savePelunasanPurchase(id){
  const pur=DB.purchases.find(v=>v.id===id);const jml=num(pel_jml.value);const s=getSisaInvoice(pur);
  if(!jml||jml<=0)return toast('Jumlah wajib','bad');
  if(jml>s)return toast('Melebihi sisa','bad');
  if(isLocked(pel_tgl.value))return toast('Periode dikunci','bad');
  const v=DB.vendors.find(x=>x.id===pur.vendorId);
  const lines=[{kode:'2001',debit:jml,kredit:0},{kode:pel_akun.value,debit:0,kredit:jml}];
  postJournal({tanggal:pel_tgl.value,ref:'BPY-'+Date.now().toString().slice(-5),ket:`Bayar ${pur.no} - ${v?v.nama:'Umum'}${pel_ket.value?' ('+pel_ket.value+')':''}`,lines,source:'payment'});
  pur.paidAmount=(pur.paidAmount||0)+jml;
  pur.status=pur.paidAmount>=pur.total?'lunas':'sebagian';
  DB.payments.push({id:uid(),tanggal:pel_tgl.value,tipe:'AP',refId:pur.id,refNo:pur.no,jumlah:jml,akunKas:pel_akun.value});
  save();closeModal();toast('Pembayaran disimpan');
}
window.openPelunasanPurchase=openPelunasanPurchase;window.savePelunasanPurchase=savePelunasanPurchase;

/* ===== PENERIMAAN / PENGELUARAN KAS ===== */
function renderPenerimaan(){
  document.getElementById('penerimaan').innerHTML=`
    <h2>Penerimaan Kas / Bank</h2><p class="sub">Uang masuk manual.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Tanggal</span><input type="date" id="rc_tgl" value="${today()}"></label>
        <label class="f"><span>Masuk ke</span><select id="rc_akun"><option value="1001">Kas</option><option value="1002">Bank</option></select></label>
      </div>
      <label class="f"><span>Sumber (akun kredit)</span><select id="rc_kredit">
        ${DB.coa.filter(a=>['Aset','Liabilitas','Ekuitas','Pendapatan'].includes(a.tipe)).map(a=>`<option value="${a.kode}">${a.kode} — ${esc(a.nama)}</option>`).join('')}
      </select></label>
      <label class="f"><span>Jumlah</span><input type="text" inputmode="numeric" class="money" id="rc_jml" value=""></label>
      <label class="f"><span>Keterangan</span><input id="rc_ket"></label>
      <button onclick="saveTerima()">Simpan</button>
    </div>`;
}
function saveTerima(){
const jml=num(rc_jml.value);if(!jml)return toast('Jumlah wajib','bad');
  const lines=[{kode:rc_akun.value,debit:jml,kredit:0},{kode:rc_kredit.value,debit:0,kredit:jml}];
  postJournal({tanggal:rc_tgl.value,ref:'RC-'+Date.now().toString().slice(-5),ket:rc_ket.value||'Penerimaan',lines});
  toast('Tersimpan');rc_jml.value=0;rc_ket.value='';
}
window.saveTerima=saveTerima;

function renderPengeluaran(){
  document.getElementById('pengeluaran').innerHTML=`
    <h2>Pengeluaran Kas / Bank</h2><p class="sub">Uang keluar manual.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Tanggal</span><input type="date" id="pc_tgl" value="${today()}"></label>
        <label class="f"><span>Keluar dari</span><select id="pc_akun"><option value="1001">Kas</option><option value="1002">Bank</option></select></label>
      </div>
      <label class="f"><span>Untuk (akun debit)</span><select id="pc_debit">
        ${DB.coa.filter(a=>['Aset','Liabilitas','Ekuitas','Beban'].includes(a.tipe)).map(a=>`<option value="${a.kode}">${a.kode} — ${esc(a.nama)}</option>`).join('')}
      </select></label>
   <label class="f"><span>Jumlah</span><input type="text" inputmode="numeric" class="money" id="pc_jml" value=""></label>
      <label class="f"><span>Keterangan</span><input id="pc_ket"></label>
      <button onclick="saveKeluar()">Simpan</button>
    </div>`;
}
function saveKeluar(){
const jml=num(pc_jml.value);if(!jml)return toast('Jumlah wajib','bad');
  const lines=[{kode:pc_debit.value,debit:jml,kredit:0},{kode:pc_akun.value,debit:0,kredit:jml}];
  postJournal({tanggal:pc_tgl.value,ref:'PC-'+Date.now().toString().slice(-5),ket:pc_ket.value||'Pengeluaran',lines});
  toast('Tersimpan');pc_jml.value=0;pc_ket.value='';
}
window.saveKeluar=saveKeluar;

/* ===== JURNAL UMUM ===== */
let jvLines=[{kode:'',debit:0,kredit:0},{kode:'',debit:0,kredit:0}];
function renderJurnalUmum(){
  document.getElementById('jurnalumum').innerHTML=`
    <h2>Jurnal Umum</h2><p class="sub">Input jurnal manual.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Tanggal</span><input type="date" id="jv_tgl" value="${today()}"></label>
        <label class="f"><span>Referensi</span><input id="jv_ref" placeholder="JV-001"></label>
      </div>
      <label class="f"><span>Keterangan</span><input id="jv_ket"></label>
      <h3 class="sec">Baris Jurnal</h3>
      <div id="jv_items"></div>
      <button class="ghost sm" onclick="addJvLine()">+ Tambah Baris</button>
      <div style="text-align:right;margin-top:10px;font-size:14px">Debit: <b id="jv_d">Rp 0</b> · Kredit: <b id="jv_k">Rp 0</b></div>
      <div class="row end" style="margin-top:10px"><button onclick="saveJv()">Posting</button></div>
    </div>`;
  renderJvLines();
}
function renderJvLines(){
  document.getElementById('jv_items').innerHTML=jvLines.map((l,i)=>`
    <div class="jline">
      <select onchange="jvChange(${i},'kode',this.value)">
        <option value="">— akun —</option>
        ${DB.coa.map(a=>`<option value="${a.kode}" ${a.kode===l.kode?'selected':''}>${a.kode} — ${esc(a.nama)}</option>`).join('')}
      </select>
  <input type="text" inputmode="numeric" class="money" placeholder="Debit" value="${money(l.debit)}" onchange="jvChange(${i},'debit',num(this.value))">
<input type="text" inputmode="numeric" class="money" placeholder="Kredit" value="${money(l.kredit)}" onchange="jvChange(${i},'kredit',num(this.value))">
      <button class="sm danger" onclick="jvDel(${i})">×</button>
    </div>`).join('');
  document.getElementById('jv_d').textContent=fmt(jvLines.reduce((s,l)=>s+(+l.debit||0),0));
  document.getElementById('jv_k').textContent=fmt(jvLines.reduce((s,l)=>s+(+l.kredit||0),0));
}
function jvChange(i,f,v){jvLines[i][f]=v;if(f==='debit'&&v)jvLines[i].kredit=0;if(f==='kredit'&&v)jvLines[i].debit=0;renderJvLines()}
function addJvLine(){jvLines.push({kode:'',debit:0,kredit:0});renderJvLines()}
function jvDel(i){jvLines.splice(i,1);if(jvLines.length<2)jvLines.push({kode:'',debit:0,kredit:0});renderJvLines()}
window.addJvLine=addJvLine;window.jvDel=jvDel;window.jvChange=jvChange;
function saveJv(){
  const lines=jvLines.filter(l=>l.kode&&((+l.debit||0)||(+l.kredit||0)));
  const d=lines.reduce((s,l)=>s+(+l.debit||0),0);
  const k=lines.reduce((s,l)=>s+(+l.kredit||0),0);
  if(!lines.length)return toast('Isi minimal 1 baris','bad');
  if(d!==k)return toast(`Debit (${fmt(d)}) ≠ Kredit (${fmt(k)})`,'bad');
  postJournal({tanggal:jv_tgl.value,ref:jv_ref.value||'JV-'+Date.now().toString().slice(-4),ket:jv_ket.value||'Jurnal umum',lines});
  toast('Diposting');
  jvLines=[{kode:'',debit:0,kredit:0},{kode:'',debit:0,kredit:0}];
  renderJurnalUmum();
}
window.saveJv=saveJv;

