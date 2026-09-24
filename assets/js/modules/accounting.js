/* =========================================================
   ERP ACCOUNTING & INVENTORY ENGINE
   Business rules for journals, balances, stock and AR/AP.
   Intentionally independent from Supabase.
   ========================================================= */

function acc(k){return DB.coa.find(a=>a.kode===k)}

function normalBalance(k){
  const a=acc(k);
  return(!a||a.tipe==='Aset'||a.tipe==='Beban')?'D':'K';
}

function saldo(k,from,to){
  let d=0,kk=0;
  DB.journals.forEach(j=>{
    if(from&&j.tanggal<from)return;
    if(to&&j.tanggal>to)return;
    j.lines.forEach(l=>{
      if(l.kode===k){
        d+=+l.debit||0;
        kk+=+l.kredit||0;
      }
    });
  });
  return normalBalance(k)==='D'?d-kk:kk-d;
}

function isLocked(tanggal){
  return DB.closedPeriods.includes(monthOf(tanggal));
}

function postJournal({tanggal,ref,ket,lines,source}){
  if(isLocked(tanggal)){
    toast('Periode '+monthOf(tanggal)+' sudah dikunci','bad');
    return null;
  }

  const cleanLines=lines.filter(
    l=>l.kode&&((+l.debit||0)||(+l.kredit||0))
  );

  const j={
    id:uid(),
    tanggal,
    ref,
    ket,
    lines:cleanLines,
    source:source||'manual'
  };

  DB.journals.push(j);
  save();
  return j;
}

/* =========================
   INVENTORY
   ========================= */

function getStok(itemId,whId){
  const it=DB.items.find(x=>x.id===itemId);
  if(!it)return 0;

  if(!it.stokPerGudang){
    return whId==='utama'?(it.stok||0):0;
  }

  const v=it.stokPerGudang[whId];
  return typeof v==='number'?v:(parseInt(v,10)||0);
}

function addStok(itemId,whId,qty){
  const it=DB.items.find(x=>x.id===itemId);
  if(!it)return;

  it.stokPerGudang=it.stokPerGudang||{};
  it.stokPerGudang[whId]=(it.stokPerGudang[whId]||0)+qty;
  it.stok=Object.values(it.stokPerGudang)
    .reduce((a,b)=>a+(+b||0),0);
}

function totalStok(it){
  return Object.values(it.stokPerGudang||{})
    .reduce((a,b)=>a+(+b||0),0);
}

/* =========================
   AR / AP
   ========================= */

function getStatusLabel(s){
  if(s==='lunas')return'<span class="badge ok">Lunas</span>';
  if(s==='sebagian')return'<span class="badge warn">Sebagian</span>';
  return'<span class="badge bad">Belum Bayar</span>';
}

function getSisaInvoice(v){
  return(v.total||0)-(v.paidAmount||0);
}

function totalPiutangOutstanding(){
  return(DB.invoices||[])
    .reduce((s,v)=>v.bayar!=='kredit'?s:s+getSisaInvoice(v),0);
}

function totalUtangOutstanding(){
  return(DB.purchases||[])
    .reduce((s,v)=>v.bayar!=='kredit'?s:s+getSisaInvoice(v),0);
}

function totalPiutangLewatTempo(){
  const t=today();
  return(DB.invoices||[]).reduce((s,v)=>{
    if(v.bayar!=='kredit'||getSisaInvoice(v)<=0)return s;
    if(!v.dueDate||v.dueDate>=t)return s;
    return s+getSisaInvoice(v);
  },0);
}

function piutangPerCustomer(id){
  return(DB.invoices||[]).reduce((s,v)=>
    v.customerId!==id?s:
    (v.bayar!=='kredit'?s:s+getSisaInvoice(v)),0);
}

function utangPerVendor(id){
  return(DB.purchases||[]).reduce((s,v)=>
    v.vendorId!==id?s:
    (v.bayar!=='kredit'?s:s+getSisaInvoice(v)),0);
}
