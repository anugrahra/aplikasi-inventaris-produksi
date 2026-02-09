"use client"
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

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
  
  // Tangkap keyword pencarian dari URL
  const searchQuery = searchParams.get('q') || ''

  const [user, setUser] = useState(null)
  const [dataBarang, setDataBarang] = useState([])
  const [loading, setLoading] = useState(true)

  // 1. Cek User Login
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

  // 2. Ambil Data (Fetch)
  const fetchData = async () => {
    setLoading(true)
    let query = supabase
      .from('inventaris_produksi')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter Pencarian (Search Engine Logic)
    if (searchQuery) {
      query = query.or(`nama_barang.ilike.%${searchQuery}%,kode_barang.ilike.%${searchQuery}%`)
    }
    
    const { data, error } = await query
    
    if (error) console.error("Gagal ambil data:", error.message)
    else setDataBarang(data || [])
    setLoading(false)
  }

  // Jalankan fetch setiap kali User siap ATAU Search Query berubah
  useEffect(() => {
    if (user) fetchData()
  }, [user, searchQuery])

  // 3. Hapus Barang
  const hapusBarang = async (id) => {
    const setuju = confirm("⚠️ PERINGATAN KERAS\n\nMenghapus barang ini akan menghilangkan data stok selamanya.\nApakah Anda yakin?")
    if (setuju) {
      const { error } = await supabase.from('inventaris_produksi').delete().eq('id', id)
      if (error) alert("Gagal hapus: " + error.message)
      else fetchData() // Refresh data
    }
  }

  // 4. Logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!user) return null // Tunggu redirect

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-sans min-h-screen">
      
      {/* === HEADER USER === */}
      <div className="flex justify-between items-center mb-10 bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold text-xl uppercase">
            {user.email[0]}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Operator On Duty</p>
            <p className="text-sm font-bold text-slate-700">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition">
          Log Out
        </button>
      </div>

      {/* === TITLE & ACTION SECTION === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Production <span className="text-blue-600">Asset</span> Control
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Sistem Pemantauan Inventaris Operasional Produksi & Warehouse</p>
        </div>

        {/* Tombol Tambah Barang Baru (Mengarah ke Halaman Baru) */}
        <Link href="/tambah" className="group flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1">
          <div className="bg-slate-700 p-1 rounded-lg group-hover:bg-blue-500 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
          </div>
          <span>Registrasi Item Baru</span>
        </Link>
      </div>

      {/* === STATS GRID (LAYOUT BARU 3 KOLOM) === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* WIDGET 1: TOTAL BARANG (Label Baru) */}
        <div className="bg-blue-600 p-5 rounded-[24px] shadow-blue-200 shadow-lg text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 bg-white/10 w-24 h-24 rounded-full blur-2xl"></div>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Total Barang/Aset</p>
          <p className="text-3xl font-black">{dataBarang.length}</p>
        </div>
        
        {/* WIDGET 2: STOK MENIPIS */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-red-200 transition">
          <div className="absolute right-0 top-0 bg-red-50 w-16 h-full skew-x-12 translate-x-8 group-hover:translate-x-4 transition"></div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stok Menipis (&lt;5)</p>
          <p className="text-3xl font-black text-red-500 relative z-10">
            {dataBarang.filter(i => i.jumlah_barang < 5).length}
          </p>
        </div>

        {/* WIDGET 3: STATUS SERVER */}
        <div className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col justify-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Server</p>
          <p className="text-xs font-black text-emerald-500 uppercase flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span> Online
          </p>
        </div>
      </div>

      {/* === MAIN TABLE SECTION === */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px]">
        
        {/* Table Header & Search Indicator */}
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-slate-800 font-black text-sm uppercase tracking-tighter flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            Gudang Utama
          </h3>
          {searchQuery && (
             <div className="flex items-center gap-2">
               <span className="text-xs text-slate-400 font-medium">Filter:</span>
               <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                 "{searchQuery}"
               </span>
               <button onClick={() => router.replace('/')} className="text-slate-400 hover:text-red-500">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
             </div>
          )}
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white text-slate-400 border-b border-slate-100">
                <th className="py-5 px-6 text-left font-black uppercase text-[10px] tracking-widest text-slate-300">#Kode</th>
                <th className="py-5 px-6 text-left font-black uppercase text-[10px] tracking-widest">Detail Barang</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Merek</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Level Stok</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 <tr><td colSpan="5" className="py-20 text-center text-slate-400 animate-pulse font-medium">Sedang memuat data gudang...</td></tr>
              ) : dataBarang.length > 0 ? (
                dataBarang.map((item) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-blue-50/40 transition-colors group cursor-pointer" // Tambah cursor-pointer
                    onClick={() => router.push(`/barang/${item.id}`)} // INI KUNCINYA: Klik baris -> Buka Detail
                  >
                    
                    {/* Kolom Kode */}
                    <td className="py-5 px-6 font-mono text-[11px] text-blue-600 font-bold tracking-tighter opacity-70 group-hover:opacity-100">
                      {item.kode_barang}
                    </td>

                    {/* Kolom Detail */}
                    <td className="py-5 px-6">
                      <div className="font-black text-slate-800 text-sm leading-tight">{item.nama_barang}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 tracking-wider bg-slate-100 inline-block px-2 py-0.5 rounded-md">
                        {item.kategori_barang}
                      </div>
                    </td>

                    {/* Kolom Merek */}
                    <td className="py-5 px-6 text-center text-slate-500 font-medium text-xs italic">
                      {item.merek_barang || '—'}
                    </td>

                    {/* Kolom Stok */}
                    <td className="py-5 px-6 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] uppercase border ${
                        item.jumlah_barang < 5 
                          ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {item.jumlah_barang} <span className="text-[9px] opacity-70">{item.satuan_barang}</span>
                      </div>
                    </td>

                    {/* Kolom Aksi */}
                    <td className="py-5 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center gap-2">
                        {/* Tombol Edit (Link ke halaman Tambah) */}
                        <Link href={`/tambah?id=${item.id}`} className="p-2 text-slate-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Edit Master Data">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </Link>
                        
                        {/* Tombol Hapus */}
                        <button onClick={() => hapusBarang(item.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all" title="Hapus Permanen">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-24 text-center">
                    {searchQuery ? (
                      <div className="flex flex-col items-center text-slate-400">
                        <div className="bg-slate-50 p-4 rounded-full mb-3">
                          <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <p className="font-bold text-sm text-slate-600">Barang "{searchQuery}" tidak ditemukan.</p>
                        <button onClick={() => router.replace('/')} className="mt-2 text-blue-600 text-xs font-bold hover:underline">Reset Pencarian</button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-10">
                        <p className="text-slate-300 font-black uppercase tracking-widest text-[10px] mb-4">Gudang Kosong</p>
                        <Link href="/tambah" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg hover:bg-blue-700">
                          + Tambah Barang Pertama
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}