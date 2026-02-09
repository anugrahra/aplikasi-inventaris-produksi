"use client"
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white font-sans">
      
      {/* SISI KIRI: Visual/Branding (Hidden on Mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 items-center justify-center p-20 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-blue-400 rounded-full blur-[120px] opacity-20"></div>
        
        <div className="relative z-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl mb-8 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-500/50">P</div>
          <h1 className="text-5xl font-black text-white leading-none tracking-tighter uppercase italic">
            Production <br /> 
            <span className="text-blue-500">Asset</span> Control
          </h1>
          <p className="mt-6 text-slate-400 max-w-sm font-medium leading-relaxed">
            Sistem pemantauan inventaris terpadu untuk efisiensi operasional dan akurasi data aset produksi.
          </p>
          
          <div className="mt-12 flex gap-4">
            <a 
              href="https://heyanugrah.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 font-bold uppercase tracking-widest hover:border-blue-500 hover:text-white transition-all"
            >
              Powered by <span className="text-white">H▲A</span>
            </a>
          </div>
        </div>
      </div>

      {/* SISI KANAN: Form Login */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-24 bg-gray-50/30">
        <div className="w-full max-w-sm">
          {/* Logo Mobile Only */}
          <div className="md:hidden flex items-center gap-2 mb-10">
            <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <span className="font-black text-slate-900 tracking-tighter uppercase">PAC System</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Login System</h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">Masukkan kredensial operator Anda untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
              <input 
                type="email" 
                placeholder="nama@perusahaan.com"
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:ring-0 transition-all outline-none text-sm font-bold text-slate-700"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-blue-600 focus:ring-0 transition-all outline-none text-sm font-bold text-slate-700"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-200 hover:bg-blue-600 hover:shadow-blue-200 transition-all active:scale-95 disabled:bg-slate-300"
            >
              {loading ? "Autentikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
              © 2026 BLUD Air Minum Kota Cimahi. <br />
              Urusan Produksi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}