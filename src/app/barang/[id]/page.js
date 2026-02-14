"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/auth' 
import Link from 'next/link'

// LIBRARY EXPORT
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DetailBarangPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20 text-blue-600 font-bold animate-pulse">Memuat Data Detektif...</div>}>
      <DetailContent />
    </Suspense>
  )
}

function DetailContent() {
  const router = useRouter()
  const params = useParams()
  const { id } = params

  const [barang, setBarang] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [loading, setLoading] = useState(true)

  // === STATE FILTER DIAMOND ===
  const [filterMode, setFilterMode] = useState('BULANAN') // 'BULANAN' or 'CUSTOM'
  const [selectedBulan, setSelectedBulan] = useState(new Date().getMonth() + 1)
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // CONSTANTS
  const LIST_BULAN = [
    { id: 1, nama: 'Januari' }, { id: 2, nama: 'Februari' }, { id: 3, nama: 'Maret' },
    { id: 4, nama: 'April' }, { id: 5, nama: 'Mei' }, { id: 6, nama: 'Juni' },
    { id: 7, nama: 'Juli' }, { id: 8, nama: 'Agustus' }, { id: 9, nama: 'September' },
    { id: 10, nama: 'Oktober' }, { id: 11, nama: 'November' }, { id: 12, nama: 'Desember' }
  ]
  const currentYear = new Date().getFullYear()
  const LIST_TAHUN = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // 1. FETCH INFO BARANG
  useEffect(() => {
    const fetchBarang = async () => {
      const { data, error } = await supabase
        .from('inventaris_produksi')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        alert("Barang tidak ditemukan!")
        router.push('/')
      } else {
        setBarang(data)
        fetchRiwayat() 
      }
    }
    if (id) fetchBarang()
  }, [id])

  // 2. FETCH RIWAYAT (Bisa Dipanggil Ulang)
  const fetchRiwayat = async () => {
    setLoading(true)
    let query = supabase
      .from('riwayat_transaksi')
      .select('*')
      .eq('barang_id', id)
      .order('created_at', { ascending: false })

    // LOGIC FILTER
    if (filterMode === 'BULANAN') {
      const lastDay = new Date(selectedTahun, selectedBulan, 0).getDate()
      const startStr = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-01T00:00:00`
      const endStr = `${selectedTahun}-${String(selectedBulan).padStart(2, '0')}-${lastDay}T23:59:59`
      query = query.gte('created_at', startStr).lte('created_at', endStr)
    } else if (filterMode === 'CUSTOM') {
      if (startDate && endDate) {
        query = query.gte('created_at', `${startDate}T00:00:00`).lte('created_at', `${endDate}T23:59:59`)
      }
    }

    const { data, error } = await query
    if (error) console.error(error)
    else setRiwayat(data || [])
    
    setLoading(false)
  }

  const formatTanggal = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // === 🔥 LOGIC CEK KRITIS (SMART ALERT) ===
  const cekStatusStok = (item) => {
    if (!item) return 'aman' // Default

    // 1. Stok 0 (Habis) -> MERAH MUTLAK
    if (item.jumlah_barang === 0) return 'habis';

    // 2. Kategori Pipa & Fitting (< 5)
    if (item.kategori_barang === 'Material Perpipaan / Fitting' && item.jumlah_barang < 5) return 'kritis';

    // 3. Kategori Bahan Kimia (LOGIKA SPESIFIK)
    if (item.kategori_barang === 'Bahan Kimia Operasional') {
      const nama = item.nama_barang.toLowerCase();

      // A. High Volume Items (< 1000)
      if ((nama.includes('calcium hypochlorite') || nama.includes('pac 280')) && item.jumlah_barang < 1000) return 'kritis';
      // B. DPD No. 1 (Sisa <= 50)
      if (nama.includes('dpd no. 1') && item.jumlah_barang <= 50) return 'kritis';
      // C. Phenol Rapid Red (Sisa <= 5)
      if (nama.includes('phenol rapid red') && item.jumlah_barang <= 5) return 'kritis';
      // D. Aquades (Sisa <= 1)
      if (nama.includes('aquades') && item.jumlah_barang <= 1) return 'kritis';
    }

    return 'aman';
  }

  // === 🎨 EXPORT EXCEL ===
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Kartu Stok')

    // HEADER
    sheet.mergeCells('A1:E1')
    sheet.getCell('A1').value = 'KARTU RIWAYAT BARANG (BIN CARD)'
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true }
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }

    sheet.mergeCells('A2:E2')
    const periodeInfo = filterMode === 'BULANAN' 
      ? `${LIST_BULAN[selectedBulan-1].nama} ${selectedTahun}`
      : `${startDate} s/d ${endDate}`
    sheet.getCell('A2').value = `Item: ${barang.nama_barang} | Periode: ${periodeInfo}`
    sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' }

    sheet.addRow([])
    const headerRow = sheet.addRow(['Tanggal', 'Tipe', 'Jumlah', 'Keterangan', 'Petugas'])
    
    // Style Header
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })

    // Isi Data
    riwayat.forEach((log) => {
      const row = sheet.addRow([
        formatTanggal(log.created_at),
        log.jenis_transaksi,
        log.jumlah,
        log.keterangan,
        log.petugas.split('@')[0]
      ])
      const isMasuk = log.jenis_transaksi === 'Masuk'
      const warna = isMasuk ? 'FF16A34A' : 'FFDC2626'
      row.getCell(2).font = { color: { argb: warna }, bold: true }
      row.getCell(3).font = { color: { argb: warna }, bold: true }
    })

    sheet.columns = [{ width: 22 }, { width: 15 }, { width: 10 }, { width: 45 }, { width: 20 }]
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `BinCard_${barang.kode_barang}.xlsx`)
  }

  // === 📄 EXPORT PDF ===
  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(14); doc.setFont("helvetica", "bold")
    doc.text("KARTU RIWAYAT BARANG", 105, 15, { align: "center" })
    doc.setFontSize(10); doc.setFont("helvetica", "normal")
    
    const periodeInfo = filterMode === 'BULANAN' 
      ? `${LIST_BULAN[selectedBulan-1].nama} ${selectedTahun}`
      : `${startDate} s/d ${endDate}`
    doc.text(`Periode Laporan: ${periodeInfo}`, 105, 20, { align: "center" })

    doc.line(14, 25, 196, 25)
    doc.text(`Item: ${barang.nama_barang}`, 14, 32)
    doc.text(`Stok Saat Ini: ${barang.jumlah_barang} ${barang.satuan_barang}`, 196, 32, { align: "right" })

    const tableRows = riwayat.map(log => [
      formatTanggal(log.created_at),
      log.jenis_transaksi.toUpperCase(),
      `${log.jenis_transaksi === 'Masuk' ? '+' : '-'}${log.jumlah}`,
      log.keterangan,
      log.petugas.split('@')[0]
    ])

    autoTable(doc, {
      head: [["Tanggal", "Tipe", "Qty", "Keterangan", "Petugas"]],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] }
    })
    doc.save(`BinCard_${barang.kode_barang}.pdf`)
  }

  if (!barang) return null

  // Tentukan Status Stok
  const statusStok = cekStatusStok(barang);
  const warnaStok = statusStok === 'aman' ? 'text-emerald-600' : 'text-red-600 animate-pulse';

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 font-sans min-h-screen">
      
      {/* HEADER & TOMBOL BACK */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-blue-600 flex items-center gap-1 transition font-bold">
            ← Kembali ke Gudang
          </button>
          
          <div className="flex gap-2">
            <button onClick={exportToExcel} disabled={riwayat.length === 0} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition disabled:opacity-50">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel
            </button>
            <button onClick={exportToPDF} disabled={riwayat.length === 0} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition disabled:opacity-50">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
          </div>
        </div>

        {/* INFO BARANG UTAMA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{barang.nama_barang}</h1>
            <p className="text-slate-500 font-mono text-sm mt-1 flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold">{barang.kode_barang}</span>
              <span>• {barang.merek_barang || 'Tanpa Merek'}</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest text-right">Sisa Stok Total</p>
            {/* --- PENERAPAN LOGIC SMART ALERT DISINI --- */}
            <p className={`text-3xl font-black text-right ${warnaStok}`}>
              {barang.jumlah_barang} <span className="text-sm text-slate-400 font-bold">{barang.satuan_barang}</span>
            </p>
            {statusStok === 'habis' && <p className="text-[9px] text-red-500 font-bold text-right mt-1">⚠️ STOK HABIS</p>}
            {statusStok === 'kritis' && <p className="text-[9px] text-red-500 font-bold text-right mt-1">⚠️ STOK MENIPIS</p>}
          </div>
        </div>
      </div>

      {/* === FILTER SECTION === */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
        <div className="flex gap-4 mb-4">
          <button onClick={() => setFilterMode('BULANAN')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filterMode === 'BULANAN' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}>
            Per Bulan
          </button>
          <button onClick={() => setFilterMode('CUSTOM')} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${filterMode === 'CUSTOM' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-100' : 'text-slate-400 hover:text-slate-600'}`}>
            Custom Tanggal
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          {filterMode === 'BULANAN' ? (
            <>
              <div className="w-full md:w-48">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold mt-1 focus:ring-2 focus:ring-blue-100 outline-none" value={selectedBulan} onChange={(e) => setSelectedBulan(parseInt(e.target.value))}>
                  {LIST_BULAN.map(b => <option key={b.id} value={b.id}>{b.nama}</option>)}
                </select>
              </div>
              <div className="w-full md:w-32">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun</label>
                <select className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold mt-1 focus:ring-2 focus:ring-blue-100 outline-none" value={selectedTahun} onChange={(e) => setSelectedTahun(parseInt(e.target.value))}>
                  {LIST_TAHUN.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </>
          ) : (
            <>
              <div className="w-full md:w-40">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dari</label>
                <input type="date" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold mt-1 focus:ring-2 focus:ring-blue-100 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="w-full md:w-40">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sampai</label>
                <input type="date" className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold mt-1 focus:ring-2 focus:ring-blue-100 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </>
          )}
          
          <button onClick={fetchRiwayat} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            Tampilkan
          </button>
        </div>
      </div>

      {/* === LIST RIWAYAT === */}
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-3">
        Kartu Stok Digital
      </h3>
      
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        {loading ? (
           <div className="p-10 text-center text-blue-500 font-bold animate-pulse">Sedang memfilter data...</div>
        ) : riwayat.length > 0 ? (
          <div className="divide-y divide-slate-50">
            {riwayat.map((log) => (
              <div key={log.id} className="p-5 hover:bg-slate-50 transition flex items-start gap-4 group">
                <div className={`mt-1 w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  log.jenis_transaksi === 'Masuk' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {log.jenis_transaksi === 'Masuk' 
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    }
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition">
                      {log.jenis_transaksi === 'Masuk' ? 'Penerimaan Barang' : 'Pengambilan Barang'}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide font-mono">
                      {formatTanggal(log.created_at)}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex justify-between items-end">
                    <p className="text-xs text-slate-500 font-medium italic max-w-md">"{log.keterangan}"</p>
                    <p className={`font-black text-lg ${log.jenis_transaksi === 'Masuk' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {log.jenis_transaksi === 'Masuk' ? '+' : '-'}{log.jumlah}
                    </p>
                  </div>
                  
                  <p className="text-[9px] text-slate-300 mt-2 uppercase font-black tracking-wider flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {log.petugas?.split('@')[0]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="bg-slate-50 p-4 rounded-full mb-3">
               <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <p className="text-slate-400 italic text-sm font-medium">Tidak ada transaksi pada periode ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}