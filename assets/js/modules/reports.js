/* ===== LAPORAN PIUTANG / UTANG / AGING ===== */
function renderLapPiutang(){
  const t=today();
  const rows=DB.customers.map(c=>{
    const invs=DB.invoices.filter(v=>v.customerId===c.id&&v.bayar==='kredit');
    const sisa=invs.reduce((s,v)=>s+getSisaInvoice(v),0);
    const belum=invs.filter(v=>v.status!=='lunas').length;
    const lewat=invs.filter(v=>getSisaInvoice(v)>0&&v.dueDate&&v.dueDate<t).reduce((s,v)=>s+getSisaInvoice(v),0);
    return{c,invs,sisa,belum,lewat};
  }).filter(r=>r.invs.length>0);
  const totSisa=rows.reduce((s,r)=>s+r.sisa,0);
  const totLewat=rows.reduce((s,r)=>s+r.lewat,0);
  document.getElementById('lappiutang').innerHTML=`
    <h2>Laporan Piutang</h2><p class="sub">Piutang per pelanggan.</p>
    <div class="grid" style="margin-bottom:14px">
      <div class="stat"><div class="label">Total Piutang</div><div class="val">${fmt(totSisa)}</div></div>
      <div class="stat"><div class="label">Lewat Tempo</div><div class="val" style="color:#dc2626">${fmt(totLewat)}</div></div>
      <div class="stat"><div class="label">Pelanggan</div><div class="val">${rows.length}</div></div>
    </div>
    <div class="card" style="padding:0">
    ${rows.length===0?'<div class="empty">Belum ada piutang</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Pelanggan</th><th class="num">Invoice</th><th class="num">Belum Lunas</th><th class="num">Total Piutang</th><th class="num">Lewat Tempo</th><th></th></tr>
      ${rows.map(r=>`<tr>
        <td><a style="color:var(--brand);cursor:pointer;font-weight:600" onclick="showDetailCustomer('${r.c.id}')">${esc(r.c.nama)}</a></td>
        <td class="num">${r.invs.length}</td><td class="num">${r.belum}</td>
        <td class="num"><b>${fmt(r.sisa)}</b></td>
        <td class="num" style="color:${r.lewat>0?'#dc2626':'#64748b'}">${r.lewat>0?fmt(r.lewat):'-'}</td>
        <td style="text-align:right"><button class="sm ghost" onclick="showDetailCustomer('${r.c.id}')">Detail</button></td>
      </tr>`).join('')}
      <tr class="tot"><td colspan="3">Total</td><td class="num">${fmt(totSisa)}</td><td class="num" style="color:#dc2626">${fmt(totLewat)}</td><td></td></tr>
    </table></div>`}
    </div>
    <div class="card">
      <h3 class="sec" style="margin-top:0">Invoice Belum Lunas</h3>
      ${(()=>{
        const p=DB.invoices.filter(v=>v.bayar==='kredit'&&getSisaInvoice(v)>0).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
        if(!p.length)return'<div class="empty">Semua lunas 🎉</div>';
        return`<div class="tbl-wrap"><table>
          <tr><th>No</th><th>Tanggal</th><th>Pelanggan</th><th>Jatuh Tempo</th><th class="num">Total</th><th class="num">Sisa</th><th></th></tr>
          ${p.map(v=>{
            const c=DB.customers.find(x=>x.id===v.customerId);const lw=v.dueDate&&v.dueDate<today();
            return`<tr><td>${v.no}</td><td>${v.tanggal}</td><td>${esc(c?c.nama:'Umum')}</td>
              <td>${v.dueDate||'-'} ${lw?'<span class="badge bad">Lewat</span>':''}</td>
              <td class="num">${fmt(v.total)}</td>
              <td class="num"><b style="color:#dc2626">${fmt(getSisaInvoice(v))}</b></td>
              <td style="text-align:right"><button class="sm ok" onclick="openPelunasanInvoice('${v.id}')">Lunasi</button>
              <button class="sm ghost" onclick="printInvoice('${v.id}')">🖨️</button></td></tr>`;
          }).join('')}
        </table></div>`;
      })()}
    </div>`;
}

function renderLapUtang(){
  const t=today();
  const rows=DB.vendors.map(c=>{
    const purs=DB.purchases.filter(v=>v.vendorId===c.id&&v.bayar==='kredit');
    const sisa=purs.reduce((s,v)=>s+getSisaInvoice(v),0);
    const belum=purs.filter(v=>v.status!=='lunas').length;
    const lewat=purs.filter(v=>getSisaInvoice(v)>0&&v.dueDate&&v.dueDate<t).reduce((s,v)=>s+getSisaInvoice(v),0);
    return{c,purs,sisa,belum,lewat};
  }).filter(r=>r.purs.length>0);
  const totSisa=rows.reduce((s,r)=>s+r.sisa,0);
  const totLewat=rows.reduce((s,r)=>s+r.lewat,0);
  document.getElementById('laputang').innerHTML=`
    <h2>Laporan Utang</h2><p class="sub">Utang per vendor.</p>
    <div class="grid" style="margin-bottom:14px">
      <div class="stat"><div class="label">Total Utang</div><div class="val">${fmt(totSisa)}</div></div>
      <div class="stat"><div class="label">Lewat Tempo</div><div class="val" style="color:#dc2626">${fmt(totLewat)}</div></div>
      <div class="stat"><div class="label">Vendor</div><div class="val">${rows.length}</div></div>
    </div>
    <div class="card" style="padding:0">
    ${rows.length===0?'<div class="empty">Belum ada utang</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Vendor</th><th class="num">Faktur</th><th class="num">Belum Lunas</th><th class="num">Total Utang</th><th class="num">Lewat Tempo</th><th></th></tr>
      ${rows.map(r=>`<tr>
        <td><a style="color:var(--brand);cursor:pointer;font-weight:600" onclick="showDetailVendor('${r.c.id}')">${esc(r.c.nama)}</a></td>
        <td class="num">${r.purs.length}</td><td class="num">${r.belum}</td>
        <td class="num"><b>${fmt(r.sisa)}</b></td>
        <td class="num" style="color:${r.lewat>0?'#dc2626':'#64748b'}">${r.lewat>0?fmt(r.lewat):'-'}</td>
        <td style="text-align:right"><button class="sm ghost" onclick="showDetailVendor('${r.c.id}')">Detail</button></td>
      </tr>`).join('')}
      <tr class="tot"><td colspan="3">Total</td><td class="num">${fmt(totSisa)}</td><td class="num" style="color:#dc2626">${fmt(totLewat)}</td><td></td></tr>
    </table></div>`}
    </div>
    <div class="card">
      <h3 class="sec" style="margin-top:0">Faktur Belum Dibayar</h3>
      ${(()=>{
        const p=DB.purchases.filter(v=>v.bayar==='kredit'&&getSisaInvoice(v)>0).sort((a,b)=>(a.dueDate||'').localeCompare(b.dueDate||''));
        if(!p.length)return'<div class="empty">Semua lunas 🎉</div>';
        return`<div class="tbl-wrap"><table>
          <tr><th>No</th><th>Tanggal</th><th>Vendor</th><th>Jatuh Tempo</th><th class="num">Total</th><th class="num">Sisa</th><th></th></tr>
          ${p.map(v=>{
            const c=DB.vendors.find(x=>x.id===v.vendorId);const lw=v.dueDate&&v.dueDate<today();
            return`<tr><td>${v.no}</td><td>${v.tanggal}</td><td>${esc(c?c.nama:'Umum')}</td>
              <td>${v.dueDate||'-'} ${lw?'<span class="badge bad">Lewat</span>':''}</td>
              <td class="num">${fmt(v.total)}</td>
              <td class="num"><b style="color:#dc2626">${fmt(getSisaInvoice(v))}</b></td>
              <td style="text-align:right"><button class="sm ok" onclick="openPelunasanPurchase('${v.id}')">Bayar</button></td></tr>`;
          }).join('')}
        </table></div>`;
      })()}
    </div>`;
}

