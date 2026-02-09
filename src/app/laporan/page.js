"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable' // Import sebagai fungsi

export default function LaporanPage() {
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchLaporan = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('riwayat_transaksi')
      .select(`
        *,
        inventaris_produksi (
          nama_barang,
          satuan_barang
        )
      `)
      .order('created_at', { ascending: false })

    if (error) console.error("Error ambil laporan:", error)
    else setTransaksi(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchLaporan()
  }, [])

  const formatTanggal = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // === JURUS EXPORT EXCEL ===
  const exportToExcel = () => {
    const dataUntukExcel = transaksi.map(log => ({
      Waktu: formatTanggal(log.created_at),
      Petugas: log.petugas,
      Barang: log.nama_barang,
      Tipe: log.jenis_transaksi,
      Jumlah: log.jumlah,
      Satuan: log.inventaris_produksi?.satuan_barang || '-',
      Keterangan: log.keterangan
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataUntukExcel)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Mutasi")
    XLSX.writeFile(workbook, `Laporan_Mutasi_PAC_${new Date().getTime()}.xlsx`)
  }

  // === JURUS EXPORT PDF ===
  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("LAPORAN MUTASI BARANG - PAC SYSTEM", 14, 15)
    doc.setFontSize(10)
    doc.text(`Dicetak pada: ${new Date().toLocaleString()}`, 14, 22)

    const tableColumn = ["Waktu", "Barang", "Tipe", "Qty", "Petugas"]
    const tableRows = transaksi.map(log => [
      formatTanggal(log.created_at),
      log.nama_barang,
      log.jenis_transaksi,
      `${log.jumlah} ${log.inventaris_produksi?.satuan_barang || ''}`,
      log.petugas.split('@')[0]
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] }
    })

    doc.save(`Laporan_PAC_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-sans">
      
      {/* Header & Export Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Log Mutasi Barang</h1>
          <p className="text-slate-500 text-sm font-medium">Rekaman jejak digital mutasi stok gudang.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={exportToExcel}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Excel
          </button>
          <button 
            onClick={exportToPDF}
            className="flex-1 md:flex-none bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            PDF
          </button>
          <button 
            onClick={fetchLaporan} 
            className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {/* Tabel Laporan */}
      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <th className="py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest">Waktu & Petugas</th>
                <th className="py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest">Barang</th>
                <th className="py-4 px-6 text-center font-black uppercase text-[10px] tracking-widest">Jenis</th>
                <th className="py-4 px-6 text-center font-black uppercase text-[10px] tracking-widest">Jumlah</th>
                <th className="py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center text-slate-400 animate-pulse font-medium italic">Sedang menyusun laporan...</td></tr>
              ) : transaksi.length > 0 ? (
                transaksi.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-700">{formatTanggal(log.created_at)}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-black mt-1 tracking-widest">{log.petugas?.split('@')[0]}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-slate-800">{log.nama_barang}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        log.jenis_transaksi === 'Masuk' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {log.jenis_transaksi}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-lg font-black ${log.jenis_transaksi === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {log.jenis_transaksi === 'Masuk' ? '+' : '-'}{log.jumlah}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium italic text-xs italic">
                        "{log.keterangan}"
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-20 text-center text-slate-300 italic font-medium tracking-widest uppercase text-[10px]">Belum ada riwayat transaksi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}