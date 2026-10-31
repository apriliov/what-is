# Chat server

Server WebSocket kecil untuk halaman `/chat/:idroom`. Semua data hanya di RAM: tidak ada database,
tidak ada file, tidak ada riwayat. Room otomatis hilang saat kosong.

- 1 room = 1 sampai 6 digit angka, maksimal 2 koneksi
- Pesan maksimal 250 karakter (divalidasi lagi di server), rate limit 15 pesan / 5 detik per koneksi
- Ping tiap 25 detik untuk membuang koneksi mati (HP kehilangan sinyal, laptop sleep)

## Jalankan lokal

```bash
# terminal 1: server chat (port 8787)
cd chat-server
npm install
npm start

# terminal 2: website (dari folder utama)
npm install
npm run dev
```

Buka `http://localhost:5173/chat`. Vite meneruskan `/chat-ws` ke `ws://localhost:8787`, jadi tidak perlu env apa pun.
Buka dua tab dengan nomor room yang sama untuk mencoba, tab ketiga akan ditolak.

Tes otomatis server: `cd chat-server && npm test`

## Deploy (production)

Vercel tidak bisa menjalankan server WebSocket, jadi server chat dipasang terpisah (Render, Railway, Fly.io, atau VPS apa saja yang menjalankan Node 18+).

Contoh Render (Web Service):

| Setting | Isi |
| --- | --- |
| Root Directory | `chat-server` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| `ALLOWED_ORIGINS` | `https://dev.namaiki.xyz` (pisahkan dengan koma jika lebih dari satu) |
| `TRUST_PROXY` | `1` |

Lalu di Vercel (Settings, Environment Variables) isi:

```
VITE_CHAT_WS_URL=wss://nama-service-kamu.onrender.com
```

dan redeploy website. Pakai `wss://` (bukan `ws://`) karena website di HTTPS.

Catatan: paket gratis Render tidur saat sepi. Koneksi pertama bisa butuh sekitar satu menit; halaman chat mencoba lagi
otomatis beberapa kali, lalu menampilkan tombol "Hubungkan lagi".

## Protokol (JSON)

Client ke server: `{type:'join', room:'123456'}`, `{type:'msg', text:'halo'}`

Server ke client: `joined {id,count}`, `peer_joined`, `peer_left`, `msg {from,text,ts}`, `full`, `error {code}`
