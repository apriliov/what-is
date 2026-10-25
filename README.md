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
  sections/        Hero, About, Projects, Location, Faq
  components/      Navbar, Footer, LangSwitch
```

## Desain

Simpel dan datar: putih + biru (`#1f5fd6`), font Inter, kartu dengan border tipis. Warna diatur di `tailwind.config.js` (`brand`, `ink`, `mute`).