function renderLapAging(){
  const t=today();
  const b={current:0,d30:0,d60:0,d90:0,over:0};
  const det=[];
  DB.invoices.forEach(v=>{
    if(v.bayar!=='kredit')return;
    const s=getSisaInvoice(v);if(s<=0)return;
    const due=v.dueDate||v.tanggal;const um=daysBetween(due,t);
    let bk='current';
    if(um>0&&um<=30)bk='d30';else if(um>30&&um<=60)bk='d60';else if(um>60&&um<=90)bk='d90';else if(um>90)bk='over';
    b[bk]+=s;det.push({v,s,um,bk});
  });
  const total=Object.values(b).reduce((s,x)=>s+x,0);
  document.getElementById('lapaging').innerHTML=`
    <h2>Aging Piutang</h2><p class="sub">Analisis umur piutang per ${t}</p>
    <div class="grid">
      <div class="stat"><div class="label">Belum Tempo</div><div class="val" style="color:#16a34a">${fmt(b.current)}</div></div>
      <div class="stat"><div class="label">1–30 Hari</div><div class="val" style="color:#f59e0b">${fmt(b.d30)}</div></div>
      <div class="stat"><div class="label">31–60 Hari</div><div class="val" style="color:#f97316">${fmt(b.d60)}</div></div>
      <div class="stat"><div class="label">61–90 Hari</div><div class="val" style="color:#dc2626">${fmt(b.d90)}</div></div>
      <div class="stat"><div class="label">&gt;90 Hari</div><div class="val" style="color:#7f1d1d">${fmt(b.over)}</div></div>
      <div class="stat"><div class="label">Total</div><div class="val">${fmt(total)}</div></div>
    </div>
    <div class="card" style="margin-top:14px;padding:0">
      <div style="padding:12px 14px;background:var(--soft);font-weight:600">Detail per Invoice</div>
      ${det.length===0?'<div class="empty">Belum ada piutang</div>':`
      <div class="tbl-wrap" style="border:0"><table>
        <tr><th>Invoice</th><th>Pelanggan</th><th>Jatuh Tempo</th><th class="num">Umur</th><th class="num">Sisa</th><th>Kategori</th><th></th></tr>
        ${det.sort((a,x)=>x.um-a.um).map(r=>{
          const c=DB.customers.find(x=>x.id===r.v.customerId);
          const kat=r.bk==='current'?'<span class="badge ok">Belum Tempo</span>':
                    r.bk==='d30'?'<span class="badge warn">1–30</span>':
                    r.bk==='d60'?'<span class="badge warn">31–60</span>':
                    r.bk==='d90'?'<span class="badge bad">61–90</span>':'<span class="badge bad">&gt;90</span>';
          return`<tr><td>${r.v.no}</td><td>${esc(c?c.nama:'Umum')}</td>
            <td>${r.v.dueDate||'-'}</td><td class="num">${r.um>0?r.um:0}</td>
            <td class="num"><b>${fmt(r.s)}</b></td><td>${kat}</td>
            <td style="text-align:right"><button class="sm ok" onclick="openPelunasanInvoice('${r.v.id}')">Lunasi</button></td></tr>`;
        }).join('')}
      </table></div>`}
    </div>`;
}

