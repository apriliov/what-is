import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const LANGS = ['en', 'id'];
const STORAGE_KEY = 'nd-lang';

const en = {
  meta: {
    htmlLang: 'en',
    title: 'Namaiki Development | Discord bot studio from Majalengka, Indonesia',
    desc: 'Namaiki Development is an independent studio from Majalengka, Indonesia. We build Discord bots and web dashboards, including Namaiki and President.',
  },
  nav: {
    about: 'About',
    projects: 'Projects',
    notes: 'Notes',
    location: 'Location',
    faq: 'FAQ',
    join: 'Join Discord',
    menu: 'Open menu',
    close: 'Close menu',
  },
  hero: {
    label: 'Namaiki Development',
    title: 'Discord bot studio from Majalengka',
    subtitle: 'We make Discord bots and the websites around them. Two bots so far: Namaiki and President.',
  },
  intro: {
    role: 'Indie studio',
    desc: 'A small team from Majalengka, Indonesia. We handle the ideas, code, design, hosting and support ourselves.',
    projects: 'See projects',
  },
  about: {
    label: 'About us',
    title: 'What do we do?',
    items: [
      {
        title: 'Discord bots',
        desc: 'Fast, stable bots that use slash commands and the latest Discord features.',
      },
      {
        title: 'Websites & dashboards',
        desc: 'Websites and dashboards so our bots are easy to understand and easy to set up.',
      },
      {
        title: 'Listening to the community',
        desc: 'Most updates come from suggestions and bug reports in our support server.',
      },
    ],
  },
  projects: {
    label: 'Projects',
    title: 'Our bots',
    visit: 'Visit website',
    invite: 'Add to Discord',
    namaiki: {
      tag: 'Leveling & economy',
      desc: 'An all-in-one bot with leveling, economy, zoo, mini-games and giveaways. Everything can be managed from the web dashboard.',
      points: ['XP & rank cards', 'Economy & zoo', 'Mini-games & giveaways', 'Web dashboard'],
    },
    president: {
      tag: 'Nation-building game',
      desc: 'Lead your own nation on Discord. Build the economy, keep your citizens happy and win the election every 7 days. Your nation keeps running while you are offline.',
      points: ['Build your economy', 'Elections every 7 days', 'Team up with friends', 'Runs while you are offline'],
    },
  },
  location: {
    label: 'Location',
    title: 'Where are we?',
    desc: 'We work from Majalengka, West Java. Our hours follow Western Indonesia Time, so replies in the support server may take a while if you are in another time zone.',
    clock: 'Time in Majalengka now',
    city: 'City',
    region: 'Province',
    country: 'Country',
    timezone: 'Time zone',
    map: 'Open in Google Maps',
    ahead: 'Majalengka is {n}h ahead of you.',
    behind: 'Majalengka is {n}h behind you.',
    same: 'You are on the same time as us.',
  },
  marquee: {
    row1: ['Discord bots', 'Websites & dashboards', 'Indie studio', 'Majalengka, Indonesia', 'Namaiki', 'President', 'Support server'],
    row2: ['Leveling', 'Economy', 'Mini-games', 'Giveaways', 'Slash commands', 'Web dashboard', 'Nation-building game'],
  },
  notes: {
    label: 'Notes',
    title: 'Notes Wall',
    desc: 'Leave a short note for us. We read every note first and the approved ones show up on this wall.',
    empty: 'Empty',
    anon: 'Anonymous',
    formTitle: 'Leave a note',
    msgLabel: 'Your note',
    msgPlaceholder: 'write something for us...',
    left: 'characters left',
    nameLabel: 'Your name',
    namePlaceholder: 'optional',
    send: 'Send note',
    sending: 'Sending...',
    hint: 'Notes appear on the wall after we approve them.',
    sent: 'Thanks! Your note is sent and waits for our review.',
    mail: 'Your email app was opened. Send the email to finish.',
    error: 'Could not send the note. Please try again later.',
    tooShort: 'Write at least 3 characters.',
  },
  faq: {
    label: 'FAQ',
    title: 'Common questions',
    items: [
      {
        q: 'What is Namaiki Development?',
        a: 'An independent studio from Majalengka, Indonesia. We build and run Discord bots and the websites around them. Our projects are Namaiki and President.',
      },
      {
        q: 'How do I add the bots to my server?',
        a: 'Open the Projects section and press "Add to Discord" on the bot you want. Each bot also has its own website with commands and details.',
      },
      {
        q: 'Can I suggest a feature or report a bug?',
        a: 'Yes. Join our support server on Discord and tell us. Most updates come straight from community feedback.',
      },
      {
        q: 'How can I contact you?',
        a: 'The fastest way is our Discord support server. You can also email support@namaiki.xyz.',
      },
    ],
  },
  footer: {
    about: 'Independent Discord bot studio from Majalengka, Indonesia.',
    pages: 'Pages',
    bots: 'Bots',
    more: 'More',
    support: 'Support server',
    privacy: 'Privacy Policy',
    terms: 'Terms of Service',
    rights: 'All rights reserved.',
    language: 'Language',
  },
};

