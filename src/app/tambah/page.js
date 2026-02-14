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

  // STATE UI
  const [showModal, setShowModal] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

  // FUNGSI TOAST
  const showToast = (msg, type = 'error') => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000)
  }

  // Cek Admin & Load Data Lama
  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user || !isAdmin(user.email)) {
        showToast("⛔ AKSES DITOLAK: Khusus Admin!", "error")
        setTimeout(() => router.push('/'), 2000)
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
      showToast("Gagal generate kode otomatis", "error")
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // === 3. PRE-SUBMIT (Trigger Modal) ===
  const handlePreSubmit = (e) => {
    e.preventDefault()
    if (!formData.nama_barang || !formData.kategori_barang) {
        return showToast("Mohon lengkapi data wajib!", "error")
    }
    setShowModal(true) // Buka Pop-up Konfirmasi
  }

  // === 4. FINAL SUBMIT (Ke Database) ===
  const handleFinalSave = async () => {
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

    let error = null

    if (idToEdit) {
      const res = await supabase.from('inventaris_produksi').update(payload).eq('id', idToEdit)
      error = res.error
    } else {
      const res = await supabase.from('inventaris_produksi').insert([payload])
      error = res.error
    }

    if (error) {
      showToast("Gagal simpan: " + error.message, "error")
      setLoading(false)
      setShowModal(false)
    } else {
      // SUKSES CINEMATIC
      setLoading(false)
      setIsSuccess(true) 
      setTimeout(() => {
        router.push('/')
      }, 1500)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 bg-white rounded-3xl shadow-xl mt-10 border border-slate-100 font-sans relative">
      
      {/* === TOAST NOTIFICATION === */}
      <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-[1000] transition-all duration-300 ease-in-out ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl font-bold text-sm ${
          toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'
        }`}>
          {toast.type === 'error' ? (
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
             <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          )}
          <span>{toast.message}</span>
        </div>
      </div>

      <h1 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tighter border-b pb-4">
        {idToEdit ? 'Edit Data Aset' : 'Registrasi Aset Baru'}
      </h1>

      {/* FORM ASLI (LAYOUT TIDAK DIUBAH) */}
      <form onSubmit={handlePreSubmit} className="space-y-4">
        
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

        {/* 2. NAMA BARANG */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nama Barang</label>
          <input type="text" name="nama_barang" required placeholder="Nama lengkap barang..." className="w-full p-3 border-2 border-slate-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none" value={formData.nama_barang} onChange={handleChange} />
        </div>

        {/* 3. KODE BARANG & MEREK */}
        <div className="grid grid-cols-2 gap-4">
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

        {/* 4. STOK & SATUAN */}
        <div className="grid grid-cols-2 gap-4">
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

      {/* === MODAL POP-UP KONFIRMASI & SUKSES === */}
      {showModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl p-8 transform transition-all scale-100 animate-in zoom-in duration-200 border border-white/20">
            
            {isSuccess ? (
              // === TAMPILAN SUKSES ===
              <div className="flex flex-col items-center justify-center py-4 text-center animate-in zoom-in duration-300">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-xl animate-bounce">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-1">Berhasil Disimpan!</h3>
                <p className="text-sm text-slate-500 font-medium">Data barang sudah masuk database.</p>
              </div>
            ) : (
              // === TAMPILAN KONFIRMASI LENGKAP ===
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Cek Data Barang</h3>
                  <p className="text-xs text-slate-500 font-medium">Pastikan data yang diinput sudah benar.</p>
                </div>

                {/* AREA DETAIL YANG DIPERBAIKI */}
                <div className="bg-slate-50 rounded-2xl p-5 mb-6 space-y-3 border border-slate-100 text-sm">
                  
                  {/* Kategori */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Kategori</span>
                    <span className="font-bold text-slate-700 text-right w-40 leading-tight text-xs">{formData.kategori_barang}</span>
                  </div>

                  {/* Kode */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Kode</span>
                    <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">{formData.kode_barang}</span>
                  </div>

                  {/* Nama Barang */}
                  <div className="flex justify-between items-start">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Nama</span>
                    <span className="font-black text-slate-800 text-right w-40 leading-tight">{formData.nama_barang}</span>
                  </div>

                  {/* Merek */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Merek</span>
                    <span className="font-medium text-slate-700 text-xs">{formData.merek_barang || '-'}</span>
                  </div>

                  <div className="border-t border-slate-200 my-1"></div>

                  {/* Stok & Satuan */}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Stok Awal</span>
                    <span className="font-black text-lg text-emerald-600">
                      {formData.jumlah_barang} <span className="text-xs text-slate-500 font-bold">{formData.satuan_barang}</span>
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-white border-2 border-slate-100 hover:bg-slate-50 transition"
                  >
                    Edit Lagi
                  </button>
                  <button 
                    onClick={handleFinalSave}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-lg transition flex justify-center items-center gap-2"
                  >
                    {loading ? "Menyimpan..." : "Ya, Simpan"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}