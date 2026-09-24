/* ===== KARTU STOK ===== */
function renderKartuStok(){
  const sel=window._kartuItem||(DB.items[0]&&DB.items[0].id)||'';
  const wh=window._kartuWh||(DB.warehouses[0]&&DB.warehouses[0].id);
  window._kartuItem=sel;window._kartuWh=wh;
  const it=DB.items.find(x=>x.id===sel);
  let mut=[];
  if(it){
    DB.invoices.forEach(v=>v.items.forEach(l=>{if(l.itemId===it.id&&(v.whId||'utama')===wh)mut.push({tgl:v.tanggal,ref:v.no,ket:'Penjualan',masuk:0,keluar:l.qty})}));
    DB.purchases.forEach(v=>v.items.forEach(l=>{if(l.itemId===it.id&&(v.whId||'utama')===wh)mut.push({tgl:v.tanggal,ref:v.no,ket:'Pembelian',masuk:l.qty,keluar:0})}));
    (DB.transfers||[]).forEach(t=>{
      if(t.itemId===it.id){
        if(t.dari===wh)mut.push({tgl:t.tanggal,ref:t.ref,ket:'Keluar ke '+t.ke,masuk:0,keluar:t.qty});
        if(t.ke===wh)mut.push({tgl:t.tanggal,ref:t.ref,ket:'Masuk dari '+t.dari,masuk:t.qty,keluar:0});
      }
    });
    mut.sort((a,b)=>a.tgl.localeCompare(b.tgl));
  }
  document.getElementById('kartustok').innerHTML=`
    <h2>Kartu Stok</h2><p class="sub">Mutasi per barang per gudang.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Barang</span><select onchange="window._kartuItem=this.value;renderKartuStok()">
          <option value="">— pilih —</option>
          ${DB.items.map(x=>`<option value="${x.id}" ${x.id===sel?'selected':''}>${esc(x.nama)}</option>`).join('')}
        </select></label>
        <label class="f"><span>Gudang</span><select onchange="window._kartuWh=this.value;renderKartuStok()">
          ${DB.warehouses.map(w=>`<option value="${w.id}" ${w.id===wh?'selected':''}>${esc(w.nama)}</option>`).join('')}
        </select></label>
      </div>
    </div>
    ${!it?'<div class="card empty">Pilih barang</div>':`
    <div class="card" style="padding:0">
      <div style="padding:12px 14px;background:var(--soft);font-weight:600">${esc(it.nama)} — Saldo di gudang ini: ${getStok(it.id,wh)||0} ${esc(it.satuan)}</div>
      <div class="tbl-wrap" style="border:0"><table>
        <tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th class="num">Masuk</th><th class="num">Keluar</th><th class="num">Saldo</th></tr>
        ${(()=>{let s=0;return mut.map(m=>{s+=m.masuk-m.keluar;
          return`<tr><td>${m.tgl}</td><td>${m.ref}</td><td>${m.ket}</td>
            <td class="num">${m.masuk||''}</td><td class="num">${m.keluar||''}</td><td class="num"><b>${s}</b></td></tr>`}).join('')})()}
        ${mut.length===0?'<tr><td colspan="6" class="empty">Belum ada mutasi</td></tr>':''}
      </table></div>
    </div>`}`;
}
window.renderKartuStok=renderKartuStok;

/* ===== STOCK OPNAME ===== */
function renderOpname(){
  document.getElementById('opname').innerHTML=`
    <h2>Stock Opname</h2><p class="sub">Koreksi stok per gudang.</p>
    <div class="card">
      <label class="f"><span>Tanggal</span><input type="date" id="op_tgl" value="${today()}"></label>
      <div class="tbl-wrap"><table>
        <tr><th>Barang</th><th>Gudang</th><th class="num">Sistem</th><th class="num">Fisik</th><th class="num">Selisih</th></tr>
        ${DB.items.map(x=>DB.warehouses.map(w=>`
          <tr><td>${esc(x.nama)}</td><td>${esc(w.nama)}</td>
          <td class="num">${getStok(x.id,w.id)||0}</td>
          <td class="num"><input type="number" data-opid="${x.id}" data-opwh="${w.id}" value="${getStok(x.id,w.id)||0}" style="width:80px"></td>
          <td class="num" data-opsel="${x.id}_${w.id}">0</td></tr>`).join('')).join('')}
      </table></div>
      <div class="row end" style="margin-top:12px"><button onclick="saveOpname()">Posting Penyesuaian</button></div>
    </div>`;
  document.querySelectorAll('[data-opid]').forEach(inp=>{
    inp.oninput=()=>{
      const x=DB.items.find(a=>a.id===inp.dataset.opid);
      const sis=getStok(x.id,inp.dataset.opwh)||0;
      const sel=(+inp.value||0)-sis;
      document.querySelector(`[data-opsel="${inp.dataset.opid}_${inp.dataset.opwh}"]`).textContent=sel>0?'+'+sel:sel;
    };
  });
}
function saveOpname(){
  const tgl=op_tgl.value;let tot=0;let ada=0;
  document.querySelectorAll('[data-opid]').forEach(inp=>{
    const x=DB.items.find(a=>a.id===inp.dataset.opid);
    const sis=getStok(x.id,inp.dataset.opwh)||0;
    const sel=(+inp.value||0)-sis;
    if(sel!==0){const n=sel*(x.hargaBeli||0);tot+=n;addStok(x.id,inp.dataset.opwh,sel);ada++}
  });
  if(!ada)return toast('Tidak ada selisih');
  const lines=[];
  if(tot>=0){lines.push({kode:'1201',debit:tot,kredit:0});lines.push({kode:'6901',debit:0,kredit:tot})}
  else{lines.push({kode:'6901',debit:-tot,kredit:0});lines.push({kode:'1201',debit:0,kredit:-tot})}
  postJournal({tanggal:tgl,ref:'OP-'+Date.now().toString().slice(-4),ket:'Penyesuaian stock opname',lines});
  save();renderOpname();toast('Opname diposting');
}
window.saveOpname=saveOpname;

