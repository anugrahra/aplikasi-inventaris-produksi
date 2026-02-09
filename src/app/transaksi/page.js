"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function TransaksiPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-20"><span className="loading loading-spinner text-blue-500"></span></div>}>
      <FormTransaksi />
    </Suspense>
  )
}

function FormTransaksi() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipe = searchParams.get('tipe') // "masuk" atau "keluar"
  
  // Tentukan tema
  const isMasuk = tipe === 'masuk'
  const themeColor = isMasuk ? 'emerald' : 'red'
  const title = isMasuk ? 'Barang Masuk (Inbound)' : 'Barang Keluar (Outbound)'

  const [items, setItems] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [qty, setQty] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [loading, setLoading] = useState(false)
  const [userEmail, setUserEmail] = useState('') 

  // 1. Ambil User & Data Barang
  useEffect(() => {
    const initData = async () => {
      // Cek User
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email)
      
      // Ambil Barang
      const { data } = await supabase
        .from('inventaris_produksi')
        .select('*')
        .order('nama_barang', { ascending: true })
      setItems(data || [])
    }
    initData()
  }, [])

  // 2. Cari Item yang Sedang Dipilih (FIXED LOGIC)
  // Kita pakai String() biar "10" (teks) dianggap sama dengan 10 (angka)
  const selectedItem = items.find(i => String(i.id) === String(selectedId))

  // 3. LOGIKA "DOUBLE ACTION" (Update + Catat)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (!selectedItem) { alert("Pilih barang dulu bos!"); setLoading(false); return }
    if (qty <= 0) { alert("Jumlah minimal 1!"); setLoading(false); return }

    // Hitung stok baru
    const currentStok = selectedItem.jumlah_barang
    const inputQty = parseInt(qty)
    
    // Validasi stok minus
    if (!isMasuk && currentStok < inputQty) {
      alert(`Stok kurang! Sisa cuma ${currentStok} ${selectedItem.satuan_barang}`)
      setLoading(false)
      return
    }

    const newStok = isMasuk ? currentStok + inputQty : currentStok - inputQty

    // --- AKSI 1: Update Stok Barang ---
    const { error: updateError } = await supabase
      .from('inventaris_produksi')
      .update({ jumlah_barang: newStok })
      .eq('id', selectedId)

    if (updateError) {
      alert("Gagal update stok: " + updateError.message)
      setLoading(false)
      return
    }

    // --- AKSI 2: Catat ke Buku Riwayat ---
    const { error: logError } = await supabase
      .from('riwayat_transaksi')
      .insert([{
        barang_id: selectedId, // Supabase pintar, dia bakal convert string ke bigint otomatis
        nama_barang: selectedItem.nama_barang,
        jenis_transaksi: isMasuk ? 'Masuk' : 'Keluar',
        jumlah: inputQty,
        keterangan: keterangan || '-',
        petugas: userEmail
      }])

    if (logError) {
      console.error("Gagal catat log:", logError)
    }

    alert(`✅ Transaksi Berhasil!\nStok ${selectedItem.nama_barang} sekarang: ${newStok}`)
    router.push('/') // Balik ke dashboard
  }

  return (
    <div className={`max-w-xl mx-auto p-6 mt-10 bg-white rounded-3xl shadow-xl border-t-8 border-${themeColor}-500`}>
      <h1 className={`text-2xl font-black mb-6 text-${themeColor}-600 uppercase tracking-tighter`}>
        {title}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Dropdown Pilih Barang */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Pilih Barang</label>
          <select 
            className="w-full p-4 border-2 border-gray-100 rounded-xl font-bold text-gray-700 focus:border-blue-500 outline-none bg-white"
            onChange={(e) => setSelectedId(e.target.value)}
            value={selectedId}
            required
          >
            <option value="" disabled>-- Cari Barang --</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.nama_barang} (Stok: {item.jumlah_barang} {item.satuan_barang})
              </option>
            ))}
          </select>
        </div>

        {/* Info Stok (Muncul Realtime - SUDAH DIPERBAIKI) */}
        {selectedItem && (
          <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center text-blue-800 animate-fadeIn">
            <span className="text-sm font-medium">Stok Gudang:</span>
            <span className="text-xl font-black">
              {selectedItem.jumlah_barang} 
              <span className="text-xs ml-1 font-normal">{selectedItem.satuan_barang}</span>
            </span>
          </div>
        )}

        {/* Input Jumlah */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Jumlah {isMasuk ? 'Diterima' : 'Diambil'}</label>
          <input 
            type="number" 
            placeholder="0"
            className={`w-full p-4 border-2 border-gray-100 rounded-xl text-3xl font-black text-${themeColor}-600 focus:border-${themeColor}-500 outline-none transition`}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            required
          />
        </div>

        {/* Keterangan */}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Keterangan / Peruntukan</label>
          <textarea 
            rows="2"
            placeholder={isMasuk ? "Ex: Pembelian PO-234 dari Vendor X" : "Ex: Dipakai untuk perbaikan Panel Listrik B"}
            className="w-full p-3 border-2 border-gray-100 rounded-xl text-sm font-medium focus:border-blue-500 outline-none"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            required
          ></textarea>
        </div>

        {/* Tombol Eksekusi */}
        <div className="flex gap-3 pt-4">
          <button 
            type="button" 
            onClick={() => router.back()} 
            className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
          >
            BATAL
          </button>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all
              ${isMasuk ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
              disabled:bg-gray-300 disabled:shadow-none`}
          >
            {loading ? "Menyimpan & Mencatat..." : "KONFIRMASI TRANSAKSI"}
          </button>
        </div>

      </form>
    </div>
  )
}