# Namaiki Development

Landing page untuk **Namaiki Development**, studio bot Discord independen dari Majalengka, Indonesia.
Menampilkan siapa Namaiki Development, proyeknya (**Namaiki** dan **President**), lokasi, FAQ, dan link penting.

Stack: React + Vite + Tailwind CSS + react-icons.
Bahasa: English dan Indonesia (tombol di footer, pilihan disimpan di browser).

## Menjalankan

```bash
npm install
npm run dev      # development
npm run build    # hasil build ada di folder dist/
npm run preview  # coba hasil build
```

## Yang perlu kamu ganti sebelum deploy

Domain di file ini masih placeholder `https://dev.namaiki.xyz`. Ganti ke domain asli kamu:

- `index.html` (canonical, `og:url`, `og:image`, `twitter:image`)
- `public/robots.txt`
- `public/sitemap.xml`
- `src/config.js` (`SITE_URL`)

Semua link (invite bot, website proyek, support server, email, lokasi) ada di satu tempat: `src/config.js`.
Semua teks (EN dan ID) ada di `src/i18n.jsx`.

## Deploy

Vercel: import repo ini, framework otomatis terdeteksi sebagai Vite. File `vercel.json` sudah ada.

## Dinding Catatan (tanpa database)

Pengunjung mengirim catatan lewat form. Catatan **tidak langsung tampil**. Alurnya:

1. Pengunjung isi form, catatan masuk ke emailmu.
2. Kamu baca. Kalau setuju, tambahkan satu baris di `src/notes.js`:
   `{ text: 'Isi catatan', name: 'Nama' },`
3. Commit dan push, Vercel otomatis deploy ulang, catatan muncul di dinding.

Cara menerima catatan (pilih satu, atur di `src/config.js`):

- **Tanpa setup:** biarkan `NOTES_ENDPOINT` kosong. Tombol kirim akan membuka aplikasi email pengunjung, sudah terisi dan ditujukan ke `SUPPORT_EMAIL`.
- **Web3Forms:** daftar gratis di web3forms.com dengan emailmu, isi `NOTES_ENDPOINT = 'https://api.web3forms.com/submit'` dan `NOTES_ACCESS_KEY` dengan key dari email.
- **Formspree:** buat form di formspree.io, isi `NOTES_ENDPOINT` dengan URL form-nya (`https://formspree.io/f/xxxx`), `NOTES_ACCESS_KEY` biarkan kosong.

Form punya kolom jebakan anti-spam (honeypot) dan batas 240 karakter. Perlindungan spam lainnya ikut layanan form yang kamu pilih.

## Struktur

```
index.html
public/            logo, icon, og.jpg, manifest, robots, sitemap
src/
  App.jsx          menyusun semua section
  config.js        link, lokasi, dan konstanta
  i18n.jsx         teks EN/ID dan provider bahasa
  hooks.js         jam live WIB
  index.css        warna dan komponen dasar (btn, card, label)
  notes.js         catatan yang sudah disetujui
  sections/        Hero, Marquee, About, Projects, Notes, Location, Faq
  components/      Navbar, Footer, LangSwitch, NoteForm
```

## Desain

Simpel dan datar: putih + biru (`#1f5fd6`), font Inter, kartu dengan border tipis. Warna diatur di `tailwind.config.js` (`brand`, `ink`, `mute`).
