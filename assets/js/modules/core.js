const SUPABASE_URL='https://acmmenknbtjfyhanjzpy.supabase.co';
const SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjbW1lbmtuYnRqZnloYW5qenB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1Mzc4MTEsImV4cCI6MjEwNTExMzgxMX0.fYLp9QX8W3h8uiaVtf125kYhgaip21hGYtUa2n-Aj18';
const DEMO_EMAIL = 'recruiter@erp.local';
const DEMO_PASS  = 'demo123456';
const LS='erpPractice_v1';
const uid=()=>Math.random().toString(36).slice(2,10);
const fmt=n=>'Rp '+(Number(n)||0).toLocaleString('id-ID');
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.floor((new Date(b)-new Date(a))/86400000);
const monthOf=t=>t.slice(0,7);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ===== FORMAT UANG ===== */
function num(v){
  if(typeof v === 'number') return v;
  if(v === null || v === undefined) return 0;
  const s = String(v).replace(/[^\d-]/g,'');
  return parseInt(s,10) || 0;
}
function money(v){
  const n = num(v);
  return n ? n.toLocaleString('id-ID') : '';
}
// Listener global: format setiap input dengan class="money" saat diketik
document.addEventListener('input', e => {
  const t = e.target;
  if(!t || !t.classList || !t.classList.contains('money')) return;
  const raw = t.value.replace(/\D/g,'');
  t.value = raw === '' ? '' : parseInt(raw,10).toLocaleString('id-ID');
});
function toast(m,t='ok'){const d=document.createElement('div');d.textContent=m;d.style.cssText=`position:fixed;bottom:20px;right:20px;background:${t==='ok'?'#16a34a':'#dc2626'};color:#fff;padding:10px 16px;border-radius:8px;z-index:999;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.2);max-width:calc(100% - 40px)`;document.body.appendChild(d);setTimeout(()=>d.remove(),2600)}

const COA_DEFAULT=[
  {kode:'1001',nama:'Kas',tipe:'Aset'},
  {kode:'1002',nama:'Bank',tipe:'Aset'},
  {kode:'1101',nama:'Piutang Usaha',tipe:'Aset'},
  {kode:'1201',nama:'Persediaan Barang Dagang',tipe:'Aset'},
  {kode:'1202',nama:'PPN Masukan',tipe:'Aset'},
  {kode:'1301',nama:'Peralatan',tipe:'Aset'},
  {kode:'1302',nama:'Akumulasi Penyusutan Peralatan',tipe:'Aset'},
  {kode:'2001',nama:'Utang Usaha',tipe:'Liabilitas'},
  {kode:'2002',nama:'Utang Bank',tipe:'Liabilitas'},
  {kode:'2101',nama:'PPN Keluaran',tipe:'Liabilitas'},
  {kode:'3001',nama:'Modal Pemilik',tipe:'Ekuitas'},
  {kode:'3002',nama:'Prive',tipe:'Ekuitas'},
  {kode:'4001',nama:'Pendapatan Penjualan',tipe:'Pendapatan'},
  {kode:'4002',nama:'Pendapatan Jasa',tipe:'Pendapatan'},
  {kode:'5001',nama:'Harga Pokok Penjualan',tipe:'Beban'},
  {kode:'6001',nama:'Beban Gaji',tipe:'Beban'},
  {kode:'6002',nama:'Beban Listrik & Air',tipe:'Beban'},
  {kode:'6003',nama:'Beban ATK',tipe:'Beban'},
  {kode:'6004',nama:'Beban Sewa',tipe:'Beban'},
  {kode:'6005',nama:'Beban Penyusutan',tipe:'Beban'},
  {kode:'6901',nama:'Selisih Persediaan',tipe:'Beban'},
];

let DB,sb=null,currentUser=null,pushTimer=null,isPulling=false,lastPushTime=0,realtimeChannel=null;
const PPN_RATE=0.11;

function freshDB(){
  return {
    company:{nama:'Klinik & Toko Alat Kesehatan Sragen Jaya',alamat:'Jl. Raya Sragen No. 1',telp:'0271-123456',npwp:'01.234.567.8-901.000'},
    coa:JSON.parse(JSON.stringify(COA_DEFAULT)),
    customers:[],vendors:[],items:[],
    warehouses:[{id:'utama',nama:'Gudang Utama',alamat:''}],
    assets:[],
    closedPeriods:[],
    journals:[],invoices:[],purchases:[],payments:[],
    counters:{inv:0,pur:0,jv:0}
  };
}

