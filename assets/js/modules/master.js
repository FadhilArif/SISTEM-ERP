function renderPerusahaan(){
  const c=DB.company;
  document.getElementById('perusahaan').innerHTML=`
    <h2>Profil Perusahaan</h2><p class="sub">Identitas entitas.</p>
    <div class="card">
      <label class="f"><span>Nama Perusahaan</span><input id="c_nama" value="${esc(c.nama)}"></label>
      <label class="f"><span>Alamat</span><textarea id="c_alamat" rows="2">${esc(c.alamat)}</textarea></label>
      <div class="split">
        <label class="f"><span>Telepon</span><input id="c_telp" value="${esc(c.telp)}"></label>
        <label class="f"><span>NPWP</span><input id="c_npwp" value="${esc(c.npwp)}"></label>
      </div>
      <button onclick="savePerusahaan()">Simpan</button>
    </div>`;
}
function savePerusahaan(){DB.company={nama:c_nama.value,alamat:c_alamat.value,telp:c_telp.value,npwp:c_npwp.value};save();toast('Tersimpan')}
window.savePerusahaan=savePerusahaan;

function renderCOA(){
  const groups=['Aset','Liabilitas','Ekuitas','Pendapatan','Beban'];
  document.getElementById('coa').innerHTML=`
    <h2>Chart of Accounts</h2><p class="sub">Daftar akun.</p>
    <div class="row" style="margin-bottom:10px"><button onclick="editCOA()">+ Tambah Akun</button></div>
    ${groups.map(g=>{
      const rows=DB.coa.filter(a=>a.tipe===g).sort((a,b)=>a.kode.localeCompare(b.kode));
      if(!rows.length)return'';
      return`<div class="card" style="padding:0;overflow:hidden">
        <div style="padding:10px 14px;background:var(--soft);font-weight:600;font-size:13px">${g}</div>
        <div class="tbl-wrap" style="border:0;border-radius:0"><table>
          <tr><th>Kode</th><th>Nama Akun</th><th class="num">Saldo</th><th></th></tr>
          ${rows.map(a=>`<tr><td>${a.kode}</td><td>${esc(a.nama)}</td><td class="num">${fmt(saldo(a.kode))}</td>
            <td style="text-align:right"><button class="sm ghost" onclick="editCOA('${a.kode}')">Edit</button><button class="sm danger" onclick="delCOA('${a.kode}')">×</button></td></tr>`).join('')}
        </table></div></div>`;
    }).join('')}`;
}
function editCOA(k){
  const a=k?acc(k):{kode:'',nama:'',tipe:'Aset'};
  openModal(k?'Edit Akun':'Tambah Akun',`
    <label class="f"><span>Kode</span><input id="a_kode" value="${esc(a.kode)}" ${k?'readonly':''}></label>
    <label class="f"><span>Nama</span><input id="a_nama" value="${esc(a.nama)}"></label>
    <label class="f"><span>Tipe</span><select id="a_tipe">${['Aset','Liabilitas','Ekuitas','Pendapatan','Beban'].map(t=>`<option ${t===a.tipe?'selected':''}>${t}</option>`).join('')}</select></label>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="saveCOA('${k||''}')">Simpan</button>`);
}
function saveCOA(old){
  const k=a_kode.value.trim(),n=a_nama.value.trim(),t=a_tipe.value;
  if(!k||!n)return toast('Kode & nama wajib','bad');
  if(!old&&acc(k))return toast('Kode sudah ada','bad');
  if(old){const a=acc(old);a.nama=n;a.tipe=t;if(old!==k){a.kode=k;DB.journals.forEach(j=>j.lines.forEach(l=>{if(l.kode===old)l.kode=k}))}}
  else DB.coa.push({kode:k,nama:n,tipe:t});
  save();closeModal();renderCOA();toast('Tersimpan');
}
function delCOA(k){if(DB.journals.some(j=>j.lines.some(l=>l.kode===k)))return toast('Akun sudah dipakai','bad');if(!confirm('Hapus?'))return;DB.coa=DB.coa.filter(a=>a.kode!==k);save();renderCOA()}
window.editCOA=editCOA;window.saveCOA=saveCOA;window.delCOA=delCOA;

