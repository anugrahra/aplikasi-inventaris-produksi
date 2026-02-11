"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Navbar() {
  const pathname = usePathname()
  const [showModal, setShowModal] = useState(false)

  // Style untuk link aktif vs tidak aktif
  const isActive = (path) => pathname === path 
    ? "text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-xl transition-all" 
    : "text-slate-500 font-medium hover:text-blue-600 hover:bg-slate-50 px-4 py-2 rounded-xl transition-all"

  return (
    <>
      {/* === DESKTOP NAVBAR (Fixed & Glass Effect) === */}
      <nav className="hidden md:block fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-100 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 md:px-10 h-20 flex justify-between items-center">
          
          {/* 1. LOGO (BISA DI-KLIK KE HOME) */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer hover:opacity-90 transition">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-slate-200 group-hover:scale-105 transition-transform">
              P
            </div>
            <span className="font-bold text-slate-800 text-lg tracking-tighter">
              PAC <span className="text-blue-600">System</span>
            </span>
          </Link>

          {/* 2. MENU KANAN (TANPA SEARCH BAR) */}
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <Link href="/" className={isActive('/')}>Gudang</Link>
              <Link href="/laporan" className={isActive('/laporan')}>Laporan</Link>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-200 mx-2"></div> {/* Pemisah Tipis */}

            <button 
              onClick={() => setShowModal(true)} 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-blue-200 shadow-lg hover:bg-slate-900 hover:shadow-slate-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              <span>Catat Transaksi</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Spacer biar konten ga ketutup navbar fixed */}
      <div className="hidden md:block"></div>


      {/* === MOBILE NAVBAR (BOTTOM) === */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-100 z-40 flex justify-around items-center py-3 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        <Link href="/" className="flex flex-col items-center gap-1 w-16 group">
          <svg className={`w-6 h-6 transition ${pathname === '/' ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className={`text-[10px] font-bold transition ${pathname === '/' ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}>Gudang</span>
        </Link>

        {/* Tombol Tengah Menonjol */}
        <div className="relative -top-6">
          <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-xl shadow-slate-300 flex items-center justify-center transform active:scale-95 transition-all border-[6px] border-white">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <Link href="/laporan" className="flex flex-col items-center gap-1 w-16 group">
          <svg className={`w-6 h-6 transition ${pathname === '/laporan' ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className={`text-[10px] font-bold transition ${pathname === '/laporan' ? 'text-blue-600' : 'text-slate-300 group-hover:text-slate-500'}`}>Laporan</span>
        </Link>
      </nav>

      {/* === MODAL TRANSAKSI (POPUP) === */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all animate-slideUp border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Transaksi Baru</h3>
                <p className="text-slate-400 text-xs font-medium mt-1">Pilih jenis pergerakan barang</p>
              </div>
              <button onClick={() => setShowModal(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Link href="/transaksi?tipe=masuk" onClick={() => setShowModal(false)} className="relative overflow-hidden flex flex-col items-center gap-4 p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all group">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
                <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-600">Barang Masuk</span>
              </Link>
              
              <Link href="/transaksi?tipe=keluar" onClick={() => setShowModal(false)} className="relative overflow-hidden flex flex-col items-center gap-4 p-5 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-lg hover:border-red-200 transition-all group">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                </div>
                <span className="font-bold text-slate-700 text-sm group-hover:text-red-600">Barang Keluar</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}