/* ===== LAPORAN KEUANGAN ===== */
function filterJournals(){
  const f=window._lapFrom||'',t=window._lapTo||'';
  return DB.journals.filter(j=>(!f||j.tanggal>=f)&&(!t||j.tanggal<=t)).sort((a,b)=>a.tanggal.localeCompare(b.tanggal));
}
function filterBar(f,t,ex){
  return`<div class="row" style="margin-bottom:12px">
    <label class="f" style="margin:0"><span>Dari</span><input type="date" id="lapFrom" value="${f||''}"></label>
    <label class="f" style="margin:0"><span>Sampai</span><input type="date" id="lapTo" value="${t||''}"></label>
    <button onclick="applyLapFilter('${ex||''}')">Terapkan</button>
    <button class="ghost" onclick="clearLapFilter('${ex||''}')">Reset</button>
  </div>`;
}
function applyLapFilter(p){window._lapFrom=document.getElementById('lapFrom').value;window._lapTo=document.getElementById('lapTo').value;pages[p]()}
function clearLapFilter(p){window._lapFrom='';window._lapTo='';pages[p]()}
window.applyLapFilter=applyLapFilter;window.clearLapFilter=clearLapFilter;

function renderLapJurnal(){
  const js=filterJournals();
  document.getElementById('lapjurnal').innerHTML=`
    <h2>Laporan Jurnal</h2><p class="sub">Semua entri jurnal.</p>
    ${filterBar(window._lapFrom,window._lapTo,'lapjurnal')}
    <div class="card" style="padding:0">
    ${js.length===0?'<div class="empty">Belum ada jurnal</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th>Akun</th><th class="num">Debit</th><th class="num">Kredit</th><th></th></tr>
      ${js.map(j=>j.lines.map((l,i)=>`<tr>
        ${i===0?`<td rowspan="${j.lines.length}">${j.tanggal}</td><td rowspan="${j.lines.length}">${esc(j.ref)}</td><td rowspan="${j.lines.length}">${esc(j.ket)}</td>`:''}
        <td>${l.kode} — ${esc((acc(l.kode)||{}).nama||'')}</td>
        <td class="num">${l.debit?fmt(l.debit):''}</td><td class="num">${l.kredit?fmt(l.kredit):''}</td>
        ${i===0?`<td rowspan="${j.lines.length}" style="text-align:right"><button class="sm danger" onclick="delJournal('${j.id}')">×</button></td>`:''}
      </tr>`).join('')).join('')}
    </table></div>`}
    </div>`;
}
function delJournal(id){if(!confirm('Hapus jurnal ini?'))return;DB.journals=DB.journals.filter(j=>j.id!==id);save();renderLapJurnal();toast('Terhapus')}
window.delJournal=delJournal;

function renderLapBuku(){
  const sel=window._bukuAkun||(DB.coa[0]&&DB.coa[0].kode);window._bukuAkun=sel;
  const js=filterJournals();const a=acc(sel);
  let sal=0;const nb=normalBalance(sel);const rows=[];
  js.forEach(j=>j.lines.forEach(l=>{if(l.kode===sel){sal+=nb==='D'?((+l.debit||0)-(+l.kredit||0)):((+l.kredit||0)-(+l.debit||0));rows.push({tgl:j.tanggal,ref:j.ref,ket:j.ket,d:l.debit||0,k:l.kredit||0,s:sal})}}));
  document.getElementById('lapbuku').innerHTML=`
    <h2>Buku Besar</h2><p class="sub">Mutasi per akun.</p>
    ${filterBar(window._lapFrom,window._lapTo,'lapbuku')}
    <div class="card"><label class="f"><span>Pilih Akun</span>
      <select onchange="window._bukuAkun=this.value;renderLapBuku()">
        ${DB.coa.map(x=>`<option value="${x.kode}" ${x.kode===sel?'selected':''}>${x.kode} — ${esc(x.nama)}</option>`).join('')}
      </select></label></div>
    ${!a?'':`<div class="card" style="padding:0"><div style="padding:10px 14px;background:var(--soft);font-weight:600">${a.kode} — ${esc(a.nama)} (${a.tipe})</div>
    ${rows.length===0?'<div class="empty">Belum ada mutasi</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th class="num">Debit</th><th class="num">Kredit</th><th class="num">Saldo</th></tr>
      ${rows.map(r=>`<tr><td>${r.tgl}</td><td>${esc(r.ref)}</td><td>${esc(r.ket)}</td>
        <td class="num">${r.d?fmt(r.d):''}</td><td class="num">${r.k?fmt(r.k):''}</td>
        <td class="num"><b>${fmt(r.s)}</b></td></tr>`).join('')}
      <tr class="tot"><td colspan="5">Saldo Akhir</td><td class="num">${fmt(sal)}</td></tr>
    </table></div>`}</div>`}`;
}
window.renderLapBuku=renderLapBuku;