function migrateDB(){
  DB.invoices=DB.invoices||[];DB.purchases=DB.purchases||[];DB.payments=DB.payments||[];
  DB.warehouses=DB.warehouses||[{id:'utama',nama:'Gudang Utama',alamat:''}];
  DB.assets=DB.assets||[];
  DB.closedPeriods=DB.closedPeriods||[];
  // Pastikan PPN accounts ada
  ['2101','1202'].forEach(kode=>{
    if(!DB.coa.find(a=>a.kode===kode)){
      const def=COA_DEFAULT.find(a=>a.kode===kode);
      if(def) DB.coa.push({...def});
    }
  });
  // Migrasi stok per gudang
  DB.items.forEach(it=>{
    if(!it.stokPerGudang){
      it.stokPerGudang={ utama: it.stok||0 };
    }
    it.stok=Object.values(it.stokPerGudang).reduce((a,b)=>a+(+b||0),0);
  });
  DB.invoices.forEach(v=>{
    if(v.paidAmount===undefined){
      v.paidAmount=v.bayar==='kredit'?0:v.total;
      v.status=v.bayar==='kredit'?'belum':'lunas';
      v.dueDate=v.dueDate||addDays(v.tanggal,30);
    }
    if(v.subtotal===undefined){ v.subtotal=v.total; v.tax=0; v.ppn=false; }
  });
  DB.purchases.forEach(v=>{
    if(v.paidAmount===undefined){
      v.paidAmount=v.bayar==='kredit'?0:v.total;
      v.status=v.bayar==='kredit'?'belum':'lunas';
      v.dueDate=v.dueDate||addDays(v.tanggal,30);
    }
    if(v.subtotal===undefined){ v.subtotal=v.total; v.tax=0; v.ppn=false; }
  });
}

function loadDB(){
  try{DB=JSON.parse(localStorage.getItem(LS))||null}catch(e){DB=null}
  if(!DB||!DB.coa) DB=freshDB();
  migrateDB();
}
function save(){
  localStorage.setItem(LS,JSON.stringify(DB));
  if(currentUser&&!isPulling) schedulePush();
}

function showApp(){document.getElementById('landing').style.display='none';document.querySelector('.app').classList.add('on');renderAuthUI()}
function showLanding(){document.querySelector('.app').classList.remove('on');const l=document.getElementById('landing');l.style.display='flex';document.getElementById('landingLoading').classList.remove('on');document.getElementById('landingLogin').classList.add('on');document.getElementById('landingError').classList.remove('on')}
function showLandingError(m){const e=document.getElementById('landingError');e.textContent=m;e.classList.add('on')}

function isSupabaseConfigured(){return SUPABASE_URL&&SUPABASE_KEY&&!SUPABASE_URL.includes('xxxx')}
function renderAuthUI(){
  const box=document.getElementById('authBox');if(!box)return;
  if(currentUser){box.style.display='block';document.getElementById('authEmailShow').textContent='👤 '+currentUser.email}
  else if(!isSupabaseConfigured()){box.style.display='block';document.getElementById('authEmailShow').textContent='🔌 Mode lokal';const b=box.querySelector('button');if(b)b.style.display='none'}
  else box.style.display='none';
}
function setSync(m,k){const e=document.getElementById('syncStatus');if(!e)return;e.textContent=m;e.className='sync'+(k?' '+k:'')}
function schedulePush(){clearTimeout(pushTimer);pushTimer=setTimeout(pushToCloud,1200)}
async function pushToCloud(){
  if(!sb||!currentUser)return;
  setSync('⏳ Menyimpan…','warn');
  const {error}=await sb.from('erp_data').upsert({user_id:currentUser.id,data:DB,updated_at:new Date().toISOString()});
  if(error){setSync('⚠️ Gagal: '+error.message,'bad');console.error(error)}
  else{lastPushTime=Date.now();setSync('✅ Tersinkron '+new Date().toLocaleTimeString('id-ID'),'ok')}
}
async function pullFromCloud(){
  if(!sb||!currentUser)return;
  isPulling=true;setSync('⏳ Memuat dari cloud…','warn');
  const {data,error}=await sb.from('erp_data').select('data').eq('user_id',currentUser.id).maybeSingle();
  isPulling=false;
  if(error){setSync('⚠️ '+error.message,'bad');return}
  if(data&&data.data&&data.data.coa){
    DB=data.data;migrateDB();localStorage.setItem(LS,JSON.stringify(DB));
    setSync('✅ Dimuat dari cloud','ok');
    const a=document.querySelector('.nav a.active');if(a&&pages[a.dataset.target])pages[a.dataset.target]();
  }else await pushToCloud();
}
function subscribeRealtime(){
  if(!sb||!currentUser||realtimeChannel)return;
  realtimeChannel=sb.channel('erp_sync_'+currentUser.id)
    .on('postgres_changes',{event:'*',schema:'public',table:'erp_data',filter:`user_id=eq.${currentUser.id}`},p=>{
      if(!p.new||!p.new.data)return;
      if(Date.now()-lastPushTime<3000)return;
      isPulling=true;DB=p.new.data;migrateDB();localStorage.setItem(LS,JSON.stringify(DB));isPulling=false;
      const a=document.querySelector('.nav a.active');if(a&&pages[a.dataset.target])pages[a.dataset.target]();
      setSync('🔄 Diperbarui dari device lain '+new Date().toLocaleTimeString('id-ID'),'live');
    })
    .subscribe(s=>{
      if(s==='SUBSCRIBED')setSync('🟢 Live sync aktif','live');
      else if(s==='CHANNEL_ERROR'||s==='TIMED_OUT')setSync('⚠️ Realtime terputus','bad');
    });
}
function unsubscribeRealtime(){if(realtimeChannel&&sb){sb.removeChannel(realtimeChannel);realtimeChannel=null}}