function renderCustomer(){
  document.getElementById('customer').innerHTML=`
    <h2>Pelanggan</h2><p class="sub">Master data customer.</p>
    <button onclick="editCust()">+ Tambah Pelanggan</button>
    <div class="card" style="padding:0;margin-top:12px">
    ${DB.customers.length===0?'<div class="empty">Belum ada pelanggan</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Nama</th><th>Telepon</th><th class="num">Piutang</th><th></th></tr>
      ${DB.customers.map(c=>{
        const p=piutangPerCustomer(c.id);
        return`<tr><td><a style="color:var(--brand);cursor:pointer;font-weight:600" onclick="showDetailCustomer('${c.id}')">${esc(c.nama)}</a></td>
          <td>${esc(c.telp)}</td><td class="num">${p>0?'<b style="color:#dc2626">'+fmt(p)+'</b>':'-'}</td>
          <td style="text-align:right"><button class="sm ghost" onclick="showDetailCustomer('${c.id}')">Detail</button>
          <button class="sm ghost" onclick="editCust('${c.id}')">Edit</button>
          <button class="sm danger" onclick="delCust('${c.id}')">×</button></td></tr>`;
      }).join('')}
    </table></div>`}</div>`;
}
function editCust(id){
  const c=id?DB.customers.find(x=>x.id===id):{nama:'',telp:'',alamat:''};
  openModal(id?'Edit Pelanggan':'Tambah Pelanggan',`
    <label class="f"><span>Nama</span><input id="cu_nama" value="${esc(c.nama)}"></label>
    <label class="f"><span>Telepon</span><input id="cu_telp" value="${esc(c.telp)}"></label>
    <label class="f"><span>Alamat</span><textarea id="cu_alamat" rows="2">${esc(c.alamat)}</textarea></label>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="saveCust('${id||''}')">Simpan</button>`);
}
function saveCust(id){
  const n=cu_nama.value.trim();if(!n)return toast('Nama wajib','bad');
  if(id){const c=DB.customers.find(x=>x.id===id);c.nama=n;c.telp=cu_telp.value;c.alamat=cu_alamat.value}
  else DB.customers.push({id:uid(),nama:n,telp:cu_telp.value,alamat:cu_alamat.value});
  save();closeModal();renderCustomer();toast('Tersimpan');
}
function delCust(id){if(DB.invoices.some(v=>v.customerId===id))return toast('Pelanggan punya invoice','bad');if(!confirm('Hapus?'))return;DB.customers=DB.customers.filter(c=>c.id!==id);save();renderCustomer()}
window.editCust=editCust;window.saveCust=saveCust;window.delCust=delCust;

function showDetailCustomer(id){
  const c=DB.customers.find(x=>x.id===id);if(!c)return;
  const invs=(DB.invoices||[]).filter(v=>v.customerId===id).sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const tp=piutangPerCustomer(id),tt=invs.reduce((s,v)=>s+v.total,0);
  openModal('Detail Pelanggan: '+c.nama,`
    <div class="grid" style="margin-bottom:14px">
      <div class="stat"><div class="label">Total Penjualan</div><div class="val">${fmt(tt)}</div></div>
      <div class="stat"><div class="label">Piutang</div><div class="val" style="color:#dc2626">${fmt(tp)}</div></div>
      <div class="stat"><div class="label">Invoice</div><div class="val">${invs.length}</div></div>
    </div>
    <p style="font-size:13px;color:#64748b;margin-bottom:12px">📞 ${esc(c.telp||'-')} · 📍 ${esc(c.alamat||'-')}</p>
    <h3 class="sec">Riwayat Invoice</h3>
    ${invs.length===0?'<div class="empty">Belum ada invoice</div>':`
    <div class="tbl-wrap"><table>
      <tr><th>No</th><th>Tanggal</th><th>Jatuh Tempo</th><th class="num">Total</th><th class="num">Sisa</th><th>Status</th><th></th></tr>
      ${invs.map(v=>{
        const s=getSisaInvoice(v);const lw=v.bayar==='kredit'&&s>0&&v.dueDate&&v.dueDate<today();
        return`<tr><td>${v.no}</td><td>${v.tanggal}</td>
          <td>${v.bayar==='kredit'?v.dueDate:'-'}${lw?' <span class="badge bad">Lewat</span>':''}</td>
          <td class="num">${fmt(v.total)}</td>
          <td class="num">${s>0?'<b style="color:#dc2626">'+fmt(s)+'</b>':'-'}</td>
          <td>${getStatusLabel(v.status)}</td>
          <td style="text-align:right">${s>0?`<button class="sm ok" onclick="closeModal();openPelunasanInvoice('${v.id}')">Lunasi</button>`:''}
          <button class="sm ghost" onclick="printInvoice('${v.id}')">🖨️</button></td></tr>`;
      }).join('')}
    </table></div>`}`);
}
window.showDetailCustomer=showDetailCustomer;

function renderVendor(){
  document.getElementById('vendor').innerHTML=`
    <h2>Pemasok / Vendor</h2><p class="sub">Master data supplier.</p>
    <button onclick="editVend()">+ Tambah Vendor</button>
    <div class="card" style="padding:0;margin-top:12px">
    ${DB.vendors.length===0?'<div class="empty">Belum ada vendor</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Nama</th><th>Telepon</th><th class="num">Utang</th><th></th></tr>
      ${DB.vendors.map(c=>{
        const u=utangPerVendor(c.id);
        return`<tr><td><a style="color:var(--brand);cursor:pointer;font-weight:600" onclick="showDetailVendor('${c.id}')">${esc(c.nama)}</a></td>
          <td>${esc(c.telp)}</td><td class="num">${u>0?'<b style="color:#dc2626">'+fmt(u)+'</b>':'-'}</td>
          <td style="text-align:right"><button class="sm ghost" onclick="showDetailVendor('${c.id}')">Detail</button>
          <button class="sm ghost" onclick="editVend('${c.id}')">Edit</button>
          <button class="sm danger" onclick="delVend('${c.id}')">×</button></td></tr>`;
      }).join('')}
    </table></div>`}</div>`;
}
function editVend(id){
  const c=id?DB.vendors.find(x=>x.id===id):{nama:'',telp:'',alamat:''};
  openModal(id?'Edit Vendor':'Tambah Vendor',`
    <label class="f"><span>Nama</span><input id="ve_nama" value="${esc(c.nama)}"></label>
    <label class="f"><span>Telepon</span><input id="ve_telp" value="${esc(c.telp)}"></label>
    <label class="f"><span>Alamat</span><textarea id="ve_alamat" rows="2">${esc(c.alamat)}</textarea></label>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="saveVend('${id||''}')">Simpan</button>`);
}
function saveVend(id){
  const n=ve_nama.value.trim();if(!n)return toast('Nama wajib','bad');
  if(id){const c=DB.vendors.find(x=>x.id===id);c.nama=n;c.telp=ve_telp.value;c.alamat=ve_alamat.value}
  else DB.vendors.push({id:uid(),nama:n,telp:ve_telp.value,alamat:ve_alamat.value});
  save();closeModal();renderVendor();toast('Tersimpan');
}
function delVend(id){if(DB.purchases.some(v=>v.vendorId===id))return toast('Vendor punya faktur','bad');if(!confirm('Hapus?'))return;DB.vendors=DB.vendors.filter(c=>c.id!==id);save();renderVendor()}
window.editVend=editVend;window.saveVend=saveVend;window.delVend=delVend;