function renderLapSaldo(){
  const js=filterJournals();
  const rows=DB.coa.map(a=>{let d=0,k=0;js.forEach(j=>j.lines.forEach(l=>{if(l.kode===a.kode){d+=+l.debit||0;k+=+l.kredit||0}}));return{a,d,k}}).filter(r=>r.d||r.k);
  const td=rows.reduce((s,r)=>s+r.d,0),tk=rows.reduce((s,r)=>s+r.k,0);
  document.getElementById('lapsaldo').innerHTML=`
    <h2>Neraca Saldo</h2><p class="sub">Ringkasan saldo akun.</p>
    ${filterBar(window._lapFrom,window._lapTo,'lapsaldo')}
    <div class="card" style="padding:0">
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Kode</th><th>Nama Akun</th><th class="num">Debit</th><th class="num">Kredit</th></tr>
      ${rows.map(r=>`<tr><td>${r.a.kode}</td><td>${esc(r.a.nama)}</td>
        <td class="num">${r.d?fmt(r.d):''}</td><td class="num">${r.k?fmt(r.k):''}</td></tr>`).join('')}
      <tr class="tot"><td colspan="2">Total</td><td class="num">${fmt(td)}</td><td class="num">${fmt(tk)}</td></tr>
    </table></div></div>`;
}

