"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function TambahBarangPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Memuat Form...</div>}>
      <FormContent />
    </Suspense>
  )
}

function FormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idEdit = searchParams.get('id') // Cek apakah ini mode EDIT?

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    kode_barang: '',
    nama_barang: '',
    merek_barang: '',
    kategori_barang: '',
    jumlah_barang: 0,
    satuan_barang: ''
  })

  // Daftar Opsi (Sama kayak dulu)
  const daftarKategori = [
    "Perkakas Tangan (Hand Tools)", "Alat Keselamatan Kerja (APD / K3)", "Alat Ukur Kualitas Air / Lingkungan",
    "Peralatan Laboratorium", "Alat Ukur & Pengujian Listrik", "Material Perpipaan / Fitting",
    "Material Listrik", "Bahan Kimia Operasional", "Bahan Bakar & Pelumas"
  ]
  const daftarSatuan = ["Buah", "Unit", "Meter", "Batang", "Kg", "Liter", "Set", "Lembar"]

  // Kalo Mode Edit, Tarik Data Lama
  useEffect(() => {
    if (idEdit) {
      const ambilDataLama = async () => {
        const { data } = await supabase.from('inventaris_produksi').select('*').eq('id', idEdit).single()
        if (data) setForm(data)
      }
      ambilDataLama()
    }
  }, [idEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = { ...form, jumlah_barang: parseInt(form.jumlah_barang) }
    let error

    if (idEdit) {
      // UPDATE
      const { error: err } = await supabase.from('inventaris_produksi').update(payload).eq('id', idEdit)
      error = err
    } else {
      // INSERT
      const { error: err } = await supabase.from('inventaris_produksi').insert([payload])
      error = err
    }

    if (error) {
      alert("Gagal: " + error.message)
    } else {
      alert(idEdit ? "Data berhasil diupdate! ✨" : "Barang baru tersimpan! ✅")
      router.push('/') // Balik ke dashboard
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 font-sans">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-blue-600 mb-2 flex items-center gap-1">
          ← Kembali ke Dashboard
        </button>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
          {idEdit ? "Edit Master Barang" : "Registrasi Barang Baru"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-3xl p-8 border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kode Barang (Unique)</label>
            <input value={form.kode_barang} onChange={e => setForm({...form, kode_barang: e.target.value})} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none font-mono text-sm" placeholder="Ex: PRD-001" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nama Barang</label>
            <input value={form.nama_barang} onChange={e => setForm({...form, nama_barang: e.target.value})} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none font-bold text-sm" placeholder="Nama Item" required />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Merek</label>
            <input value={form.merek_barang} onChange={e => setForm({...form, merek_barang: e.target.value})} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none text-sm" placeholder="Merek/Vendor" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Kategori</label>
            <select value={form.kategori_barang} onChange={e => setForm({...form, kategori_barang: e.target.value})} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 bg-white outline-none text-sm" required>
              <option value="">-- Pilih Kategori --</option>
              {daftarKategori.map((k, i) => <option key={i} value={k}>{k}</option>)}
            </select>
          </div>
          
          {/* Stok Awal (Hanya bisa diedit bebas pas awal, selanjutnya disarankan via Transaksi) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Stok Awal</label>
            <input type="number" value={form.jumlah_barang} onChange={e => setForm({...form, jumlah_barang: e.target.value})} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 outline-none font-black text-sm" />
            {idEdit && <p className="text-[9px] text-orange-500 mt-1">*Disarankan update stok lewat menu Transaksi</p>}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Satuan</label>
            <select value={form.satuan_barang} onChange={e => setForm({...form, satuan_barang: e.target.value})} className="w-full border-2 border-slate-100 p-3 rounded-xl focus:border-blue-500 bg-white outline-none text-sm" required>
              <option value="">-- Pilih Satuan --</option>
              {daftarSatuan.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:bg-slate-300">
            {loading ? "Menyimpan..." : idEdit ? "Simpan Perubahan" : "Simpan Barang Baru"}
          </button>
        </div>
      </form>
    </div>
  )
}