function showDetailVendor(id){
  const c=DB.vendors.find(x=>x.id===id);if(!c)return;
  const purs=(DB.purchases||[]).filter(v=>v.vendorId===id).sort((a,b)=>b.tanggal.localeCompare(a.tanggal));
  const tu=utangPerVendor(id),tp=purs.reduce((s,v)=>s+v.total,0);
  openModal('Detail Vendor: '+c.nama,`
    <div class="grid" style="margin-bottom:14px">
      <div class="stat"><div class="label">Total Pembelian</div><div class="val">${fmt(tp)}</div></div>
      <div class="stat"><div class="label">Utang</div><div class="val" style="color:#dc2626">${fmt(tu)}</div></div>
      <div class="stat"><div class="label">Faktur</div><div class="val">${purs.length}</div></div>
    </div>
    <p style="font-size:13px;color:#64748b;margin-bottom:12px">📞 ${esc(c.telp||'-')} · 📍 ${esc(c.alamat||'-')}</p>
    <h3 class="sec">Riwayat Faktur Pembelian</h3>
    ${purs.length===0?'<div class="empty">Belum ada faktur</div>':`
    <div class="tbl-wrap"><table>
      <tr><th>No</th><th>Tanggal</th><th>Jatuh Tempo</th><th class="num">Total</th><th class="num">Sisa</th><th>Status</th><th></th></tr>
      ${purs.map(v=>{
        const s=getSisaInvoice(v);const lw=v.bayar==='kredit'&&s>0&&v.dueDate&&v.dueDate<today();
        return`<tr><td>${v.no}</td><td>${v.tanggal}</td>
          <td>${v.bayar==='kredit'?v.dueDate:'-'}${lw?' <span class="badge bad">Lewat</span>':''}</td>
          <td class="num">${fmt(v.total)}</td>
          <td class="num">${s>0?'<b style="color:#dc2626">'+fmt(s)+'</b>':'-'}</td>
          <td>${getStatusLabel(v.status)}</td>
          <td style="text-align:right">${s>0?`<button class="sm ok" onclick="closeModal();openPelunasanPurchase('${v.id}')">Bayar</button>`:''}</td></tr>`;
      }).join('')}
    </table></div>`}`);
}
window.showDetailVendor=showDetailVendor;

