import "./globals.css";
// Import Navbar yang baru lo buat
import Navbar from "../components/Navbar"; 

export const metadata = {
  title: "Asset Control | Inventaris Produksi",
  description: "Sistem Pemantauan Inventaris Operasional Produksi & Warehouse",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-50">
        {/* Pasang Navbar di sini, di atas children */}
        <Navbar />
        
        {/* Tambahkan padding biar konten nggak ketutup navbar */}
        <main className="pt-20 pb-24 md:pb-10 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}