"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useRouter } from 'next/navigation' 

export default function LaporanPage() {
  const router = useRouter()
  const [transaksi, setTransaksi] = useState([])
  const [loading, setLoading] = useState(false)

  // === STATE FILTER ===
  const [filterMode, setFilterMode] = useState('BULANAN') 
  
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1)
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear())

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const LIST_BULAN = [
    { id: 1, nama: 'Januari' }, { id: 2, nama: 'Februari' }, { id: 3, nama: 'Maret' },
    { id: 4, nama: 'April' }, { id: 5, nama: 'Mei' }, { id: 6, nama: 'Juni' },
    { id: 7, nama: 'Juli' }, { id: 8, nama: 'Agustus' }, { id: 9, nama: 'September' },
    { id: 10, nama: 'Oktober' }, { id: 11, nama: 'November' }, { id: 12, nama: 'Desember' }
  ]

  const currentYear = new Date().getFullYear()
  const LIST_TAHUN = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // === FETCH DATA ===
  const fetchLaporan = async () => {
    setLoading(true)
    
    let query = supabase
      .from('riwayat_transaksi')
      .select(`
        *,
        inventaris_produksi (
          nama_barang,
          satuan_barang
        )
      `)
      .order('created_at', { ascending: false })

    // LOGIC FILTER
    if (filterMode === 'BULANAN') {
      const startStr = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-01T00:00:00`
      const lastDay = new Date(selectedTahun, selectedBulan, 0).getDate() 
      const endStr = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${lastDay}T23:59:59`

      query = query.gte('created_at', startStr).lte('created_at', endStr)
    
    } else if (filterMode === 'CUSTOM') {
      if (!startDate || !endDate) {
        alert("Harap isi tanggal mulai dan akhir!")
        setLoading(false)
        return
      }
      query = query.gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${endDate}T23:59:59`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error ambil laporan:", error)
      alert("Gagal memuat data laporan")
    } else {
      setTransaksi(data || [])
    }
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

  // === EXPORT EXCEL ===
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
    
    const periodName = filterMode === 'BULANAN' 
      ? `${LIST_BULAN[selectedBulan-1].nama}_${selectedTahun}` 
      : `Custom_${startDate}_sd_${endDate}`
      
    XLSX.writeFile(workbook, `Laporan_PAC_${periodName}.xlsx`)
  }

  // === EXPORT PDF ===
  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("LAPORAN MUTASI BARANG - PAC SYSTEM", 14, 15)
    doc.setFontSize(10)
    
    const periode = filterMode === 'BULANAN' 
      ? `Periode: ${LIST_BULAN[selectedBulan-1].nama} ${selectedTahun}`
      : `Periode: ${startDate} s/d ${endDate}`
      
    doc.text(periode, 14, 22)
    doc.text(`Total Transaksi: ${transaksi.length}`, 14, 27)

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
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175] }
    })

    doc.save(`Laporan_PAC_${new Date().getTime()}.pdf`)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-10 font-sans min-h-screen">
      
      {/* HEADER JUDUL */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">
          Laporan <span className="text-blue-600">Transaksi</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">Rekapitulasi keluar masuk barang gudang.</p>
      </div>

      {/* === FILTER CONTROLLER === */}
      <div className="bg-white p-6 rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 mb-8">
        
        {/* 1. SWITCHER MODE */}
        <div className="flex gap-4 mb-6 border-b border-slate-100 pb-4">
          <button 
            onClick={() => setFilterMode('BULANAN')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterMode === 'BULANAN' ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Mode Bulanan
          </button>
          <button 
            onClick={() => setFilterMode('CUSTOM')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterMode === 'CUSTOM' ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Rentang Tanggal
          </button>
        </div>

        {/* 2. INPUT AREA */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          
          {filterMode === 'BULANAN' ? (
            <>
              <div className="w-full md:w-48">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pilih Bulan</label>
                <select 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition"
                  value={selectedBulan}
                  onChange={(e) => setSelectedBulan(parseInt(e.target.value))}
                >
                  {LIST_BULAN.map(b => (
                    <option key={b.id} value={b.id}>{b.nama}</option>
                  ))}
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tahun</label>
                <select 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition"
                  value={selectedTahun}
                  onChange={(e) => setSelectedTahun(parseInt(e.target.value))}
                >
                  {LIST_TAHUN.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="w-full md:w-48">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dari Tanggal</label>
                <input 
                  type="date" 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="hidden md:block pb-4 text-slate-300 font-black">/</div>
              <div className="w-full md:w-48">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sampai Tanggal</label>
                <input 
                  type="date" 
                  className="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 transition"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {/* TOMBOL EKSEKUSI */}
          <button 
            onClick={fetchLaporan}
            className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg hover:shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Tampilkan Data
          </button>

        </div>
      </div>

      {/* HASIL FILTER & EXPORT */}
      <div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden min-h-[400px]">
        
        {/* Toolbar Export */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-black text-slate-700 uppercase tracking-tight text-sm">
            Hasil: {transaksi.length} Transaksi Ditemukan
          </h3>
          <div className="flex gap-2">
            <button onClick={exportToExcel} disabled={transaksi.length === 0} className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-200 disabled:opacity-50 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </button>
            <button onClick={exportToPDF} disabled={transaksi.length === 0} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 disabled:opacity-50 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-white text-slate-400 border-b border-slate-100">
                <th className="py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest">Waktu & Petugas</th>
                <th className="py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest">Barang</th>
                <th className="py-4 px-6 text-center font-black uppercase text-[10px] tracking-widest">Jenis</th>
                <th className="py-4 px-6 text-center font-black uppercase text-[10px] tracking-widest">Jumlah</th>
                <th className="py-4 px-6 text-left font-black uppercase text-[10px] tracking-widest">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan="5" className="py-20 text-center text-blue-500 animate-pulse font-bold">Memuat data transaksi...</td></tr>
              ) : transaksi.length > 0 ? (
                transaksi.map((log) => (
                  <tr 
                    key={log.id} 
                    // === JURUS UX: KLIK BARIS ===
                    onClick={() => router.push(`/barang/${log.barang_id}`)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer border-b border-slate-50 last:border-0"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-700">{formatTanggal(log.created_at)}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-black mt-1 tracking-widest">{log.petugas?.split('@')[0]}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-black text-slate-800">
                        {log.nama_barang}
                      </div>
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
                      <span className="text-[10px] text-slate-400 font-bold ml-1">{log.inventaris_produksi?.satuan_barang}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-medium italic text-xs">
                        "{log.keterangan}"
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="py-20 text-center text-slate-400 font-medium">Tidak ada data untuk periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}