/* ===== TRANSFER GUDANG ===== */
function renderTransfer(){
  DB.transfers=DB.transfers||[];
  document.getElementById('transfer').innerHTML=`
    <h2>Transfer Gudang</h2><p class="sub">Pindahkan stok antar gudang.</p>
    <div class="card">
      <div class="split">
        <label class="f"><span>Tanggal</span><input type="date" id="tr_tgl" value="${today()}"></label>
        <label class="f"><span>Barang</span><select id="tr_item">
          <option value="">— pilih —</option>
          ${DB.items.map(x=>`<option value="${x.id}">${esc(x.nama)}</option>`).join('')}
        </select></label>
      </div>
      <div class="split3">
        <label class="f"><span>Dari</span><select id="tr_dari">
          ${DB.warehouses.map(w=>`<option value="${w.id}">${esc(w.nama)}</option>`).join('')}
        </select></label>
        <label class="f"><span>Ke</span><select id="tr_ke">
          ${DB.warehouses.map(w=>`<option value="${w.id}">${esc(w.nama)}</option>`).join('')}
        </select></label>
        <label class="f"><span>Qty</span><input type="number" id="tr_qty" value="1" min="1"></label>
      </div>
      <button onclick="saveTransfer()">Simpan Transfer</button>
    </div>
    <div class="card" style="padding:0">
      <div style="padding:12px 14px;background:var(--soft);font-weight:600;font-size:13px">Riwayat Transfer</div>
      ${(DB.transfers||[]).length===0?'<div class="empty">Belum ada transfer</div>':`
      <div class="tbl-wrap" style="border:0"><table>
        <tr><th>Ref</th><th>Tanggal</th><th>Barang</th><th>Dari</th><th>Ke</th><th class="num">Qty</th><th></th></tr>
        ${DB.transfers.slice().reverse().map(t=>{
          const it=DB.items.find(x=>x.id===t.itemId);
          const wd=DB.warehouses.find(w=>w.id===t.dari);
          const wk=DB.warehouses.find(w=>w.id===t.ke);
          return`<tr><td>${t.ref}</td><td>${t.tanggal}</td><td>${esc(it?it.nama:'?')}</td>
            <td>${esc(wd?wd.nama:'?')}</td><td>${esc(wk?wk.nama:'?')}</td>
            <td class="num">${t.qty}</td>
            <td style="text-align:right"><button class="sm danger" onclick="delTransfer('${t.id}')">×</button></td></tr>`;
        }).join('')}
      </table></div>`}
    </div>`;
}
function saveTransfer(){
  const itemId=tr_item.value,dari=tr_dari.value,ke=tr_ke.value,qty=+tr_qty.value||0,tgl=tr_tgl.value;
  if(!itemId)return toast('Pilih barang','bad');
  if(dari===ke)return toast('Gudang asal & tujuan sama','bad');
  if(qty<=0)return toast('Qty harus > 0','bad');
  if(isLocked(tgl))return toast('Periode dikunci','bad');
  if(qty>(getStok(itemId,dari)||0))return toast('Stok gudang asal tidak cukup','bad');
  addStok(itemId,dari,-qty);addStok(itemId,ke,qty);
  DB.transfers=DB.transfers||[];
  DB.transfers.push({id:uid(),ref:'TRF-'+Date.now().toString().slice(-5),tanggal:tgl,itemId,dari,ke,qty});
  save();renderTransfer();toast('Transfer disimpan');
}
function delTransfer(id){
  const t=DB.transfers.find(x=>x.id===id);if(!t)return;
  if(!confirm('Batalkan transfer? Stok dikembalikan.'))return;
  addStok(t.itemId,t.ke,-t.qty);addStok(t.itemId,t.dari,t.qty);
  DB.transfers=DB.transfers.filter(x=>x.id!==id);
  save();renderTransfer();toast('Dibatalkan');
}
window.saveTransfer=saveTransfer;window.delTransfer=delTransfer;