async function initSupabase(){
  if(!window.supabase||!isSupabaseConfigured()){renderAuthUI();showApp();return}
  sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'erp-auth'}});
  let session=null;
  try{const r=await sb.auth.getSession();session=r.data.session}catch(e){console.error(e)}
  currentUser=session?session.user:null;
  if(currentUser){await pullFromCloud();showApp();subscribeRealtime()}
  else{document.getElementById('landingLoading').classList.remove('on');document.getElementById('landingLogin').classList.add('on');renderAuthUI()}
  sb.auth.onAuthStateChange((ev,s)=>{
    currentUser=s?s.user:null;renderAuthUI();
    if(ev==='SIGNED_IN'&&currentUser){setTimeout(async()=>{await pullFromCloud();showApp();subscribeRealtime();toast('Login berhasil')},0)}
    if(ev==='SIGNED_OUT'){unsubscribeRealtime();showLanding()}
  });
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&currentUser&&sb)pullFromCloud()});
  window.addEventListener('storage',e=>{
    if(e.key===LS&&e.newValue&&!isPulling){try{DB=JSON.parse(e.newValue);migrateDB();const a=document.querySelector('.nav a.active');if(a&&pages[a.dataset.target])pages[a.dataset.target]()}catch(x){}}
  });
  window.addEventListener('online',()=>{if(currentUser)pullFromCloud()});
}

function togglePw(){const i=document.getElementById('authPass');const b=i.parentElement.querySelector('.pw-toggle-landing');if(i.type==='password'){i.type='text';b.textContent='🙈'}else{i.type='password';b.textContent='👁️'}}
window.togglePw=togglePw;

async function doSignup(){
  if(!sb)return toast('Supabase belum dikonfigurasi','bad');
  const e=authEmail.value.trim().toLowerCase(),p=authPass.value;
  if(!e||p.length<6)return showLandingError('Email valid & password minimal 6 karakter.');
  document.getElementById('landingError').classList.remove('on');
  const {error}=await sb.auth.signUp({email:e,password:p});
  if(error)return showLandingError('Gagal daftar: '+error.message);
  toast('Pendaftaran berhasil.');
}
async function doLogin(){
  if(!sb)return toast('Supabase belum dikonfigurasi','bad');
  const e=authEmail.value.trim().toLowerCase(),p=authPass.value;
  if(!e||!p)return showLandingError('Isi email & password.');
  document.getElementById('landingError').classList.remove('on');
  const {error}=await sb.auth.signInWithPassword({email:e,password:p});
  if(error){
    if(/invalid/i.test(error.message))return showLandingError('Email atau password salah.');
    return showLandingError('Error: '+error.message);
  }
}
  async function doDemoLogin(){
  if(!sb) return toast('Supabase belum dikonfigurasi','bad');
  const btn = event?.target;
  if(btn){ btn.disabled = true; btn.textContent = '⏳ Memuat…'; }
  const { error } = await sb.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASS });
  if(btn){ btn.disabled = false; btn.textContent = '🚀 Coba Demo (Rekruter)'; }
  if(error){
    if(/invalid/i.test(error.message)){
      return showLandingError('Akun demo belum disiapkan. Buat user "'+DEMO_EMAIL+'" di Supabase → Authentication → Users.');
    }
    return showLandingError('Error: ' + error.message);
  }
  toast('Masuk sebagai mode demo');
}
window.doDemoLogin = doDemoLogin;
async function doLogout(){if(!sb)return;unsubscribeRealtime();await sb.auth.signOut();currentUser=null;renderAuthUI();setSync('');toast('Logout')}
window.doLogin=doLogin;window.doSignup=doSignup;window.doLogout=doLogout;

