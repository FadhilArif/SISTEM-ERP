/* =========================================================
   SEED DATA DEMO
========================================================= */
function seedDemoData(){
  if(!confirm('Isi data demo lengkap? Semua data saat ini AKAN DIGANTI.')) return;
  if(!confirm('Yakin? Pastikan ini akun demo, bukan akun pribadimu.')) return;

  // Random generator (deterministic — hasil selalu sama)
  let _seed = 20260101;
  const rnd = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
  const rint = (a,b) => a + Math.floor(rnd()*(b-a+1));
  const pick = arr => arr[Math.floor(rnd()*arr.length)];

  const NEW = freshDB();
  const whU = 'wh-utama', whC = 'wh-cabang';
  NEW.warehouses = [
    {id:whU, nama:'Gudang Utama', alamat:'Jl. Raya Sragen No. 1'},
    {id:whC, nama:'Gudang Cabang Solo', alamat:'Jl. Slamet Riyadi No. 45'}
  ];

  // ===== CUSTOMERS =====
  const custData = [
    ['RS Dr. Moewardi','0271-123456','Jl. Kol. Sutarto 132, Solo'],
    ['Klinik Sehat Sragen','0271-234567','Jl. Raya Sragen KM 5'],
    ['Apotek Kimia Farma','0271-345678','Jl. Slamet Riyadi 88'],
    ['PT Medika Jaya','021-5551234','Jl. Sudirman 45, Jakarta'],
    ['RS Islam YARSI','0271-456789','Jl. Kapten Mulyadi 10'],
    ['Klinik Bunda Sejahtera','0271-567890','Jl. Urip Sumoharjo 22'],
    ['Apotek K-24 Solo','0271-678901','Jl. Adi Sucipto 55'],
    ['PT Alkes Nusantara','021-7778899','Jl. Thamrin 99, Jakarta'],
    ['RS PKU Muhammadiyah','0271-789012','Jl. Slamet Riyadi 100'],
    ['Puskesmas Karangmalang','0271-890123','Jl. Karangmalang 5']
  ];
  NEW.customers = custData.map(([nama,telp,alamat])=>({id:uid(),nama,telp,alamat}));

  // ===== VENDORS =====
  const vendData = [
    ['PT Alkes Indonesia','021-888111','Jl. Gajah Mada 12, Jakarta'],
    ['CV Medika Supply','0271-111222','Jl. Raya Solo KM 3'],
    ['PT Kimia Farma Trading','021-333444','Jl. Veteran 9, Jakarta'],
    ['CV Sumber Sehat','0271-555666','Jl. MT Haryono 44'],
    ['PT Pharma Global','021-777888','Jl. Rasuna Said 5, Jakarta'],
    ['CV Alat Medis Nusantara','031-999888','Jl. Darmo 11, Surabaya'],
    ['PT Kertas Sinar Dunia','021-123321','Jl. Industri 88, Tangerang'],
    ['CV Sabun & Chemical','0271-222333','Jl. Slamet Riyadi 200'],
    ['PT Elektronik Medis','021-444555','Jl. Gatot Subroto 33, Jakarta'],
    ['CV Sarung Tangan Medis','0274-666777','Jl. Malioboro 15, Yogyakarta']
  ];
  NEW.vendors = vendData.map(([nama,telp,alamat])=>({id:uid(),nama,telp,alamat}));

  // ===== ITEMS =====
  const itemData = [
    ['ATK001','Kertas HVS A4','rim',45000,55000,30,10],
    ['ATK002','Tinta Printer HP 802','pcs',280000,350000,8,2],
    ['OBT001','Paracetamol 500mg','strip',18000,25000,80,30],
    ['OBT002','Amoxicillin 500mg','strip',35000,45000,50,20],
    ['MDK001','Masker Medis 3ply','box',28000,35000,100,40],
    ['MDK002','Sarung Tangan Latex','box',55000,65000,60,20],
    ['MDK003','Alat Cek Gula Darah','unit',380000,450000,5,2],
    ['MDK004','Tensimeter Digital','unit',720000,850000,4,1],
    ['MDK005','Termometer Infrared','unit',480000,550000,6,2],
    ['MDK006','Stetoskop','unit',620000,750000,5,2],
    ['OBT003','Hand Sanitizer 500ml','botol',35000,45000,40,15],
    ['MDK007','Kapas 100gr','bungkus',12000,15000,80,30],
    ['MDK008','Plester Hansaplast','box',9500,12000,60,20],
    ['OBT004','Alkohol 70% 1L','botol',22000,28000,30,10],
    ['OBT005','Betadine 60ml','botol',18000,22000,50,15]
  ];
  NEW.items = itemData.map(([kode,nama,satuan,beli,jual,sU,sC])=>({
    id:uid(), kode, nama, satuan,
    hargaBeli:beli, hargaJual:jual,
    stokPerGudang:{[whU]:sU,[whC]:sC},
    stok:sU+sC
  }));

  // ===== ASET TETAP =====
  const now = new Date();
  const mkTgl = (mOffset, day) => {
    const d = new Date(now.getFullYear(), now.getMonth()-mOffset, day);
    return d > now ? null : d.toISOString().slice(0,10);
  };
  const tglRel = (hariLalu) => {
    const d = new Date(now); d.setDate(d.getDate() - hariLalu);
    return d.toISOString().slice(0,10);
  };

  NEW.assets = [
    {id:uid(), nama:'Peralatan Medis', tanggal:tglRel(180), hargaPerolehan:12000000, umurBulan:60, penyusutanBulanan:200000, totalTersusut:600000, postingLog:[
      {bulan:monthOf(tglRel(180)),tanggal:tglRel(180),jumlah:200000},
      {bulan:monthOf(tglRel(150)),tanggal:tglRel(150),jumlah:200000},
      {bulan:monthOf(tglRel(120)),tanggal:tglRel(120),jumlah:200000}
    ]},
    {id:uid(), nama:'Komputer Kasir', tanggal:tglRel(120), hargaPerolehan:8000000, umurBulan:48, penyusutanBulanan:166667, totalTersusut:333334, postingLog:[
      {bulan:monthOf(tglRel(120)),tanggal:tglRel(120),jumlah:166667},
      {bulan:monthOf(tglRel(90)),tanggal:tglRel(90),jumlah:166667}
    ]},
    {id:uid(), nama:'Kendaraan Operasional', tanggal:tglRel(300), hargaPerolehan:85000000, umurBulan:96, penyusutanBulanan:885417, totalTersusut:3541668, postingLog:[
      {bulan:monthOf(tglRel(300)),tanggal:tglRel(300),jumlah:885417},
      {bulan:monthOf(tglRel(270)),tanggal:tglRel(270),jumlah:885417},
      {bulan:monthOf(tglRel(240)),tanggal:tglRel(240),jumlah:885417},
      {bulan:monthOf(tglRel(210)),tanggal:tglRel(210),jumlah:885417}
    ]}
  ];
  NEW.assets.forEach(a=>{
    a.postingLog.forEach(log=>{
      NEW.journals.push({
        id:uid(), tanggal:log.tanggal, ref:'DEP-'+log.bulan,
        ket:'Penyusutan '+a.nama,
        lines:[{kode:'6005',debit:log.jumlah,kredit:0},{kode:'1302',debit:0,kredit:log.jumlah}],
        source:'depreciation'
      });
    });
  });

  // ===== HELPER: BUAT INVOICE =====
  function seedInvoice(no, tanggal, cust, items, bayar, ppn, whId){
    let subtotal = 0, hpp = 0;
    const validItems = [];
    items.forEach(({item, qty}) => {
      const stok = item.stokPerGudang[whId] || 0;
      const q = Math.min(qty, stok);
      if(q <= 0) return;
      subtotal += q * item.hargaJual;
      hpp += q * item.hargaBeli;
      item.stokPerGudang[whId] -= q;
      item.stok -= q;
      validItems.push({itemId:item.id, qty:q, harga:item.hargaJual});
    });
    if(!validItems.length) return null;
    const tax = ppn ? Math.round(subtotal * 0.11) : 0;
    const total = subtotal + tax;
    const noStr = 'INV-' + String(no).padStart(4,'0');
    const lines = [];
    const kas = bayar==='kredit' ? '1101' : (bayar==='transfer' ? '1002' : '1001');
    lines.push({kode:kas, debit:total, kredit:0});
    lines.push({kode:'4001', debit:0, kredit:subtotal});
    if(tax > 0) lines.push({kode:'2101', debit:0, kredit:tax});
    if(hpp > 0){
      lines.push({kode:'5001', debit:hpp, kredit:0});
      lines.push({kode:'1201', debit:0, kredit:hpp});
    }
    const j = {id:uid(), tanggal, ref:noStr, ket:'Penjualan ke '+cust.nama, lines, source:'invoice'};
    NEW.journals.push(j);
    const inv = {
      id:j.id, no:noStr, tanggal, customerId:cust.id, bayar, whId,
      subtotal, tax, ppn, total, hpp,
      paidAmount: bayar==='kredit' ? 0 : total,
      status: bayar==='kredit' ? 'belum' : 'lunas',
      dueDate: bayar==='kredit' ? addDays(tanggal, 30) : null,
      items: validItems
    };
    NEW.invoices.push(inv);
    return inv;
  }

  // ===== HELPER: BUAT PEMBELIAN =====
  function seedPurchase(no, tanggal, vend, items, bayar, ppn, whId){
    let subtotal = 0;
    const validItems = [];
    items.forEach(({item, qty, harga}) => {
      subtotal += qty * harga;
      item.stokPerGudang[whId] = (item.stokPerGudang[whId] || 0) + qty;
      item.stok = (item.stok || 0) + qty;
      item.hargaBeli = harga;
      validItems.push({itemId:item.id, qty, harga});
    });
    if(!validItems.length) return null;
    const tax = ppn ? Math.round(subtotal * 0.11) : 0;
    const total = subtotal + tax;
    const noStr = 'PUR-' + String(no).padStart(4,'0');
    const lines = [];
    const kas = bayar==='kredit' ? '2001' : (bayar==='transfer' ? '1002' : '1001');
    lines.push({kode:'1201', debit:subtotal, kredit:0});
    if(tax > 0) lines.push({kode:'1202', debit:tax, kredit:0});
    lines.push({kode:kas, debit:0, kredit:total});
    const j = {id:uid(), tanggal, ref:noStr, ket:'Pembelian dari '+vend.nama, lines, source:'purchase'};
    NEW.journals.push(j);
    NEW.purchases.push({
      id:j.id, no:noStr, tanggal, vendorId:vend.id, bayar, whId,
      subtotal, tax, ppn, total,
      paidAmount: bayar==='kredit' ? 0 : total,
      status: bayar==='kredit' ? 'belum' : 'lunas',
      dueDate: bayar==='kredit' ? addDays(tanggal, 30) : null,
      items: validItems
    });
  }

  // ===== GENERATE PENJUALAN (4 bulan terakhir) =====
  let invNo = 0;
  [3,2,1,0].forEach(mOff => {
    const numInv = rint(7, 10);
    for(let i=0; i<numInv; i++){
      const day = rint(1, 28);
      const tanggal = mkTgl(mOff, day);
      if(!tanggal) continue;
      const cust = pick(NEW.customers);
      const nItems = rint(1, 4);
      const used = new Set();
      const items = [];
      for(let k=0; k<nItems; k++){
        let idx, tries = 0;
        do { idx = rint(0, NEW.items.length-1); tries++; }
        while(used.has(idx) && tries < 10);
        used.add(idx);
        items.push({ item:NEW.items[idx], qty:rint(1,5) });
      }
      const r = rnd();
      const bayar = r<0.4 ? 'tunai' : (r<0.7 ? 'transfer' : 'kredit');
      const ppn = rnd() < 0.6;
      const wh = rnd() < 0.7 ? whU : whC;
      invNo++;
      seedInvoice(invNo, tanggal, cust, items, bayar, ppn, wh);
    }
  });

  // ===== GENERATE PEMBELIAN (4 bulan terakhir) =====
  let purNo = 0;
  [3,2,1,0].forEach(mOff => {
    const numPur = rint(2, 4);
    for(let i=0; i<numPur; i++){
      const day = rint(1, 28);
      const tanggal = mkTgl(mOff, day);
      if(!tanggal) continue;
      const vend = pick(NEW.vendors);
      const nItems = rint(2, 5);
      const used = new Set();
      const items = [];
      for(let k=0; k<nItems; k++){
        let idx, tries = 0;
        do { idx = rint(0, NEW.items.length-1); tries++; }
        while(used.has(idx) && tries < 10);
        used.add(idx);
        const it = NEW.items[idx];
        items.push({ item:it, qty:rint(20, 100), harga:Math.round(it.hargaBeli * (0.95 + rnd()*0.1)) });
      }
      const r = rnd();
      const bayar = r<0.3 ? 'tunai' : (r<0.6 ? 'transfer' : 'kredit');
      purNo++;
      seedPurchase(purNo, tanggal, vend, items, bayar, true, whU);
    }
  });

  // ===== PELUNASAN (sebagian invoice/faktur kredit) =====
  NEW.invoices.forEach(v => {
    if(v.bayar !== 'kredit' || v.paidAmount >= v.total) return;
    const r = rnd();
    if(r < 0.4) return; // 40% tidak dilunasi
    const sisa = v.total - v.paidAmount;
    const bayar = r < 0.7 ? Math.round(sisa * 0.5) : sisa;
    const tglBayar = addDays(v.tanggal, rint(10, 40));
    if(tglBayar > today()) return;
    const cust = NEW.customers.find(c=>c.id===v.customerId);
    NEW.journals.push({
      id:uid(), tanggal:tglBayar, ref:'PAY-'+v.no,
      ket:'Pelunasan '+v.no+' - '+(cust?cust.nama:'Umum'),
      lines:[
        {kode:'1002', debit:bayar, kredit:0},
        {kode:'1101', debit:0, kredit:bayar}
      ],
      source:'payment'
    });
    v.paidAmount += bayar;
    v.status = v.paidAmount >= v.total ? 'lunas' : 'sebagian';
    NEW.payments.push({id:uid(), tanggal:tglBayar, tipe:'AR', refId:v.id, refNo:v.no, jumlah:bayar, akunKas:'1002'});
  });

  NEW.purchases.forEach(v => {
    if(v.bayar !== 'kredit' || v.paidAmount >= v.total) return;
    const r = rnd();
    if(r < 0.5) return;
    const sisa = v.total - v.paidAmount;
    const bayar = r < 0.8 ? Math.round(sisa * 0.6) : sisa;
    const tglBayar = addDays(v.tanggal, rint(15, 45));
    if(tglBayar > today()) return;
    const vend = NEW.vendors.find(c=>c.id===v.vendorId);
    NEW.journals.push({
      id:uid(), tanggal:tglBayar, ref:'BPY-'+v.no,
      ket:'Bayar '+v.no+' - '+(vend?vend.nama:'Umum'),
      lines:[
        {kode:'2001', debit:bayar, kredit:0},
        {kode:'1002', debit:0, kredit:bayar}
      ],
      source:'payment'
    });
    v.paidAmount += bayar;
    v.status = v.paidAmount >= v.total ? 'lunas' : 'sebagian';
    NEW.payments.push({id:uid(), tanggal:tglBayar, tipe:'AP', refId:v.id, refNo:v.no, jumlah:bayar, akunKas:'1002'});
  });

  // ===== BEBERAPA BEBAN OPERASIONAL =====
  const bebanList = [
    ['6001','Beban Gaji', 8500000],
    ['6002','Beban Listrik & Air', 450000],
    ['6003','Beban ATK', 175000],
    ['6004','Beban Sewa', 3000000]
  ];
  [3,2,1,0].forEach(mOff => {
    bebanList.forEach(([kode,nama,jml]) => {
      const tanggal = mkTgl(mOff, rint(1, 5));
      if(!tanggal) return;
      NEW.journals.push({
        id:uid(), tanggal, ref:'OPEX-'+monthOf(tanggal),
        ket:nama+' bulan '+monthOf(tanggal),
        lines:[
          {kode, debit:jml, kredit:0},
          {kode:'1001', debit:0, kredit:jml}
        ],
        source:'manual'
      });
    });
  });

  // ===== SET & SAVE =====
  NEW.counters = { inv:invNo, pur:purNo, jv:0 };
  DB = NEW;
  save();
  toast('Data demo terisi: '+NEW.invoices.length+' invoice · '+NEW.purchases.length+' pembelian · '+NEW.journals.length+' jurnal');
  goto('dashboard');
}
window.seedDemoData = seedDemoData;