function renderLapLR(){
  const js=filterJournals();
  const get=t=>DB.coa.filter(a=>a.tipe===t).map(a=>{let s=0;js.forEach(j=>j.lines.forEach(l=>{if(l.kode===a.kode)s+=(+l.kredit||0)-(+l.debit||0)}));return{a,s}}).filter(r=>r.s);
  const p=get('Pendapatan');const b=get('Beban').map(r=>({a:r.a,s:-r.s}));
  const tp=p.reduce((s,r)=>s+r.s,0);const tb=b.reduce((s,r)=>s+r.s,0);const l=tp-tb;
  document.getElementById('laplr').innerHTML=`
    <h2>Laba Rugi</h2><p class="sub">${esc(DB.company.nama)} — ${window._lapFrom||'awal'} s/d ${window._lapTo||today()}</p>
    ${filterBar(window._lapFrom,window._lapTo,'laplr')}
    <div class="card">
      <h3 class="sec" style="margin-top:0">Pendapatan</h3>
      <table>${p.map(r=>`<tr><td>${r.a.kode} — ${esc(r.a.nama)}</td><td class="num">${fmt(r.s)}</td></tr>`).join('')||'<tr><td colspan="2" class="empty">—</td></tr>'}
      <tr class="tot"><td>Total Pendapatan</td><td class="num">${fmt(tp)}</td></tr></table>
      <h3 class="sec">Beban</h3>
      <table>${b.map(r=>`<tr><td>${r.a.kode} — ${esc(r.a.nama)}</td><td class="num">${fmt(r.s)}</td></tr>`).join('')||'<tr><td colspan="2" class="empty">—</td></tr>'}
      <tr class="tot"><td>Total Beban</td><td class="num">${fmt(tb)}</td></tr></table>
      <h3 class="sec" style="font-size:16px;margin-top:16px;color:${l>=0?'#16a34a':'#dc2626'}">${l>=0?'Laba':'Rugi'} Bersih: ${fmt(l)}</h3>
    </div>`;
}

function renderLapNeraca(){
  const js=filterJournals();
  const get=t=>DB.coa.filter(a=>a.tipe===t).map(a=>{let s=0;js.forEach(j=>j.lines.forEach(l=>{if(l.kode===a.kode)s+=normalBalance(a.kode)==='D'?((+l.debit||0)-(+l.kredit||0)):((+l.kredit||0)-(+l.debit||0))}));return{a,s}});
  const a=get('Aset').filter(r=>r.s);const l=get('Liabilitas').filter(r=>r.s);const e=get('Ekuitas').filter(r=>r.s);
  let laba=0;DB.coa.forEach(a=>{let s=0;js.forEach(j=>j.lines.forEach(x=>{if(x.kode===a.kode){if(a.tipe==='Pendapatan')s+=(+x.kredit||0)-(+x.debit||0);if(a.tipe==='Beban')s+=(+x.debit||0)-(+x.kredit||0)}}));laba+=s*(a.tipe==='Pendapatan'?1:-1)});
  const tA=a.reduce((s,r)=>s+r.s,0),tL=l.reduce((s,r)=>s+r.s,0),tE=e.reduce((s,r)=>s+r.s,0);
  const sel=tA-(tL+tE+laba);
  document.getElementById('lapneraca').innerHTML=`
    <h2>Neraca</h2><p class="sub">Posisi per ${window._lapTo||today()}</p>
    ${filterBar(window._lapFrom,window._lapTo,'lapneraca')}
    <div class="split">
      <div class="card"><h3 class="sec" style="margin-top:0">Aset</h3>
        <table>${a.map(r=>`<tr><td>${esc(r.a.nama)}</td><td class="num">${fmt(r.s)}</td></tr>`).join('')||'<tr><td colspan="2" class="empty">—</td></tr>'}
        <tr class="tot"><td>Total Aset</td><td class="num">${fmt(tA)}</td></tr></table></div>
      <div class="card"><h3 class="sec" style="margin-top:0">Liabilitas</h3>
        <table>${l.map(r=>`<tr><td>${esc(r.a.nama)}</td><td class="num">${fmt(r.s)}</td></tr>`).join('')||'<tr><td colspan="2" class="empty">—</td></tr>'}
        <tr class="tot"><td>Total Liabilitas</td><td class="num">${fmt(tL)}</td></tr></table>
        <h3 class="sec">Ekuitas</h3>
        <table>${e.map(r=>`<tr><td>${esc(r.a.nama)}</td><td class="num">${fmt(r.s)}</td></tr>`).join('')}
          <tr><td>Laba Berjalan</td><td class="num">${fmt(laba)}</td></tr>
          <tr class="tot"><td>Total Ekuitas</td><td class="num">${fmt(tE+laba)}</td></tr></table>
        <h3 class="sec" style="font-size:15px;margin-top:14px">Total L+E: ${fmt(tL+tE+laba)}</h3></div>
    </div>
    <div class="card" style="background:${sel===0?'#dcfce7':'#fee2e2'};border:0"><b>${sel===0?'✅ Balance':'⚠️ Selisih: '+fmt(sel)}</b></div>`;
}

