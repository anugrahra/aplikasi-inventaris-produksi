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
  const tipe = searchParams.get('tipe') 
  
  const isMasuk = tipe === 'masuk'
  const themeColor = isMasuk ? 'emerald' : 'red'
  const title = isMasuk ? 'Barang Masuk (Inbound)' : 'Barang Keluar (Outbound)'

  const [items, setItems] = useState([])
  const [userEmail, setUserEmail] = useState('') 
  
  const [selectedId, setSelectedId] = useState('')
  const [qty, setQty] = useState('')
  const [keterangan, setKeterangan] = useState('')

  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(false)
  
  // State UI
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false) // State baru buat animasi sukses
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserEmail(user.email)
      
      const { data } = await supabase
        .from('inventaris_produksi')
        .select('*')
        .order('nama_barang', { ascending: true })
      setItems(data || [])
    }
    initData()
  }, [])

  const getMasterItem = (id) => items.find(i => String(i.id) === String(id))
  const currentSelection = getMasterItem(selectedId)

  // === 🔔 FUNGSI TOAST (VALIDASI ERROR) ===
  const showToast = (msg, type = 'error') => {
    setToast({ show: true, message: msg, type })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }))
    }, 3000)
  }

  const addToCart = () => {
    if (!selectedId) return showToast("Pilih barang terlebih dahulu!", "error")
    if (qty <= 0) return showToast("Jumlah minimal 1!", "error")
    
    if (cart.some(item => item.id === selectedId)) {
      return showToast("Barang ini sudah ada di daftar!", "error")
    }

    if (!isMasuk && currentSelection.jumlah_barang < parseInt(qty)) {
      return showToast(`Stok kurang! Sisa barang hanya ${currentSelection.jumlah_barang}`, "error")
    }

    const newItem = {
      id: selectedId,
      nama: currentSelection.nama_barang,
      satuan: currentSelection.satuan_barang,
      qty: parseInt(qty),
      ket: keterangan || '-',
      oldStok: currentSelection.jumlah_barang 
    }

    setCart([...cart, newItem])
    setSelectedId('')
    setQty('')
    setKeterangan('')
    showToast("Item ditambahkan ke daftar", "success")
  }

  const removeFromCart = (index) => {
    const newCart = [...cart]
    newCart.splice(index, 1)
    setCart(newCart)
  }

  const handlePreSubmit = () => {
    if (cart.length === 0) return showToast("Keranjang kosong!", "error")
    setShowConfirmModal(true)
  }

  // === EKSEKUSI FINAL DENGAN ANIMASI ===
  const handleFinalSubmit = async () => {
    setLoading(true)

    try {
      for (const item of cart) {
        const newStok = isMasuk ? item.oldStok + item.qty : item.oldStok - item.qty

        // A. Update Stok
        const { error: updateError } = await supabase
          .from('inventaris_produksi')
          .update({ jumlah_barang: newStok })
          .eq('id', item.id)
        
        if (updateError) throw new Error(`Gagal update stok ${item.nama}`)

        // B. Catat Log
        const { error: logError } = await supabase
          .from('riwayat_transaksi')
          .insert([{
            barang_id: item.id,
            nama_barang: item.nama,
            jenis_transaksi: isMasuk ? 'Masuk' : 'Keluar',
            jumlah: item.qty,
            keterangan: item.ket,
            petugas: userEmail
          }])
        
        if (logError) throw new Error(`Gagal catat log ${item.nama}`)
      }

      // SUKSES! Jangan tutup modal, tapi ubah jadi "Success View"
      setLoading(false)
      setIsSuccess(true) 

      // Delay 1.5 detik buat nikmatin animasi centang ijo, baru pindah
      setTimeout(() => {
        router.push('/')
      }, 1500)

    } catch (error) {
      showToast(error.message, "error")
      setLoading(false)
      setShowConfirmModal(false)
    }
  }

  return (
    <div className={`max-w-2xl mx-auto p-6 mt-10 bg-white rounded-3xl shadow-xl border-t-8 border-${themeColor}-500 mb-20 relative`}>
      
      {/* === TOAST NOTIFICATION (ERROR / INFO) === */}
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

      <h1 className={`text-2xl font-black mb-6 text-${themeColor}-600 uppercase tracking-tighter flex justify-between items-center`}>
        <span>{title}</span>
        <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold">v1.3 Final</span>
      </h1>

      {/* === FORM INPUT === */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Input Item</h3>
        
        <div>
          <select 
            className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 bg-white focus:border-blue-500 outline-none"
            onChange={(e) => setSelectedId(e.target.value)}
            value={selectedId}
          >
            <option value="" disabled>-- Pilih Barang --</option>
            {items.map(item => (
              <option key={item.id} value={item.id}>
                {item.nama_barang} (Sisa: {item.jumlah_barang})
              </option>
            ))}
          </select>
        </div>

        {currentSelection && (
           <div className={`text-xs font-bold px-3 py-2 rounded-lg flex justify-between ${isMasuk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
             <span>Stok Sistem:</span>
             <span>{currentSelection.jumlah_barang} {currentSelection.satuan_barang}</span>
           </div>
        )}

        <div className="flex gap-4">
          <div className="flex-1">
            <input 
              type="number" 
              placeholder="Qty"
              className="w-full p-3 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToCart()}
            />
          </div>
          <div className="flex-[2]">
            <input 
              type="text" 
              placeholder="Keterangan (Opsional)"
              className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addToCart()}
            />
          </div>
        </div>

        <button 
          type="button"
          onClick={addToCart}
          disabled={cart.length >= 10}
          className={`w-full py-3 rounded-xl font-bold text-white shadow-sm transition transform active:scale-95 flex justify-center items-center gap-2
            ${isMasuk ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}
            disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          {cart.length >= 10 ? 'Maksimal 10 Item' : 'Tambah ke Daftar'}
        </button>
      </div>

      {/* === KERANJANG === */}
      {cart.length > 0 ? (
        <div className="mb-8 animate-fadeIn">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
            <span>Daftar Transaksi</span>
            <span className="text-slate-800">{cart.length} Item</span>
          </h3>
          <div className="space-y-3">
            {cart.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{item.nama}</p>
                  <p className="text-xs text-slate-400 italic">Ket: {item.ket}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-black text-lg ${isMasuk ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.qty} <span className="text-xs font-normal text-slate-400">{item.satuan}</span>
                  </span>
                  <button onClick={() => removeFromCart(index)} className="text-slate-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-300 italic text-sm border-2 border-dashed border-slate-100 rounded-2xl mb-6">
          Belum ada barang di daftar.
        </div>
      )}

      {/* === FOOTER BUTTONS === */}
      <div className="flex gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={() => router.back()} className="flex-1 py-4 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition">
          BATAL
        </button>
        <button 
          onClick={handlePreSubmit}
          disabled={cart.length === 0}
          className={`flex-[2] py-4 rounded-xl font-bold text-white shadow-lg transform active:scale-95 transition-all flex justify-center items-center gap-2
            ${isMasuk ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}
            disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed`}
        >
          PROSES SEMUA
        </button>
      </div>

      {/* === MODAL POP-UP (CONFIRM & SUCCESS) === */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-8 transform transition-all scale-100 animate-in zoom-in duration-200 border border-white/20">
            
            {/* LOGIC TAMPILAN: SUKSES VS KONFIRMASI */}
            {isSuccess ? (
              // === TAMPILAN SUKSES (CINEMATIC) ===
              <div className="flex flex-col items-center justify-center py-6 text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-xl animate-bounce">
                  <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2">Berhasil Disimpan!</h3>
                <p className="text-slate-500 font-medium">Stok & Log transaksi sudah diperbarui.</p>
                <p className="text-xs text-slate-400 mt-6 animate-pulse">Mengalihkan ke dashboard...</p>
              </div>
            ) : (
              // === TAMPILAN KONFIRMASI (NORMAL) ===
              <>
                <div className={`flex flex-col items-center text-center mb-6 ${isMasuk ? 'text-emerald-600' : 'text-red-600'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${isMasuk ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Konfirmasi Transaksi</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    Anda yakin memproses <strong className="text-slate-800">{cart.length} barang</strong> ini?
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 mb-8 max-h-60 overflow-y-auto border border-slate-100">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                      <div className="text-left">
                        <p className="text-xs font-bold text-slate-700">{item.nama}</p>
                        <p className="text-[10px] text-slate-400 truncate w-32">{item.ket}</p>
                      </div>
                      <div className={`text-sm font-black ${isMasuk ? 'text-emerald-600' : 'text-red-600'}`}>
                        {isMasuk ? '+' : '-'}{item.qty} {item.satuan}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowConfirmModal(false)}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-white border-2 border-slate-100 hover:bg-slate-50 transition"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className={`flex-[2] py-3 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition transform active:scale-95
                      ${isMasuk ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                      disabled:opacity-70 disabled:cursor-wait`}
                  >
                    {loading ? "Memproses..." : "Ya, Proses!"}
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