function renderBarang(){
  document.getElementById('barang').innerHTML=`
    <h2>Barang & Jasa</h2><p class="sub">Master data produk. Stok total dari semua gudang.</p>
    <button onclick="editBarang()">+ Tambah Barang</button>
    <div class="card" style="padding:0;margin-top:12px">
    ${DB.items.length===0?'<div class="empty">Belum ada barang</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Kode</th><th>Nama</th><th>Satuan</th><th class="num">H. Beli</th><th class="num">H. Jual</th><th class="num">Stok</th><th>Per Gudang</th><th></th></tr>
      ${DB.items.map(x=>`<tr><td>${esc(x.kode)}</td><td>${esc(x.nama)}</td><td>${esc(x.satuan)}</td>
        <td class="num">${fmt(x.hargaBeli)}</td><td class="num">${fmt(x.hargaJual)}</td>
        <td class="num"><b>${totalStok(x)}</b></td>
        <td><span style="font-size:11px;color:#64748b">${DB.warehouses.map(w=>esc(w.nama)+': '+(getStok(x.id,w.id)||0)).join(' · ')}</span></td>
        <td style="text-align:right"><button class="sm ghost" onclick="editBarang('${x.id}')">Edit</button>
        <button class="sm danger" onclick="delBarang('${x.id}')">×</button></td></tr>`).join('')}
    </table></div>`}</div>`;
}
function editBarang(id){
  const x=id?DB.items.find(a=>a.id===id):{kode:'',nama:'',satuan:'pcs',hargaBeli:0,hargaJual:0,stokPerGudang:{}};
  const stokHTML=DB.warehouses.map(w=>`
    <label class="f"><span>Stok di ${esc(w.nama)}</span><input type="number" data-wh="${w.id}" value="${id?(getStok(id,w.id)||0):0}"></label>
  `).join('');
  openModal(id?'Edit Barang':'Tambah Barang',`
    <div class="split">
      <label class="f"><span>Kode</span><input id="b_kode" value="${esc(x.kode)}"></label>
      <label class="f"><span>Satuan</span><input id="b_satuan" value="${esc(x.satuan)}"></label>
    </div>
    <label class="f"><span>Nama Barang/Jasa</span><input id="b_nama" value="${esc(x.nama)}"></label>
    <div class="split">
  <label class="f"><span>Harga Beli</span><input type="text" inputmode="numeric" class="money" id="b_beli" value="${money(x.hargaBeli)}"></label>
