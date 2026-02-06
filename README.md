# ⚙️ Production Asset Control (PAC)

**PAC** adalah sistem manajemen inventaris modern yang dirancang khusus untuk memantau aset operasional, perkakas, dan material produksi secara real-time. Dibangun dengan fokus pada kecepatan, akurasi data, dan kemudahan penggunaan bagi operator di lapangan.

---

## 🚀 Fitur Unggulan

- **Real-time Inventory Tracking**: Sinkronisasi instan dengan database Supabase.
- **Dynamic Asset Classification**: Manajemen kategori yang terorganisir untuk berbagai jenis material produksi.
- **Smart Stock Monitoring**: Indikator visual otomatis untuk level stok kritis (Low Stock Alert).
- **Pro Dashboard UI**: Antarmuka responsif dengan desain industrial yang bersih dan profesional.
- **Secure Authentication**: Keamanan data terjamin melalui integrasi Supabase Auth.

## 🛠️ Tech Stack

- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Heroicons](https://heroicons.com/)

---

## 📦 Kategori Inventaris yang Didukung

Sistem ini telah dikonfigurasi untuk menangani berbagai klasifikasi aset berikut:

- 🛠️ Perkakas Tangan (Hand Tools)
- 🦺 Alat Keselamatan Kerja (APD / K3)
- 🧪 Peralatan Laboratorium & Bahan Kimia
- 🔌 Alat Ukur & Pengujian Listrik
- 💧 Material Perpipaan / Fitting
- ⛽ Bahan Bakar & Pelumas

---

## ⚙️ Instalasi Lokal

Jika Anda ingin menjalankan proyek ini di lingkungan lokal:

1. **Clone Repository**

   ```bash
   git clone [https://github.com/username-lo/inventaris-produksi.git](https://github.com/username-lo/inventaris-produksi.git)
   cd inventaris-produksi

   ```

2. **Install Dependencies**

   ```bash
   npm install

   ```

3. **Konfigurasi Environment Variable**
   Buat file .env.local dan masukkan kredensial Supabase Anda:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run Development Server**

   ```bash
   npm run dev
   ```

   Buka http://localhost:3000 pada browser Anda.

   ***

## 🛡️ Database Schema (Supabase)

Pastikan tabel `inventaris_produksi` memiliki struktur kolom sebagai berikut untuk menjamin fungsi CRUD berjalan lancar:

| Column            | Type          | Description                   | Default             |
| :---------------- | :------------ | :---------------------------- | :------------------ |
| `id`              | `uuid`        | Primary Key (Identitas unik)  | `gen_random_uuid()` |
| `created_at`      | `timestamptz` | Waktu data dibuat             | `now()`             |
| `kode_barang`     | `text`        | Serial atau kode unik aset    | -                   |
| `nama_barang`     | `text`        | Nama lengkap barang           | -                   |
| `merek_barang`    | `text`        | Brand atau vendor             | -                   |
| `kategori_barang` | `text`        | Klasifikasi (Dropdown)        | -                   |
| `jumlah_barang`   | `int4`        | Kuantitas stok                | `0`                 |
| `satuan_barang`   | `text`        | Satuan (Buah, Kg, Liter, dll) | -                   |

---
