"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase' 
import { isAdmin } from '../../lib/auth'

export default function TambahPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading Form...</div>}>
      <FormTambah />
    </Suspense>
  )
}

function FormTambah() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idToEdit = searchParams.get('id')

  // === 1. KAMUS KODE (MAPPING) ===
  const KATEGORI_PREFIX = {
    "Perkakas Tangan (Hand Tools)": "HT",
    "Alat Keselamatan Kerja (APD / K3)": "APD",
    "Alat Ukur Kualitas Air / Lingkungan": "KL",
    "Peralatan Laboratorium": "PL",
    "Alat Ukur & Pengujian Listrik": "AL",
    "Material Perpipaan / Fitting": "MP",
    "Material Listrik": "ML",
    "Bahan Kimia Operasional": "KO",
    "Bahan Bakar & Pelumas": "BP",
    "Alat Kebersihan" : "AK"
  }

  // === DAFTAR SATUAN ===
  const LIST_SATUAN = ["Buah", "Unit", "Kg", "Liter", "Meter", "Batang", "Pcs", "Set", "Lembar", "Box", "Galon", "Drum"]

  const [formData, setFormData] = useState({
    kode_barang: '',
    nama_barang: '',
    kategori_barang: '',
    merek_barang: '',
    jumlah_barang: 0,
    satuan_barang: 'Buah' 
  })
  
  const [loading, setLoading] = useState(false)
  const [generatingCode, setGeneratingCode] = useState(false) 

  // Cek Admin & Load Data Lama
  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !isAdmin(user.email)) {
        alert("⛔ AKSES DITOLAK: Khusus Admin!")
        router.push('/')
        return
      }

      if (idToEdit) {
        const { data } = await supabase
          .from('inventaris_produksi')
          .select('*')
          .eq('id', idToEdit)
          .single()
        if (data) setFormData(data)
      }
    }
    initPage()
  }, [idToEdit, router])

  // === 2. OTAK OTOMATIS (GENERATE KODE) ===
  const handleKategoriChange = async (e) => {
    const selectedKategori = e.target.value
    
    setFormData(prev => ({ ...prev, kategori_barang: selectedKategori }))

    if (idToEdit) return 

    if (!selectedKategori) {
      setFormData(prev => ({ ...prev, kode_barang: '' }))
      return
    }

    setGeneratingCode(true)
    const prefix = KATEGORI_PREFIX[selectedKategori] || "GEN" 

    try {
      const { data } = await supabase
        .from('inventaris_produksi')
        .select('kode_barang')
        .ilike('kode_barang', `${prefix}-%`) 
        .order('kode_barang', { ascending: false }) 
        .limit(1)

      let nextNumber = 1
      
      if (data && data.length > 0) {
        const lastCode = data[0].kode_barang
        const lastNumberStr = lastCode.split('-')[1] 
        if (lastNumberStr && !isNaN(lastNumberStr)) {
          nextNumber = parseInt(lastNumberStr) + 1
        }
      }

      const formattedNumber = nextNumber.toString().padStart(3, '0')
      const newCode = `${prefix}-${formattedNumber}`
      setFormData(prev => ({ ...prev, kode_barang: newCode }))

    } catch (err) {
      console.error("Gagal generate kode:", err)
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // === 3. SUBMIT DENGAN LOGIKA MEREK KOSONG ===
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Logika: Kalau kosong atau spasi doang, ganti jadi strip (-)
    const brandFinal = formData.merek_barang.trim() === "" ? "-" : formData.merek_barang

    const payload = idToEdit ? 
      { 
        nama_barang: formData.nama_barang,
        kategori_barang: formData.kategori_barang,
        merek_barang: brandFinal, 
        satuan_barang: formData.satuan_barang
      } : 
      {
        ...formData,
        merek_barang: brandFinal 
      }

    if (idToEdit) {
      const { error } = await supabase.from('inventaris_produksi').update(payload).eq('id', idToEdit)
      if (!error) { alert("Data berhasil diperbarui!"); router.push('/') }
      else alert("Gagal update: " + error.message)
    } else {
      const { error } = await supabase.from('inventaris_produksi').insert([payload])
      if (!error) { alert(`Barang ${formData.kode_barang} berhasil disimpan!`); router.push('/') }
      else alert("Gagal simpan: " + error.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-xl mt-10 border border-slate-100 font-sans">
      <h1 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter border-b pb-4">
        {idToEdit ? 'Edit Data Aset' : 'Registrasi Aset Baru'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* 1. PILIH KATEGORI */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kategori Barang</label>
          <select 
            name="kategori_barang" 
            className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold bg-white focus:border-blue-500 outline-none transition" 
            value={formData.kategori_barang} 
            onChange={handleKategoriChange} 
            required
          >
            <option value="">-- Pilih Kategori (Kode Otomatis) --</option>
            {Object.keys(KATEGORI_PREFIX).map((kategori) => (
              <option key={kategori} value={kategori}>{kategori}</option>
            ))}
          </select>
        </div>

        {/* 2. NAMA BARANG (DIPINDAH KE ATAS) */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Barang</label>
          <input type="text" name="nama_barang" required placeholder="Nama lengkap barang..." className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" value={formData.nama_barang} onChange={handleChange} />
        </div>

        {/* 3. KODE BARANG & MEREK (SEBELAHAN) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Kode Barang */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Kode Barang {generatingCode && <span className="text-blue-500 animate-pulse">(Membuat Kode...)</span>}
            </label>
            <input 
              type="text" 
              name="kode_barang" 
              readOnly 
              className="w-full p-3 border-2 border-slate-200 bg-slate-100 text-slate-500 rounded-xl font-mono text-sm font-bold cursor-not-allowed" 
              value={formData.kode_barang} 
              placeholder="Otomatis..."
            />
          </div>
          {/* Merek Barang */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Merek / Brand</label>
            <input 
              type="text" 
              name="merek_barang" 
              placeholder="Kosongkan jika tidak ada" 
              className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" 
              value={formData.merek_barang} 
              onChange={handleChange} 
            />
          </div>
        </div>

        {/* 4. STOK & SATUAN (SEBELAHAN) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Stok */}
          <div>
            {!idToEdit && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Stok Awal</label>
                <input type="number" name="jumlah_barang" required className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" value={formData.jumlah_barang} onChange={handleChange} />
              </div>
            )}
            {idToEdit && (
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sisa Stok</label>
                <input type="number" disabled className="w-full p-3 border-2 border-slate-200 bg-slate-50 text-slate-400 rounded-xl text-sm font-bold cursor-not-allowed" value={formData.jumlah_barang} />
                <p className="text-[9px] text-red-500 mt-1 italic">*Ubah stok lewat Transaksi</p>
              </div>
            )}
          </div>

          {/* Satuan */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Satuan</label>
            <select 
              name="satuan_barang" 
              className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold bg-white focus:border-blue-500 outline-none"
              value={formData.satuan_barang} 
              onChange={handleChange}
              required
            >
              <option value="">-- Pilih --</option>
              {LIST_SATUAN.map((satuan) => (
                <option key={satuan} value={satuan}>{satuan}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button type="button" onClick={() => router.back()} className="flex-1 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
          <button type="submit" disabled={loading || generatingCode} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg hover:shadow-blue-200 transition disabled:bg-gray-300">
            {loading ? 'Menyimpan...' : (idToEdit ? 'Update Data' : 'Simpan Data')}
          </button>
        </div>
      </form>
    </div>
  )
}