const id = {
  meta: {
    htmlLang: 'id',
    title: 'Namaiki Development | Studio bot Discord dari Majalengka, Indonesia',
    desc: 'Namaiki Development adalah studio independen dari Majalengka, Indonesia. Kami membuat bot Discord dan dashboard web, termasuk Namaiki dan President.',
  },
  nav: {
    about: 'Tentang',
    projects: 'Proyek',
    notes: 'Catatan',
    location: 'Lokasi',
    faq: 'FAQ',
    join: 'Gabung Discord',
    menu: 'Buka menu',
    close: 'Tutup menu',
  },
  hero: {
    label: 'Namaiki Development',
    title: 'Studio Bot Discord dari Majalengka',
    subtitle: 'Kami bikin bot Discord beserta website pendukungnya. Sejauh ini ada dua bot: Namaiki dan President.',
  },
  intro: {
    role: 'Studio indie',
    desc: 'Tim kecil dari Majalengka, Indonesia. Ide, kode, desain, hosting, sampai support kami kerjakan sendiri.',
    projects: 'Lihat proyek',
  },
  about: {
    label: 'Tentang kami',
    title: 'Kami Ngapain Aja?',
    items: [
      {
        title: 'Bot Discord',
        desc: 'Bot yang cepat dan stabil, pakai slash command dan fitur Discord terbaru.',
      },
      {
        title: 'Website & dashboard',
        desc: 'Website dan dashboard supaya bot kami gampang dipahami dan gampang diatur.',
      },
      {
        title: 'Dengar komunitas',
        desc: 'Kebanyakan update datang dari saran dan laporan bug di server support kami.',
      },
    ],
  },
  projects: {
    label: 'Proyek',
    title: 'Bot Buatan Kami',
    visit: 'Kunjungi website',
    invite: 'Tambah ke Discord',
    namaiki: {
      tag: 'Leveling & ekonomi',
      desc: 'Bot serba bisa: leveling, ekonomi, zoo, mini-game, dan giveaway. Semuanya bisa diatur lewat dashboard web.',
      points: ['XP & rank card', 'Ekonomi & zoo', 'Mini-game & giveaway', 'Dashboard web'],
    },
    president: {
      tag: 'Game bangun negara',
      desc: 'Pimpin negaramu sendiri di Discord. Bangun ekonomi, jaga warga tetap senang, dan menangkan pemilu tiap 7 hari. Negaramu tetap jalan walau kamu offline.',
      points: ['Bangun ekonomimu', 'Pemilu tiap 7 hari', 'Main bareng teman', 'Tetap jalan saat offline'],
    },
  },
  location: {
    label: 'Lokasi',
    title: 'Kami di Mana?',
    desc: 'Kami bekerja dari Majalengka, Jawa Barat. Jam kerja kami mengikuti WIB, jadi balasan di server support bisa agak lama kalau kamu beda zona waktu.',
    clock: 'Waktu di Majalengka sekarang',
    city: 'Kota',
    region: 'Provinsi',
    country: 'Negara',
    timezone: 'Zona waktu',
    map: 'Buka di Google Maps',
    ahead: 'Majalengka {n} jam lebih cepat dari waktumu.',
    behind: 'Majalengka {n} jam lebih lambat dari waktumu.',
    same: 'Waktumu sama dengan kami.',
  },
  marquee: {
    row1: ['Bot Discord', 'Website & dashboard', 'Studio indie', 'Majalengka, Indonesia', 'Namaiki', 'President', 'Server support'],
    row2: ['Leveling', 'Ekonomi', 'Mini-game', 'Giveaway', 'Slash command', 'Dashboard web', 'Game bangun negara'],
  },
  notes: {
    label: 'Catatan',
    title: 'Dinding Catatan',
    desc: 'Tinggalkan catatan singkat buat kami. Semua catatan kami baca dulu, yang disetujui akan tampil di dinding ini.',
    empty: 'Kosong',
    anon: 'Anonim',
    formTitle: 'Tinggalkan catatan',
    msgLabel: 'Catatanmu',
    msgPlaceholder: 'tulis sesuatu buat kami...',
    left: 'karakter tersisa',
    nameLabel: 'Nama kamu',
    namePlaceholder: 'boleh dikosongkan',
    send: 'Kirim catatan',
    sending: 'Mengirim...',
    hint: 'Catatan muncul di dinding setelah kami setujui dulu.',
    sent: 'Makasih! Catatanmu terkirim dan menunggu ditinjau.',
    mail: 'Aplikasi emailmu terbuka. Kirim emailnya untuk menyelesaikan.',
    error: 'Catatan gagal terkirim. Coba lagi nanti ya.',
    tooShort: 'Tulis minimal 3 karakter.',
  },
  faq: {
    label: 'FAQ',
    title: 'Pertanyaan Umum',
    items: [
      {
        q: 'Apa itu Namaiki Development?',
        a: 'Studio independen dari Majalengka, Indonesia. Kami membuat dan menjalankan bot Discord beserta websitenya. Proyek kami: Namaiki dan President.',
      },
      {
        q: 'Cara menambahkan bot ke server saya?',
        a: 'Buka bagian Proyek, lalu tekan "Tambah ke Discord" di bot yang kamu mau. Tiap bot juga punya website sendiri berisi daftar command dan detailnya.',
      },
      {
        q: 'Boleh kasih saran fitur atau lapor bug?',
        a: 'Boleh banget. Gabung ke server support kami di Discord dan sampaikan di sana. Kebanyakan update datang dari masukan komunitas.',
      },
      {
        q: 'Gimana cara menghubungi kalian?',
        a: 'Paling cepat lewat server support Discord. Bisa juga lewat email ke support@namaiki.xyz.',
      },
    ],
  },
  footer: {
    about: 'Studio bot Discord independen dari Majalengka, Indonesia.',
    pages: 'Halaman',
    bots: 'Bot',
    more: 'Lainnya',
    support: 'Server support',
    privacy: 'Kebijakan Privasi',
    terms: 'Ketentuan Layanan',
    rights: 'Hak cipta dilindungi.',
    language: 'Bahasa',
  },
};

export const TRANSLATIONS = { en, id };

function getSavedLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
  } catch {
    // storage can be blocked, fall through to the browser language
  }
  return (navigator.language || '').toLowerCase().startsWith('id') ? 'id' : 'en';
}

function resolve(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), dict);
}

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(getSavedLang);

  const setLang = useCallback((next) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore, the choice just will not persist
    }
  }, []);

  useEffect(() => {
    const { htmlLang, title, desc } = TRANSLATIONS[lang].meta;
    document.documentElement.lang = htmlLang;
    document.title = title;
    const el = document.querySelector('meta[name="description"]');
    if (el) el.setAttribute('content', desc);
  }, [lang]);

  const value = useMemo(() => {
    const dict = TRANSLATIONS[lang];
    const t = (path) => {
      const found = resolve(dict, path);
      return found === undefined ? resolve(TRANSLATIONS.en, path) ?? path : found;
    };
    return { lang, setLang, t };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
