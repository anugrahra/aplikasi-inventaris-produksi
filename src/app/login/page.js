"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const useRouterNavigation = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else useRouterNavigation.push('/') // Balik ke dashboard kalau sukses
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('Cek email lo buat konfirmasi (kalau konfirmasi email aktif)!')
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <form className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">Login Inv Prod 🔐</h1>
        <input type="email" placeholder="Email" className="border w-full p-2 mb-4 rounded" 
          onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="border w-full p-2 mb-6 rounded" 
          onChange={(e) => setPassword(e.target.value)} />
        
        <button onClick={handleLogin} className="bg-blue-600 text-white w-full py-2 rounded mb-2 hover:bg-blue-700">
          Sign In
        </button>
        <button onClick={handleSignUp} className="text-blue-600 text-sm w-full text-center hover:underline">
          Belum punya akun? Daftar dulu
        </button>
      </form>
    </div>
  )
}