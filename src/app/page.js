"use client"
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../lib/supabase' 
import { isAdmin } from '../lib/auth' 
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

// LIBRARY PDF
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><span className="loading loading-dots loading-lg text-blue-600"></span></div>}>
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ''

  const [user, setUser] = useState(null)
  const [dataBarang, setDataBarang] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterKritis, setFilterKritis] = useState(false)

  // === STATE MODAL CETAK ===
  const [showModalPrint, setShowModalPrint] = useState(false)
  const [printType, setPrintType] = useState('SO') 
  const [printCategory, setPrintCategory] = useState('SEMUA')
  const [printBlindCount, setPrintBlindCount] = useState(false) 

  // DAFTAR KATEGORI
  const LIST_KATEGORI = [
    "Perkakas Tangan (Hand Tools)",
    "Alat Keselamatan Kerja (APD / K3)",
    "Alat Ukur Kualitas Air / Lingkungan",
    "Peralatan Laboratorium",
    "Alat Ukur & Pengujian Listrik",
    "Material Perpipaan / Fitting",
    "Material Listrik",
    "Bahan Kimia Operasional",
    "Bahan Bakar & Pelumas"
  ]

  useEffect(() => {
    const initApp = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
      }
    }
    initApp()
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    let query = supabase
      .from('inventaris_produksi')
      .select('*')
      .order('created_at', { ascending: false })

    if (searchQuery) {
      query = query.or(`nama_barang.ilike.%${searchQuery}%,kode_barang.ilike.%${searchQuery}%`)
    }
    
    const { data, error } = await query
    if (error) console.error("Gagal ambil data:", error.message)
    else setDataBarang(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (user) fetchData()
  }, [user, searchQuery])

  // --- HANDLE SEARCH (DENGAN FIX SCROLL JUMPING) ---
  const handleSearch = (term) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    // TAMBAHAN: { scroll: false } BIAR LAYAR GAK LONCAT KE ATAS
    router.replace(`/?${params.toString()}`, { scroll: false })
  }

  const hapusBarang = async (id) => {
    const setuju = confirm("⚠️ Hapus barang ini dari database?")
    if (setuju) {
      const { error } = await supabase.from('inventaris_produksi').delete().eq('id', id)
      if (error) alert("Gagal hapus: " + error.message)
      else fetchData()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // === PDF GENERATOR ENGINE ===
  const generatePDF = () => {
    const doc = new jsPDF()
    const isReport = printType === 'REPORT' 
    
    let dataPrint = [...dataBarang]
    if (printCategory !== 'SEMUA') {
      dataPrint = dataPrint.filter(item => item.kategori_barang === printCategory)
    }

    dataPrint.sort((a, b) => {
      if (a.kategori_barang < b.kategori_barang) return -1;
      if (a.kategori_barang > b.kategori_barang) return 1;
      return a.nama_barang.localeCompare(b.nama_barang);
    })

    doc.setFontSize(16)
    doc.text(isReport ? "LAPORAN INVENTARIS PRODUKSI" : "LEMBAR KERJA STOK OPNAME (SO)", 14, 20)
    
    doc.setFontSize(10)
    doc.text(`Tanggal Cetak : ${new Date().toLocaleString('id-ID')}`, 14, 28)
    doc.text(`Kategori      : ${printCategory}`, 14, 33)
    
    if (!isReport) {
      doc.text(`Mode Audit    : ${printBlindCount ? 'BLIND COUNT' : 'OPEN COUNT'}`, 14, 38)
      doc.text(`Petugas       : .......................................`, 120, 38)
    } else {
      doc.text(`Dicetak Oleh  : ${user.email}`, 14, 38)
    }

    let tableHead = []
    let tableBody = []

    if (isReport) {
      tableHead = [["No", "Kode", "Kategori", "Nama Barang", "Merek", "Stok", "Satuan"]]
      tableBody = dataPrint.map((item, index) => [
        index + 1,
        item.kode_barang,
        item.kategori_barang,
        item.nama_barang,
        item.merek_barang || '-',
        item.jumlah_barang,
        item.satuan_barang
      ])
    } else {
      tableHead = printBlindCount 
        ? [["No", "Kode", "Kategori", "Nama Barang", "Satuan", "Fisik (Manual)", "Ket"]]
        : [["No", "Kode", "Kategori", "Nama Barang", "Satuan", "Sistem", "Fisik (Manual)", "Ket"]]

      tableBody = dataPrint.map((item, index) => {
        const row = [
          index + 1,
          item.kode_barang,
          item.kategori_barang,
          item.nama_barang,
          item.satuan_barang,
        ]
        if (!printBlindCount) row.push(item.jumlah_barang) 
        row.push("") 
        row.push("") 
        return row
      })
    }

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: 45,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: isReport ? [22, 163, 74] : [41, 37, 36] }, 
      columnStyles: !isReport && printBlindCount ? { 5: { cellWidth: 30 } } : {}
    })

    const fileName = isReport 
      ? `Laporan_Aset_${printCategory}_${new Date().toISOString().slice(0,10)}.pdf`
      : `SO_Sheet_${printCategory}_${new Date().toISOString().slice(0,10)}.pdf`
      
    doc.save(fileName)
    setShowModalPrint(false) 
  }

  // === 🔥 LOGIC KRITIS TERBARU (CUSTOM CHEMICALS) ===
  const cekKritis = (item) => {
    // 1. Stok 0 (Habis) -> MERAH MUTLAK
    if (item.jumlah_barang === 0) return true;

    // 2. Kategori Pipa & Fitting (< 5)
    if (item.kategori_barang === 'Material Perpipaan / Fitting' && item.jumlah_barang < 5) return true;

    // 3. Kategori Bahan Kimia (LOGIKA SPESIFIK)
    if (item.kategori_barang === 'Bahan Kimia Operasional') {
      const nama = item.nama_barang.toLowerCase(); // Biar aman dari huruf besar/kecil

      // A. High Volume Items (< 1000)
      if ((nama.includes('calcium hypochlorite') || nama.includes('pac 280')) && item.jumlah_barang < 1000) return true;
      // B. DPD No. 1 (Sisa <= 50)
      if (nama.includes('dpd no. 1') && item.jumlah_barang <= 50) return true;
      // C. Phenol Rapid Red (Sisa <= 5)
      if (nama.includes('phenol rapid red') && item.jumlah_barang <= 5) return true;
      // D. Aquades (Sisa <= 1)
      if (nama.includes('aquades') && item.jumlah_barang <= 1) return true;
    }
    return false;
  }
  // ===================================================

  const jumlahKritis = dataBarang.filter(item => cekKritis(item)).length
  const displayData = filterKritis ? dataBarang.filter(item => cekKritis(item)) : dataBarang

  if (!user) return null

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-sans min-h-screen relative">
      
      {/* HEADER USER */}
      <div className="flex justify-between items-center mb-10 bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl uppercase">
            {user.email[0]}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">User Access</p>
            <p className="text-sm font-bold text-slate-700">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-black uppercase transition">
          Log Out
        </button>
      </div>

      {/* TITLE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Production <span className="text-blue-600">Asset</span> Control
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Urusan Produksi - BLUD Air Minum Kota Cimahi</p>
        </div>

        {isAdmin(user.email) && (
          <Link href="/tambah" className="group flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1">
            <div className="bg-slate-700 p-1 rounded-lg group-hover:bg-blue-500 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
            </div>
            <span>Registrasi Item Baru</span>
          </Link>
        )}
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-600 p-5 rounded-[24px] shadow-blue-200 shadow-lg text-white">
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Total Barang/Aset</p>
          <p className="text-3xl font-black">{dataBarang.length}</p>
        </div>

        <div 
          onClick={() => setFilterKritis(!filterKritis)}
          className={`bg-white p-5 rounded-[24px] border shadow-sm cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md group relative overflow-hidden ${filterKritis ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-100 hover:border-red-200'}`}
        >
          {filterKritis && <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl">FILTER AKTIF</div>}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-500 transition-colors">Barang Menipis / Habis</p>
              <p className="text-3xl font-black text-red-500">{jumlahKritis}</p>
            </div>
            <div className={`p-2 rounded-full ${filterKritis ? 'bg-red-100 text-red-600' : 'bg-slate-50 text-slate-300 group-hover:text-red-400'}`}>
               <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
          </div>
          {filterKritis && <p className="text-[10px] text-red-400 mt-2 font-bold animate-pulse">Menampilkan item urgent</p>}
        </div>

        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Server</p>
          <p className="text-xs font-black text-emerald-500 uppercase flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Online
          </p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className={`bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border overflow-hidden min-h-[400px] transition-colors ${filterKritis ? 'border-red-200' : 'border-slate-100'}`}>
        
        {/* HEADER TABEL YANG DIMINTA */}
        {/* LAYOUT: [JUDUL] [TOMBOL CETAK] ............ [SEARCH BAR] */}
        <div className={`p-6 border-b flex flex-col md:flex-row justify-between items-center gap-4 ${filterKritis ? 'bg-red-50 border-red-100' : 'bg-slate-50/50 border-slate-50'}`}>
          
          {/* GROUP KIRI: JUDUL + TOMBOL CETAK */}
          <div className="flex items-center gap-4 w-full md:w-auto">
             <h3 className={`font-black text-sm uppercase tracking-tighter whitespace-nowrap ${filterKritis ? 'text-red-700' : 'text-slate-800'}`}>
                {filterKritis ? '⚠️ Barang Critical' : 'Gudang Utama'}
             </h3>

             {/* TOMBOL CETAK (NEMPEL JUDUL) */}
             {isAdmin(user.email) && (
              <button 
                onClick={() => setShowModalPrint(true)} 
                className="flex items-center gap-2 text-[10px] font-bold bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-800 hover:text-white hover:border-slate-800 transition shadow-sm whitespace-nowrap"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span>Cetak Data</span>
              </button>
            )}
          </div>

          {/* GROUP KANAN: SEARCH BAR (MENTOK KANAN) */}
          <div className="relative w-full md:w-64">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <input 
                  type="text" 
                  placeholder="Cari barang..." 
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition"
                  defaultValue={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
               />
          </div>

        </div>

        {/* ISI TABEL */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white text-slate-400 border-b border-slate-100">
                <th className="py-5 px-6 text-left font-black uppercase text-[10px] tracking-widest">#Kode</th>
                <th className="py-5 px-6 text-left font-black uppercase text-[10px] tracking-widest">Detail Barang</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Level Stok</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 <tr><td colSpan="4" className="py-20 text-center animate-pulse">Memuat data...</td></tr>
              ) : displayData.length > 0 ? (
                displayData.map((item) => {
                  const isCritical = cekKritis(item);
                  const isHabis = item.jumlah_barang === 0;

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors group cursor-pointer ${isCritical ? 'bg-red-50/30 hover:bg-red-50' : 'hover:bg-blue-50/40'}`}
                      onClick={() => router.push(`/barang/${item.id}`)}
                    >
                      <td className="py-5 px-6 font-mono text-[11px] text-blue-600 font-bold">{item.kode_barang}</td>
                      <td className="py-5 px-6">
                        <div className="font-black text-slate-800 text-sm leading-tight">{item.nama_barang}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded-md">{item.kategori_barang}</div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <div className={`inline-flex items-center px-3 py-1.5 rounded-xl font-black text-[11px] uppercase border ${isCritical ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {item.jumlah_barang} <span className="text-[9px] opacity-70 ml-1">{item.satuan_barang}</span>
                        </div>
                        {isHabis && <p className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-widest">HABIS!</p>}
                      </td>
                      <td className="py-5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        {isAdmin(user.email) ? (
                          <div className="flex justify-center gap-2">
                            <Link href={`/tambah?id=${item.id}`} className="p-2 text-slate-300 hover:text-orange-500 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                            </Link>
                            <button onClick={() => hapusBarang(item.id)} className="p-2 text-slate-300 hover:text-red-600 transition-all">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-300 uppercase italic">View Only</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr><td colSpan="4" className="py-24 text-center text-slate-400">Gudang Aman</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === SUPER MODAL CETAK (DUAL MODE) === */}
      {showModalPrint && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md p-6 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-200">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 text-lg uppercase">Menu Cetak Data</h3>
              <button onClick={() => setShowModalPrint(false)} className="bg-slate-100 p-2 rounded-full hover:bg-slate-200">
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* TOGGLE SWITCH JENIS CETAKAN */}
            <div className="bg-slate-100 p-1 rounded-xl flex mb-6">
              <button 
                onClick={() => setPrintType('SO')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition ${printType === 'SO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Stok Opname
              </button>
              <button 
                onClick={() => setPrintType('REPORT')}
                className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition ${printType === 'REPORT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Laporan Aset
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Filter Kategori</label>
                <select 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-sm focus:border-blue-500 outline-none"
                  value={printCategory}
                  onChange={(e) => setPrintCategory(e.target.value)}
                >
                  <option value="SEMUA">-- SEMUA KATEGORI --</option>
                  {LIST_KATEGORI.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {printType === 'SO' && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="blindCheck"
                    className="mt-1 w-5 h-5 accent-slate-900"
                    checked={printBlindCount}
                    onChange={(e) => setPrintBlindCount(e.target.checked)}
                  />
                  <label htmlFor="blindCheck" className="cursor-pointer">
                    <span className="block font-bold text-slate-800 text-sm">Mode "Blind Count" (Buta)</span>
                    <span className="block text-xs text-slate-500 mt-1">Sembunyikan kolom "Stok Sistem" agar operator menghitung fisik secara murni.</span>
                  </label>
                </div>
              )}

              {printType === 'REPORT' && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">
                    💡 <strong>Info:</strong> Mode ini akan mencetak laporan lengkap dengan Merek, Stok Akhir, dan Satuan. Cocok untuk pelaporan manajemen.
                  </p>
                </div>
              )}

              <button 
                onClick={generatePDF}
                className={`w-full py-4 font-bold rounded-2xl text-white shadow-xl mt-4 flex justify-center items-center gap-2 transition ${printType === 'SO' ? 'bg-slate-900 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {printType === 'SO' ? 'Download Lembar Kerja' : 'Download Laporan Resmi'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}