"use client" // Tambahkan ini di paling atas
import "./globals.css";
import Navbar from "../components/Navbar"; 
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }) {
  const pathname = usePathname()
  
  // LOGIKA: Kalau di halaman login, jangan munculin Navbar
  const isLoginPage = pathname === '/login'

  return (
    <html lang="id">
      <body className="bg-gray-50 text-slate-900">
        {!isLoginPage && <Navbar />}
        
        {/* Atur padding: kalau login gak usah pake padding top navbar */}
        <main className={`${!isLoginPage ? 'pt-20 pb-24 md:pb-10' : ''} min-h-screen`}>
          {children}
        </main>
      </body>
    </html>
  );
}