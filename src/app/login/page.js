"use client"
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800 font-sans relative overflow-hidden p-6">
      
      {/* BACKGROUND EFFECTS (Grande Atmosphere) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-500 opacity-20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-400 opacity-10 rounded-full blur-[100px]"></div>
      </div>

      {/* LOGIN CARD (LEBAR & GRANDE) */}
      <div className="relative z-10 w-full max-w-3xl"> {/* Lebar Max 3XL biar lega */}
        <div className="bg-white/90 backdrop-blur-2xl rounded-[40px] shadow-2xl shadow-black/50 overflow-hidden flex flex-col md:flex-row border border-white/20">
          
          {/* SISI KIRI: Visual & Branding (Biru) */}
          <div className="md:w-5/12 bg-gradient-to-br from-blue-600 to-cyan-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
            {/* Dekorasi Pattern */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                {/* LOGO GUDANG (BOX/KUBUS) - Bukan Kimia */}
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">
                Sistem<br/>Gudang
              </h2>
              <p className="mt-4 text-blue-100 text-xs font-medium leading-relaxed opacity-90">
                Platform terintegrasi pengelolaan aset dan logistik BLUD Air Minum.
              </p>
            </div>

            <div className="relative z-10 mt-10 md:mt-0">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">BLUD Air Minum Kota Cimahi</p>
            </div>
          </div>

          {/* SISI KANAN: Form Login (Putih Lega) */}
          <div className="md:w-7/12 p-10 md:p-14 bg-white">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Selamat Datang</h3>
              <p className="text-slate-500 text-sm mt-2">Silakan masuk untuk mengakses dashboard.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Email Akses</label>
                <input 
                  type="email" 
                  placeholder="admin@gudangblud.com"
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none text-sm font-bold text-slate-700 placeholder-slate-300"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full p-4 pr-12 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-blue-500 focus:bg-white transition-all outline-none text-sm font-bold text-slate-700 placeholder-slate-300"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-slate-900 text-white p-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-70 disabled:translate-y-0"
                >
                  {loading ? "Memverifikasi..." : "Masuk Aplikasi"}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <span>© 2026 BLUD Air Minum</span>
              <span>v1.3 Demo</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}