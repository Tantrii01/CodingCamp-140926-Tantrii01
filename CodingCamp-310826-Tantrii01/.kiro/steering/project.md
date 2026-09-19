---
inclusion: always
---

# Konteks Project: Expense & Budget Visualizer

## Identitas Project

- **Nama**: Expense & Budget Visualizer
- **Peserta**: Tantrii01
- **Batch**: CodingCamp 310826
- **Folder root**: `CodingCamp-310826-Tantrii01/`

## Stack Teknologi

- **HTML** — satu file: `index.html`
- **CSS** — satu file: `css/style.css`
- **JavaScript** — satu file: `js/app.js` (Vanilla JS, tanpa framework)
- **Library eksternal**: Chart.js dimuat via CDN di `index.html`
- **Tidak ada**: React, Vue, Angular, backend, npm, build tools

## Arsitektur Aplikasi

### State Management
Semua state disimpan dalam satu objek di memori:
```js
const state = {
  transactions: [],  // array transaksi
  limit: 0,          // spending limit
  chart: null,       // instance Chart.js
};
```

### Lapisan Kode (Layer)
1. **Local Storage Layer** — `loadTransactions`, `saveTransactions`, `loadLimit`, `saveLimit`, `loadTheme`, `saveTheme`
2. **Data Layer** — `addTransaction`, `deleteTransaction`, `getSortedTransactions`, `getCategoryTotals`, `getTotal`
3. **Render Layer** — `renderList`, `renderTotal`, `renderChart`, `renderAll`
4. **Event Handlers** — `handleFormSubmit`, `handleDeleteClick`, `handleSortChange`, `handleLimitChange`, `handleThemeToggle`

### Pola Data Flow
```
Setiap perubahan state → saveTransactions() → renderAll()
renderAll() = renderList() + renderTotal() + renderChart()
```

## Local Storage Keys

| Key | Tipe | Deskripsi |
|---|---|---|
| `expenses` | JSON array | Semua transaksi tersimpan |
| `spendingLimit` | string angka | Batas pengeluaran user |
| `theme` | `"light"` / `"dark"` | Preferensi tema |

## Model Data Transaksi

```js
{
  id:       Date.now(),   // number — ID unik berbasis timestamp
  name:     string,       // nama item (sudah di-trim)
  amount:   number,       // angka positif
  category: string,       // "Food" | "Transport" | "Fun"
  date:     string,       // format "YYYY-MM-DD"
}
```

## Elemen DOM Penting (ID)

| ID | Fungsi |
|---|---|
| `expense-form` | Form input pengeluaran |
| `item-name` | Input nama item |
| `amount` | Input jumlah |
| `category` | Select kategori |
| `error-message` | Area pesan error validasi |
| `transaction-list` | `<ul>` daftar transaksi |
| `empty-message` | Pesan saat list kosong |
| `total-amount` | Display total pengeluaran |
| `sort-select` | Dropdown sort |
| `spending-limit` | Input batas pengeluaran |
| `limit-warning` | Banner peringatan limit |
| `expense-chart` | Canvas Chart.js |
| `theme-toggle` | Tombol toggle tema |

## Sistem Tema

- `data-theme="light"` atau `data-theme="dark"` dipasang di elemen `<html>`
- Semua warna didefinisikan sebagai CSS custom properties di `css/style.css`
- Transisi tema menggunakan `transition` CSS, bukan JavaScript

## Kategori & Warna

| Kategori | Warna | CSS Class |
|---|---|---|
| Food | Hijau `#38a169` | `.category-food` |
| Transport | Biru `#3182ce` | `.category-transport` |
| Fun | Oranye `#dd6b20` | `.category-fun` |

## Aturan Penting untuk Agent

- **Jangan ubah** `index.html`, `css/style.css`, atau `js/app.js` kecuali diminta eksplisit
- **Jangan tambahkan** framework, library baru, atau file build
- **Jangan pecah** file CSS atau JS menjadi beberapa file
- Semua fitur harus tetap berjalan: form, delete, total, chart, sort, limit, tema
- Validasi form: nama tidak boleh kosong, amount harus angka positif, kategori harus dipilih
- Chart.js di-update dengan `chart.update()`, bukan dengan membuat ulang instance