<label class="f"><span>Harga Jual</span><input type="text" inputmode="numeric" class="money" id="b_jual" value="${money(x.hargaJual)}"></label>
    </div>
    <h3 class="sec">Stok per Gudang</h3>
    ${stokHTML}
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="saveBarang('${id||''}')">Simpan</button>`);
}
function saveBarang(id){
  const n=b_nama.value.trim();if(!n)return toast('Nama wajib','bad');
  const stokPerGudang={};
  document.querySelectorAll('[data-wh]').forEach(inp=>{
    const whId=inp.dataset.wh;
    // Ambil angka, buang karakter non-digit
    const raw=String(inp.value||'').replace(/[^\d-]/g,'');
    const q=parseInt(raw,10)||0;
    stokPerGudang[whId]=q;   // simpan termasuk nilai 0
  });
  const totalStok=Object.values(stokPerGudang).reduce((a,b)=>a+(+b||0),0);
  const data={
    kode:b_kode.value,
    nama:n,
    satuan:b_satuan.value,
    hargaBeli:num(b_beli.value),
    hargaJual:num(b_jual.value),
    stokPerGudang:stokPerGudang,
    stok:totalStok
  };
  if(id){
    const it=DB.items.find(x=>x.id===id);
    Object.assign(it,data);
  }else{
    DB.items.push({id:uid(),...data});
  }
  save();closeModal();renderBarang();toast('Tersimpan');
}
function delBarang(id){if(!confirm('Hapus?'))return;DB.items=DB.items.filter(x=>x.id!==id);save();renderBarang()}
window.editBarang=editBarang;window.saveBarang=saveBarang;window.delBarang=delBarang;

/* ===== GUDANG ===== */
function renderGudang(){
  document.getElementById('gudang').innerHTML=`
    <h2>Gudang</h2><p class="sub">Daftar lokasi penyimpanan stok.</p>
    <button onclick="editGudang()">+ Tambah Gudang</button>
    <div class="card" style="padding:0;margin-top:12px">
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Nama</th><th>Alamat</th><th class="num">Jenis Barang</th><th class="num">Total Unit</th><th></th></tr>
      ${DB.warehouses.map(w=>{
        const jenis=DB.items.filter(x=>(getStok(x.id,w.id)||0)!==0).length;
        const total=DB.items.reduce((s,x)=>s+(getStok(x.id,w.id)||0),0);
        return`<tr><td>${esc(w.nama)}</td><td>${esc(w.alamat||'-')}</td>
          <td class="num">${jenis}</td><td class="num">${total}</td>
          <td style="text-align:right">${DB.warehouses.length>1?`<button class="sm danger" onclick="delGudang('${w.id}')">×</button>`:''}</td></tr>`;
      }).join('')}
    </table></div></div>`;
}
function editGudang(){
  openModal('Tambah Gudang',`
    <label class="f"><span>Nama Gudang</span><input id="w_nama" placeholder="mis: Gudang Cabang"></label>
    <label class="f"><span>Alamat</span><textarea id="w_alamat" rows="2"></textarea></label>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="saveGudang()">Simpan</button>`);
}
function saveGudang(){
  const n=w_nama.value.trim();if(!n)return toast('Nama wajib','bad');
  DB.warehouses.push({id:uid(),nama:n,alamat:w_alamat.value});
  save();closeModal();renderGudang();toast('Tersimpan');
}
function delGudang(id){
  const ada=DB.items.some(x=>(getStok(x.id,id)||0)!==0);
  if(ada)return toast('Gudang masih punya stok','bad');
  if(!confirm('Hapus gudang?'))return;
  DB.warehouses=DB.warehouses.filter(w=>w.id!==id);
  save();renderGudang();toast('Terhapus');
}
window.editGudang=editGudang;window.saveGudang=saveGudang;window.delGudang=delGudang;

/* ===== ASET TETAP ===== */
function renderAset(){
  const total=DB.assets.reduce((s,a)=>s+a.hargaPerolehan,0);
  const penyusutan=DB.assets.reduce((s,a)=>s+(a.totalTersusut||0),0);
  const buku=total-penyusutan;
  document.getElementById('aset').innerHTML=`
    <h2>Aset Tetap</h2><p class="sub">Daftar aset dan penyusutan garis lurus.</p>
    <div class="grid" style="margin-bottom:14px">
      <div class="stat"><div class="label">Harga Perolehan</div><div class="val">${fmt(total)}</div></div>
      <div class="stat"><div class="label">Akum. Penyusutan</div><div class="val" style="color:#dc2626">${fmt(penyusutan)}</div></div>
      <div class="stat"><div class="label">Nilai Buku</div><div class="val" style="color:#16a34a">${fmt(buku)}</div></div>
    </div>
    <div class="row" style="margin-bottom:12px">
      <button onclick="editAset()">+ Tambah Aset</button>
      <button class="ok" onclick="postingPenyusutanBulanan()">📅 Posting Penyusutan Bulan Ini</button>
    </div>
    <div class="card" style="padding:0">
    ${DB.assets.length===0?'<div class="empty">Belum ada aset</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Nama</th><th>Perolehan</th><th class="num">Harga</th><th class="num">Umur (bln)</th><th class="num">Penyusutan/bln</th><th class="num">Tersusut</th><th class="num">Nilai Buku</th><th></th></tr>
      ${DB.assets.map(a=>{
        const nb=a.hargaPerolehan-(a.totalTersusut||0);
        return`<tr><td>${esc(a.nama)}</td><td>${a.tanggal}</td>
          <td class="num">${fmt(a.hargaPerolehan)}</td><td class="num">${a.umurBulan}</td>
          <td class="num">${fmt(a.penyusutanBulanan)}</td>
          <td class="num">${fmt(a.totalTersusut||0)}</td>
          <td class="num">${fmt(nb)}</td>
          <td style="text-align:right">
            <button class="sm ghost" onclick="riwayatAset('${a.id}')">Riwayat</button>
            <button class="sm ghost" onclick="editAset('${a.id}')">Edit</button>
            <button class="sm danger" onclick="delAset('${a.id}')">×</button>
          </td></tr>`;
      }).join('')}
    </table></div>`}</div>`;
}
function editAset(id){
  const a=id?DB.assets.find(x=>x.id===id):{nama:'',tanggal:today(),hargaPerolehan:0,umurBulan:60};
  openModal(id?'Edit Aset':'Tambah Aset',`
    <label class="f"><span>Nama Aset</span><input id="as_nama" value="${esc(a.nama)}" placeholder="mis: Peralatan Medis"></label>
    <div class="split">
      <label class="f"><span>Tanggal Perolehan</span><input type="date" id="as_tgl" value="${a.tanggal}"></label>
      <label class="f"><span>Umur Ekonomis (bulan)</span><input type="number" id="as_umur" value="${a.umurBulan}"></label>
    </div>
<label class="f"><span>Harga Perolehan</span><input type="text" inputmode="numeric" class="money" id="as_harga" value="${money(a.hargaPerolehan)}"></label>
    <p style="font-size:12px;color:#64748b">Metode penyusutan: garis lurus. Akun: Peralatan (1301), Akum. Penyusutan (1302), Beban Penyusutan (6005).</p>
  `,`<button class="ghost" onclick="closeModal()">Batal</button><button onclick="saveAset('${id||''}')">Simpan</button>`);
}
function saveAset(id){
  const n=as_nama.value.trim();const h=num(as_harga.value);const u=+as_umur.value||60;
  if(!n||h<=0)return toast('Nama & harga wajib','bad');
  const data={nama:n,tanggal:as_tgl.value,hargaPerolehan:h,umurBulan:u,penyusutanBulanan:Math.round(h/u),totalTersusut:0,postingLog:[]};
  if(id){
    const a=DB.assets.find(x=>x.id===id);
    const oldP=a.penyusutanBulanan;
    Object.assign(a,{nama:n,tanggal:as_tgl.value,hargaPerolehan:h,umurBulan:u,penyusutanBulanan:Math.round(h/u)});
  } else DB.assets.push({id:uid(),...data});
  save();closeModal();renderAset();toast('Tersimpan');
}
function delAset(id){
  if(!confirm('Hapus aset ini? Jurnal penyusutan lama tetap ada.'))return;
  DB.assets=DB.assets.filter(a=>a.id!==id);save();renderAset();toast('Terhapus');
}
function riwayatAset(id){
  const a=DB.assets.find(x=>x.id===id);if(!a)return;
  openModal('Riwayat Penyusutan: '+a.nama,`
    ${!a.postingLog||!a.postingLog.length?'<div class="empty">Belum ada penyusutan yang diposting</div>':`
    <div class="tbl-wrap"><table>
      <tr><th>Bulan</th><th>Tanggal Posting</th><th class="num">Jumlah</th></tr>
      ${a.postingLog.map(l=>`<tr><td>${l.bulan}</td><td>${l.tanggal}</td><td class="num">${fmt(l.jumlah)}</td></tr>`).join('')}
      <tr class="tot"><td colspan="2">Total</td><td class="num">${fmt(a.totalTersusut||0)}</td></tr>
    </table></div>`}`);
}
function postingPenyusutanBulanan(){
  const bulan=monthOf(today());
  if(isLocked(today()))return toast('Periode bulan ini sudah dikunci','bad');
  let posted=0;
  DB.assets.forEach(a=>{
    if(a.totalTersusut>=a.hargaPerolehan)return;
    a.postingLog=a.postingLog||[];
    if(a.postingLog.find(l=>l.bulan===bulan))return;
    const sisa=a.hargaPerolehan-a.totalTersusut;
    const jml=Math.min(a.penyusutanBulanan,sisa);
    const lines=[
      {kode:'6005',debit:jml,kredit:0},
      {kode:'1302',debit:0,kredit:jml}
    ];
    postJournal({tanggal:today(),ref:'DEP-'+bulan+'-'+a.id.slice(0,4),ket:'Penyusutan '+a.nama+' ('+bulan+')',lines,source:'depreciation'});
    a.totalTersusut+=jml;
    a.postingLog.push({bulan,tanggal:today(),jumlah:jml});
    posted++;
  });
  if(!posted)return toast('Semua aset sudah diposting bulan ini');
  save();renderAset();toast(posted+' aset diposting');
}
window.editAset=editAset;window.saveAset=saveAset;window.delAset=delAset;window.riwayatAset=riwayatAset;window.postingPenyusutanBulanan=postingPenyusutanBulanan;