function renderLapKas(){
  const js=filterJournals();
  const kk=['1001','1002'];let masuk=0,keluar=0;const det=[];
  js.forEach(j=>j.lines.forEach(l=>{if(kk.includes(l.kode)){const d=+l.debit||0,k=+l.kredit||0;masuk+=d;keluar+=k;det.push({tgl:j.tanggal,ref:j.ref,ket:j.ket,akun:l.kode,d,k})}}));
  const awal=window._lapFrom?(saldo('1001','0000-01-01',window._lapFrom)+saldo('1002','0000-01-01',window._lapFrom)):0;
  document.getElementById('lapkas').innerHTML=`
    <h2>Arus Kas</h2><p class="sub">Mutasi kas & bank.</p>
    ${filterBar(window._lapFrom,window._lapTo,'lapkas')}
    <div class="grid">
      <div class="stat"><div class="label">Saldo Awal</div><div class="val">${fmt(awal)}</div></div>
      <div class="stat"><div class="label">Masuk</div><div class="val" style="color:#16a34a">${fmt(masuk)}</div></div>
      <div class="stat"><div class="label">Keluar</div><div class="val" style="color:#dc2626">${fmt(keluar)}</div></div>
      <div class="stat"><div class="label">Akhir</div><div class="val">${fmt(awal+masuk-keluar)}</div></div>
    </div>
    <div class="card" style="padding:0;margin-top:12px">
    ${det.length===0?'<div class="empty">Tidak ada mutasi</div>':`
    <div class="tbl-wrap" style="border:0"><table>
      <tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th>Akun</th><th class="num">Masuk</th><th class="num">Keluar</th></tr>
      ${det.map(r=>`<tr><td>${r.tgl}</td><td>${esc(r.ref)}</td><td>${esc(r.ket)}</td>
        <td>${r.akun} — ${esc((acc(r.akun)||{}).nama)}</td>
        <td class="num">${r.d?fmt(r.d):''}</td><td class="num">${r.k?fmt(r.k):''}</td></tr>`).join('')}
      <tr class="tot"><td colspan="4">Total</td><td class="num">${fmt(masuk)}</td><td class="num">${fmt(keluar)}</td></tr>
    </table></div>`}</div>`;
}

