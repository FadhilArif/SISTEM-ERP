/* ERP shared utilities */
const uid=()=>Math.random().toString(36).slice(2,10);
const fmt=n=>'Rp '+(Number(n)||0).toLocaleString('id-ID');
const today=()=>new Date().toISOString().slice(0,10);
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x.toISOString().slice(0,10)};
const daysBetween=(a,b)=>Math.floor((new Date(b)-new Date(a))/86400000);
const monthOf=t=>t.slice(0,7);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function num(v){
  if(typeof v==='number')return v;
  if(v===null||v===undefined)return 0;
  return parseInt(String(v).replace(/[^\\d-]/g,''),10)||0;
}
function money(v){const n=num(v);return n?n.toLocaleString('id-ID'):''}
function toast(m,t='ok'){
  const d=document.createElement('div');d.textContent=m;
  d.style.cssText=`position:fixed;bottom:20px;right:20px;background:${t==='ok'?'#16a34a':'#dc2626'};color:#fff;padding:10px 16px;border-radius:8px;z-index:999;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.2);max-width:calc(100% - 40px)`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),2600)
}

document.addEventListener('input',e=>{
  const t=e.target;if(!t?.classList?.contains('money'))return;
  const raw=t.value.replace(/\\D/g,'');t.value=raw===''?'':parseInt(raw,10).toLocaleString('id-ID');
});
