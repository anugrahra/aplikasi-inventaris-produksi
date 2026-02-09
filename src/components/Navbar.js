"use client"
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

// Kita pisah komponen Search biar aman (Best Practice Next.js)
function SearchBar() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (term) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('q', term)
    } else {
      params.delete('q')
    }
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative hidden md:block">
      <input 
        type="text" 
        placeholder="Cari barang (nama/kode)..." 
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q')?.toString()}
        className="bg-gray-100 border-none rounded-full px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none transition pl-10"
      />
      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  )
}

export default function Navbar() {
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)

  const isActive = (path) => pathname === path ? "text-blue-600 font-bold" : "text-gray-400 hover:text-blue-500"

  return (
    <>
      {/* === DESKTOP NAVBAR === */}
      <nav className="hidden md:flex fixed top-0 w-full bg-white border-b border-gray-100 z-50 px-10 py-4 justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">P</div>
          <span className="font-bold text-slate-800 tracking-tight">PAC <span className="text-blue-600">System</span></span>
        </div>

        <div className="flex gap-8 items-center">
          <Link href="/" className={isActive('/')}>Gudang Utama</Link>
          <Link href="/laporan" className={isActive('/laporan')}>Laporan</Link>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-blue-200 shadow-lg hover:bg-blue-700 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Catat Transaksi
          </button>
        </div>

        <Suspense fallback={<div>Loading search...</div>}>
          <SearchBar />
        </Suspense>
      </nav>

      {/* === MOBILE NAVBAR === */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 z-40 flex justify-around items-center py-3 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center gap-1 w-16">
          <svg className={`w-6 h-6 ${pathname === '/' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className={`text-[10px] font-bold ${pathname === '/' ? 'text-blue-600' : 'text-gray-400'}`}>Gudang</span>
        </Link>

        <div className="relative -top-6">
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg shadow-blue-300 flex items-center justify-center transform active:scale-90 transition-all border-4 border-gray-50">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <Link href="/laporan" className="flex flex-col items-center gap-1 w-16">
          <svg className={`w-6 h-6 ${pathname === '/laporan' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className={`text-[10px] font-bold ${pathname === '/laporan' ? 'text-blue-600' : 'text-gray-400'}`}>Laporan</span>
        </Link>
      </nav>

      {/* === MODAL TRANSAKSI === */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Pilih Jenis Transaksi</h3>
              <button onClick={() => setShowModal(false)} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/transaksi?tipe=masuk" onClick={() => setShowModal(false)} className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all group">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-emerald-200 shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
                <span className="font-bold text-emerald-800 text-sm">Barang Masuk</span>
              </Link>
              <Link href="/transaksi?tipe=keluar" onClick={() => setShowModal(false)} className="flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-red-100 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all group">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-red-200 shadow-md group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </div>
                <span className="font-bold text-red-800 text-sm">Barang Keluar</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}