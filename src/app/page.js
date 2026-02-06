"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [dataBarang, setDataBarang] = useState([])
  const [loading, setLoading] = useState(false)
  const [sedangEdit, setSedangEdit] = useState(null)

  const [form, setForm] = useState({
    kode_barang: '',
    nama_barang: '',
    merek_barang: '',
    kategori_barang: '',
    jumlah_barang: 0,
    satuan_barang: ''
  })

  const daftarKategori = [
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

  const daftarSatuan = ["Buah", "Unit", "Meter", "Batang", "Kg", "Liter"]

  useEffect(() => {
    const initApp = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        fetchData()
      }
    }
    initApp()
  }, [router])

  const fetchData = async () => {
    const { data, error } = await supabase
      .from('inventaris_produksi')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) console.error("Gagal ambil data:", error.message)
    else setDataBarang(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = { 
      ...form, 
      jumlah_barang: parseInt(form.jumlah_barang) 
    }

    let error;
    if (sedangEdit) {
      const { error: updateError } = await supabase
        .from('inventaris_produksi')
        .update(payload)
        .eq('id', sedangEdit)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('inventaris_produksi')
        .insert([payload])
      error = insertError
    }

    if (error) {
      alert("Gagal proses: " + error.message)
    } else {
      setForm({ kode_barang: '', nama_barang: '', merek_barang: '', kategori_barang: '', jumlah_barang: 0, satuan_barang: '' })
      setSedangEdit(null)
      fetchData()
    }
    setLoading(false)
  }

  const siapkanEdit = (item) => {
    setSedangEdit(item.id)
    setForm({
      kode_barang: item.kode_barang,
      nama_barang: item.nama_barang,
      merek_barang: item.merek_barang,
      kategori_barang: item.kategori_barang,
      jumlah_barang: item.jumlah_barang,
      satuan_barang: item.satuan_barang,
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hapusBarang = async (id) => {
    const setuju = confirm("Yakin mau hapus barang ini dari gudang?")
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

  if (!user) return <p className="text-center mt-10 text-blue-600 font-semibold animate-pulse">Memuat profil produksi...</p>

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 font-sans bg-gray-50 min-h-screen">
      
      {/* HEADER USER */}
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl uppercase">
            {user.email[0]}
          </div>
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Operator On Duty</p>
            <p className="text-sm font-bold text-gray-700">{user.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all uppercase">Logout System</button>
      </div>

      {/* TITLE SECTION */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
          Production <span className="text-blue-600">Asset</span> Control
        </h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Sistem Pemantauan Inventaris Urusan Produksi</p>
      </div>

      {/* STATS SINGKAT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-600 p-4 rounded-2xl shadow-blue-200 shadow-lg text-white">
          <p className="text-[10px] font-bold opacity-80 uppercase">Total Item</p>
          <p className="text-2xl font-black">{dataBarang.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Status Sistem</p>
          <p className="text-sm font-black text-green-500 uppercase flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span> Online
          </p>
        </div>
      </div>

      {/* FORM INPUT */}
      <form onSubmit={handleSubmit} className="bg-white shadow-xl shadow-slate-200/50 rounded-3xl px-8 pt-8 pb-8 mb-10 border border-slate-100 relative overflow-hidden">
        {sedangEdit && <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse"></div>}
        
        <h2 className="text-lg font-black mb-6 text-slate-800 flex items-center gap-2 uppercase tracking-tight">
          {sedangEdit ? "📝 Koreksi Data Barang" : "➕ Registrasi Barang Baru"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Serial/Kode</label>
            <input placeholder="Ex: PRD-XXXX" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none transition font-mono text-sm" value={form.kode_barang} onChange={e => setForm({...form, kode_barang: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Deskripsi Barang</label>
            <input placeholder="Nama lengkap item" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm font-bold" value={form.nama_barang} onChange={e => setForm({...form, nama_barang: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Merek</label>
            <input placeholder="Brand/Vendor" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm" value={form.merek_barang} onChange={e => setForm({...form, merek_barang: e.target.value})} />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Klasifikasi</label>
            <select className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 bg-white outline-none cursor-pointer text-sm font-medium" value={form.kategori_barang} onChange={e => setForm({...form, kategori_barang: e.target.value})} required>
              <option value="">-- Pilih Kategori --</option>
              {daftarKategori.map((kat, idx) => (
                <option key={idx} value={kat}>{kat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Qty</label>
            <input type="number" className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none transition text-sm font-black" value={form.jumlah_barang} onChange={e => setForm({...form, jumlah_barang: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Measurement</label>
            <select className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 bg-white outline-none cursor-pointer text-sm font-medium" value={form.satuan_barang} onChange={e => setForm({...form, satuan_barang: e.target.value})} required>
              <option value="">-- Satuan --</option>
              {daftarSatuan.map((sat, idx) => (
                <option key={idx} value={sat}>{sat}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-8">
          <button type="submit" disabled={loading} className={`flex-1 p-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg transition-all transform active:scale-95 ${sedangEdit ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'} disabled:bg-slate-300`}>
            {loading ? "Processing..." : sedangEdit ? "Apply Changes" : "Commit to Warehouse"}
          </button>
          {sedangEdit && (
            <button type="button" onClick={() => {setSedangEdit(null); setForm({kode_barang:'', nama_barang:'', merek_barang:'', kategori_barang:'', jumlah_barang:0, satuan_barang:''})}} className="px-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
          )}
        </div>
      </form>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-slate-800 font-black text-sm uppercase tracking-tighter">Inventory List Data</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">Live Database</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white text-slate-400 border-b">
                <th className="py-5 px-6 text-left font-black uppercase text-[10px] tracking-widest">Code</th>
                <th className="py-5 px-6 text-left font-black uppercase text-[10px] tracking-widest">Item Description</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Brand</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Stock Level</th>
                <th className="py-5 px-6 text-center font-black uppercase text-[10px] tracking-widest">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {dataBarang.length > 0 ? dataBarang.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="py-5 px-6 font-mono text-[11px] text-blue-600 font-bold tracking-tighter">{item.kode_barang}</td>
                  <td className="py-5 px-6">
                    <div className="font-black text-slate-800 text-sm leading-tight">{item.nama_barang}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">{item.kategori_barang}</div>
                  </td>
                  <td className="py-5 px-6 text-center text-slate-500 font-medium italic">{item.merek_barang || '—'}</td>
                  <td className="py-5 px-6 text-center">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-[11px] uppercase ${item.jumlah_barang < 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                      {item.jumlah_barang} <span>{item.satuan_barang}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 text-center">
                    <div className="flex justify-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                      {/* BUTTON EDIT DENGAN IKON */}
                      <button onClick={() => siapkanEdit(item)} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all" title="Edit Item">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      {/* BUTTON HAPUS DENGAN IKON */}
                      <button onClick={() => hapusBarang(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete Item">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="py-24 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">No Data Available in Warehouse</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}