function acc(k){return DB.coa.find(a=>a.kode===k)}
function normalBalance(k){const a=acc(k);return(!a||a.tipe==='Aset'||a.tipe==='Beban')?'D':'K'}
function saldo(k,from,to){
  let d=0,kk=0;
  DB.journals.forEach(j=>{
    if(from&&j.tanggal<from)return;
    if(to&&j.tanggal>to)return;
    j.lines.forEach(l=>{if(l.kode===k){d+=+l.debit||0;kk+=+l.kredit||0}});
  });
  return normalBalance(k)==='D'?d-kk:kk-d;
}
function isLocked(tanggal){return DB.closedPeriods.includes(monthOf(tanggal))}
function postJournal({tanggal,ref,ket,lines,source}){
  if(isLocked(tanggal)){toast('Periode '+monthOf(tanggal)+' sudah dikunci','bad');return null}
  const j={id:uid(),tanggal,ref,ket,lines:lines.filter(l=>l.kode&&((+l.debit||0)||(+l.kredit||0))),source:source||'manual'};
  DB.journals.push(j);save();return j;
}
function getStok(itemId,whId){
  const it=DB.items.find(x=>x.id===itemId);
  if(!it) return 0;
  if(!it.stokPerGudang){
    // fallback: stok lama belum termigrasi
    return whId==='utama' ? (it.stok||0) : 0;
  }
  const v = it.stokPerGudang[whId];
  return typeof v === 'number' ? v : (parseInt(v,10)||0);
}
function addStok(itemId,whId,qty){
  const it=DB.items.find(x=>x.id===itemId);if(!it)return;
  it.stokPerGudang=it.stokPerGudang||{};
  it.stokPerGudang[whId]=(it.stokPerGudang[whId]||0)+qty;
  it.stok=Object.values(it.stokPerGudang).reduce((a,b)=>a+(+b||0),0);
}
function totalStok(it){return Object.values(it.stokPerGudang||{}).reduce((a,b)=>a+(+b||0),0)}

function getStatusLabel(s){if(s==='lunas')return'<span class="badge ok">Lunas</span>';if(s==='sebagian')return'<span class="badge warn">Sebagian</span>';return'<span class="badge bad">Belum Bayar</span>'}
function getSisaInvoice(v){return(v.total||0)-(v.paidAmount||0)}
function totalPiutangOutstanding(){return(DB.invoices||[]).reduce((s,v)=>v.bayar!=='kredit'?s:s+getSisaInvoice(v),0)}
function totalUtangOutstanding(){return(DB.purchases||[]).reduce((s,v)=>v.bayar!=='kredit'?s:s+getSisaInvoice(v),0)}
function totalPiutangLewatTempo(){const t=today();return(DB.invoices||[]).reduce((s,v)=>{if(v.bayar!=='kredit'||getSisaInvoice(v)<=0)return s;if(!v.dueDate||v.dueDate>=t)return s;return s+getSisaInvoice(v)},0)}
function piutangPerCustomer(id){return(DB.invoices||[]).reduce((s,v)=>v.customerId!==id?s:(v.bayar!=='kredit'?s:s+getSisaInvoice(v)),0)}
function utangPerVendor(id){return(DB.purchases||[]).reduce((s,v)=>v.vendorId!==id?s:(v.bayar!=='kredit'?s:s+getSisaInvoice(v)),0)}

const pages={
  dashboard:renderDashboard,perusahaan:renderPerusahaan,coa:renderCOA,
  customer:renderCustomer,vendor:renderVendor,barang:renderBarang,
  gudang:renderGudang,aset:renderAset,
  penjualan:renderPenjualan,pembelian:renderPembelian,
  penerimaan:renderPenerimaan,pengeluaran:renderPengeluaran,jurnalumum:renderJurnalUmum,
  kartustok:renderKartuStok,opname:renderOpname,transfer:renderTransfer,
  lappiutang:renderLapPiutang,laputang:renderLapUtang,lapaging:renderLapAging,
  lapjurnal:renderLapJurnal,lapbuku:renderLapBuku,lapsaldo:renderLapSaldo,
  laplr:renderLapLR,lapneraca:renderLapNeraca,lapkas:renderLapKas,lapppn:renderLapPPN,
  closing:renderClosing,roadmap:renderRoadmap,kuis:renderKuis
};
document.querySelectorAll('.nav a').forEach(a=>{
  a.onclick=()=>{
    document.querySelectorAll('.nav a').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    const t=a.dataset.target;
    document.getElementById(t).classList.add('active');
    pages[t]&&pages[t]();
  };
});
