# .kiro — Kiro IDE Configuration

Folder ini berisi konfigurasi dan dokumentasi untuk Kiro IDE yang digunakan dalam pengembangan project **Expense & Budget Visualizer**.

## Tentang Folder Ini

Folder `.kiro` digunakan oleh Kiro IDE untuk menyimpan:

- **Steering files** — instruksi dan konteks yang disertakan secara otomatis saat AI agent bekerja di project ini
- **Hooks** — otomasi yang berjalan saat event tertentu terjadi (file save, session start, dll.)
- **Specs** — spesifikasi fitur yang dibangun dengan pendekatan terstruktur (requirements → design → tasks)

## Project

| Item | Detail |
|---|---|
| Nama Project | Expense & Budget Visualizer |
| Peserta | Tantrii01 |
| Batch | CodingCamp 310826 |
| Teknologi | HTML, CSS, Vanilla JavaScript |
| Library | Chart.js (CDN) |

## Struktur Project

```
CodingCamp-310826-Tantrii01/
├── index.html          — markup dan layout halaman
├── css/
│   └── style.css       — semua styling, termasuk tema light/dark
├── js/
│   └── app.js          — semua logika aplikasi dan interaktivitas
└── .kiro/
    ├── README.md        — file ini
    └── steering/
        └── project.md  — konteks project untuk Kiro AI agent
```

## Fitur Aplikasi

### MVP
- Form input pengeluaran (nama, jumlah, kategori)
- Daftar transaksi dengan tombol hapus
- Total pengeluaran otomatis
- Pie chart kategori (Food, Transport, Fun) via Chart.js
- Penyimpanan data di Local Storage

### Optional Challenges
- Sorting transaksi berdasarkan jumlah atau kategori
- Spending limit dengan highlight peringatan
- Toggle dark/light mode

## Local Storage Keys

| Key | Isi |
|---|---|
| `expenses` | Array JSON semua transaksi |
| `spendingLimit` | Batas pengeluaran yang ditetapkan user |
| `theme` | Preferensi tema: `"light"` atau `"dark"` |
