"use client"
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { isAdmin } from '../../../lib/auth' // <--- KITA PAKE INI SEKARANG
import Link from 'next/link'

// GANTI LIBRARY EXPORT DI SINI
import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function DetailBarangPage() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Memuat Data Detektif...</div>}>
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

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      
      const { data: dataBarang, error: errBarang } = await supabase
        .from('inventaris_produksi')
        .select('*')
        .eq('id', id)
        .single()

      if (errBarang) {
        alert("Barang tidak ditemukan!")
        router.push('/')
        return
      }
      setBarang(dataBarang)

      const { data: dataLog, error: errLog } = await supabase
        .from('riwayat_transaksi')
        .select('*')
        .eq('barang_id', id)
        .order('created_at', { ascending: false })

      if (errLog) console.error(errLog)
      else setRiwayat(dataLog || [])

      setLoading(false)
    }

    if (id) getData()
  }, [id, router])

  const formatTanggal = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // === 🎨 FITUR EXPORT EXCEL CANTIK (ExcelJS) ===
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Kartu Stok')

    // 1. HEADER JUDUL BESAR
    sheet.mergeCells('A1:E1')
    sheet.getCell('A1').value = 'KARTU RIWAYAT BARANG (BIN CARD)'
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' }
    sheet.getCell('A1').font = { name: 'Arial', size: 14, bold: true }

    // 2. INFO BARANG
    sheet.mergeCells('A2:E2')
    sheet.getCell('A2').value = `Item: ${barang.nama_barang} | Kode: ${barang.kode_barang} | Sisa Stok: ${barang.jumlah_barang} ${barang.satuan_barang}`
    sheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' }
    sheet.getCell('A2').font = { name: 'Arial', size: 10, italic: true }

    // Spasi Kosong
    sheet.addRow([])

    // 3. HEADER TABEL
    const headerRow = sheet.addRow(['Tanggal', 'Tipe', 'Jumlah', 'Keterangan', 'Petugas'])
    
    // Styling Header Tabel (Warna Biru, Teks Putih)
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E40AF' } // Biru Tua (Hex: 1E40AF)
      }
      cell.font = { color: { argb: 'FFFFFFFF' }, bold: true } // Putih
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })

    // 4. ISI DATA (LOOPING)
    riwayat.forEach((log) => {
      const row = sheet.addRow([
        formatTanggal(log.created_at),
        log.jenis_transaksi,
        log.jumlah,
        log.keterangan,
        log.petugas.split('@')[0]
      ])

      // Styling Baris Data
      const isMasuk = log.jenis_transaksi === 'Masuk'
      const warnaTeks = isMasuk ? 'FF16A34A' : 'FFDC2626' // Hijau atau Merah

      // Kolom Tipe & Jumlah dikasih warna
      row.getCell(2).font = { color: { argb: warnaTeks }, bold: true } // Tipe
      row.getCell(3).font = { color: { argb: warnaTeks }, bold: true } // Jumlah
      
      // Kasih Border ke semua sel di baris ini
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })

    // 5. ATUR LEBAR KOLOM OTOMATIS
    sheet.columns = [
      { width: 20 }, // Tanggal
      { width: 15 }, // Tipe
      { width: 10 }, // Jumlah
      { width: 40 }, // Keterangan
      { width: 20 }, // Petugas
    ]

    // 6. DOWNLOAD FILE
    const buffer = await workbook.xlsx.writeBuffer()
    saveAs(new Blob([buffer]), `BinCard_${barang.kode_barang}.xlsx`)
  }

  // === 📄 FITUR EXPORT PDF (Tetap Pakai yang Tadi) ===
  const exportToPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("KARTU RIWAYAT BARANG (BIN CARD)", 105, 15, { align: "center" })
    
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("PAC SYSTEM - Laporan Stok Individual", 105, 20, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(14, 25, 196, 25)

    doc.setFontSize(10)
    doc.text(`Nama Item  : ${barang.nama_barang}`, 14, 32)
    doc.text(`Kode Aset  : ${barang.kode_barang}`, 14, 37)
    doc.text(`Kategori   : ${barang.kategori_barang}`, 14, 42)

    doc.setFont("helvetica", "bold")
    doc.text(`Sisa Stok: ${barang.jumlah_barang} ${barang.satuan_barang}`, 196, 32, { align: "right" })
    doc.setFont("helvetica", "normal")
    doc.text(`Per Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 196, 37, { align: "right" })

    const tableColumn = ["Tanggal", "Aktivitas", "Qty", "Keterangan", "Petugas"]
    const tableRows = riwayat.map(log => [
      formatTanggal(log.created_at),
      log.jenis_transaksi.toUpperCase(),
      `${log.jenis_transaksi === 'Masuk' ? '+' : '-'}${log.jumlah}`,
      log.keterangan,
      log.petugas.split('@')[0]
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { 
        fillColor: [51, 65, 85], 
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 30 }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && (data.column.index === 1 || data.column.index === 2)) {
          if (data.cell.raw.toString().includes('MASUK') || data.cell.raw.toString().includes('+')) {
            data.cell.styles.textColor = [22, 163, 74]
          } else {
            data.cell.styles.textColor = [220, 38, 38]
          }
        }
      }
    })

    const finalY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(8)
    doc.text("Dokumen ini digenerate otomatis oleh PAC System.", 14, finalY)

    doc.save(`BinCard_${barang.kode_barang}.pdf`)
  }

  if (loading) return <div className="min-h-screen flex justify-center items-center text-blue-600 font-bold animate-pulse">Sedang menarik berkas...</div>
  if (!barang) return null

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 font-sans min-h-screen">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-blue-600 flex items-center gap-1 transition font-bold">
            ← Kembali ke Gudang
          </button>
          
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Excel Pro
            </button>
            <button onClick={exportToPDF} className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-sm">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Print PDF
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{barang.nama_barang}</h1>
            <p className="text-slate-500 font-mono text-sm mt-1 flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold">{barang.kode_barang}</span>
              <span>• {barang.merek_barang || 'Tanpa Merek'}</span>
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Sisa Stok</p>
              <p className={`text-3xl font-black ${barang.jumlah_barang < 5 ? 'text-red-500' : 'text-emerald-600'}`}>
                {barang.jumlah_barang} <span className="text-sm text-slate-400 font-bold">{barang.satuan_barang}</span>
              </p>
            </div>
             <div className="flex flex-col gap-1">
               <Link href={`/tambah?id=${barang.id}`} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition" title="Edit Data Master">
                 <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
               </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg className="w-16 h-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Klasifikasi</p>
          <p className="font-bold text-slate-700 text-lg">{barang.kategori_barang}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-emerald-600/60 tracking-widest mb-1">Total Masuk (Inbound)</p>
          <p className="font-black text-2xl text-emerald-600">
            +{riwayat.filter(r => r.jenis_transaksi === 'Masuk').reduce((acc, curr) => acc + curr.jumlah, 0)}
          </p>
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-red-600/60 tracking-widest mb-1">Total Keluar (Outbound)</p>
          <p className="font-black text-2xl text-red-600">
            -{riwayat.filter(r => r.jenis_transaksi === 'Keluar').reduce((acc, curr) => acc + curr.jumlah, 0)}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 border-l-4 border-blue-600 pl-3">
        Kartu Stok Digital
      </h3>
      
      <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden">
        {riwayat.length > 0 ? (
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
            <p className="text-slate-400 italic text-sm font-medium">Belum ada riwayat transaksi.</p>
          </div>
        )}
      </div>
    </div>
  )
}