function renderLapPPN(){
  const js=filterJournals();
  let keluaran=0,masukan=0;
  js.forEach(j=>j.lines.forEach(l=>{
    if(l.kode==='2101')keluaran+=(+l.kredit||0)-(+l.debit||0);
    if(l.kode==='1202')masukan+=(+l.debit||0)-(+l.kredit||0);
  }));
  const neto=keluaran-masukan;
  document.getElementById('lapppn').innerHTML=`
    <h2>Rekap PPN</h2><p class="sub">Rekapitulasi PPN Keluaran & Masukan.</p>
    ${filterBar(window._lapFrom,window._lapTo,'lapppn')}
    <div class="grid">
      <div class="stat"><div class="label">PPN Keluaran (Dijual)</div><div class="val">${fmt(keluaran)}</div></div>
      <div class="stat"><div class="label">PPN Masukan (Dibeli)</div><div class="val">${fmt(masukan)}</div></div>
      <div class="stat"><div class="label">PPN Kurang/Lebih Bayar</div><div class="val" style="color:${neto>=0?'#dc2626':'#16a34a'}">${fmt(neto)}</div></div>
    </div>
    <div class="card" style="margin-top:14px">
      <h3 class="sec" style="margin-top:0">Rincian Transaksi PPN</h3>
      <div class="tbl-wrap"><table>
        <tr><th>Tanggal</th><th>Ref</th><th>Keterangan</th><th class="num">PPN Keluaran</th><th class="num">PPN Masukan</th></tr>
        ${js.filter(j=>j.lines.some(l=>l.kode==='2101'||l.kode==='1202')).map(j=>{
          let pk=0,pm=0;
          j.lines.forEach(l=>{if(l.kode==='2101')pk+=(+l.kredit||0)-(+l.debit||0);if(l.kode==='1202')pm+=(+l.debit||0)-(+l.kredit||0)});
          return`<tr><td>${j.tanggal}</td><td>${esc(j.ref)}</td><td>${esc(j.ket)}</td>
            <td class="num">${pk?fmt(pk):''}</td><td class="num">${pm?fmt(pm):''}</td></tr>`;
        }).join('')||'<tr><td colspan="5" class="empty">Belum ada transaksi PPN</td></tr>'}
      </table></div>
    </div>`;
}

/* ===== CLOSING PERIODE ===== */
function renderClosing(){
  const months=new Set();
  DB.journals.forEach(j=>months.add(monthOf(j.tanggal)));
  const sorted=[...months].sort().reverse();
  const curMonth=monthOf(today());
  if(!months.has(curMonth))sorted.unshift(curMonth);
  document.getElementById('closing').innerHTML=`
    <h2>Closing Periode</h2><p class="sub">Kunci bulan agar transaksi di dalamnya tidak bisa diubah/dihapus.</p>
    <div class="card">
      <p style="font-size:13px;color:#64748b;margin-bottom:12px">⚠️ Closing bersifat sementara dan bisa dibuka kembali. Saat periode dikunci, input transaksi baru & hapus jurnal di bulan tersebut akan diblokir.</p>
      <div class="row">
        <button class="danger" onclick="lockMonth('${curMonth}')">🔒 Kunci Bulan Ini (${curMonth})</button>
      </div>
    </div>
    <div class="card" style="padding:0">
      <div style="padding:12px 14px;background:var(--soft);font-weight:600">Daftar Periode</div>
      ${sorted.length===0?'<div class="empty">Belum ada data</div>':`
      <div class="tbl-wrap" style="border:0"><table>
        <tr><th>Periode</th><th>Status</th><th class="num">Jumlah Jurnal</th><th class="num">Total Debit</th><th></th></tr>
        ${sorted.map(m=>{
          const locked=DB.closedPeriods.includes(m);
          const jm=DB.journals.filter(j=>monthOf(j.tanggal)===m);
          const tot=jm.reduce((s,j)=>s+j.lines.reduce((a,l)=>a+(+l.debit||0),0),0);
          return`<tr>
            <td><b>${m}</b></td>
            <td>${locked?'<span class="badge bad">Terkunci</span>':'<span class="badge ok">Terbuka</span>'}</td>
            <td class="num">${jm.length}</td>
            <td class="num">${fmt(tot)}</td>
            <td style="text-align:right">${locked?
              `<button class="sm ok" onclick="unlockMonth('${m}')">🔓 Buka</button>`:
              `<button class="sm danger" onclick="lockMonth('${m}')">🔒 Kunci</button>`}</td></tr>`;
        }).join('')}
      </table></div>`}
    </div>`;
}
function lockMonth(m){
  if(DB.closedPeriods.includes(m))return;
  if(!confirm('Kunci periode '+m+'? Transaksi baru di bulan ini akan diblokir.'))return;
  DB.closedPeriods.push(m);
  save();renderClosing();toast('Periode '+m+' dikunci');
}
function unlockMonth(m){
  if(!confirm('Buka kunci periode '+m+'?'))return;
  DB.closedPeriods=DB.closedPeriods.filter(x=>x!==m);
  save();renderClosing();toast('Periode dibuka');
}
window.lockMonth=lockMonth;window.unlockMonth=unlockMonth;

