import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePath, isKnownPath } from './router.jsx';
import { SITE_URL } from './config';

export const LANGS = ['en', 'id'];
const STORAGE_KEY = 'nd-lang';

const en = {
  meta: {
    htmlLang: 'en',
    ogLocale: 'en_US',
    notFoundTitle: 'Page not found | Namaiki Development',
    title: 'Namaiki Development | Discord bot studio from Majalengka, Indonesia',
    recruitTitle: 'Recruitment | Namaiki Development',
    recruitDesc: 'Join Namaiki Development. See the selection stages and open roles for Discord bot developers, web developers, designers and moderators.',
    desc: 'Namaiki Development is an independent studio from Majalengka, Indonesia. We build Discord bots and web dashboards, including Namaiki and President.',
  },
  nav: {
    label: 'Main',
    about: 'About',
    projects: 'Projects',
    recruitment: 'Recruitment',
    team: 'Team',
    new: 'NEW!',
    notes: 'Notes',
    location: 'Location',
    faq: 'FAQ',
    join: 'Join Discord',
    menu: 'Open menu',
    close: 'Close menu',
  },
  hero: {
    label: 'Namaiki Development',
    title: 'Discord bot studio',
    subtitle: 'We make Discord bots and the websites around them. Two bots so far: Namaiki and President.',
  },
  intro: {
    role: 'Indie studio',
    desc: 'A small team from Majalengka, Indonesia. We handle the ideas, code, design, hosting and support ourselves.',
    projects: 'See projects',
    bots: 'Discord bots',
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
    regionName: 'West Java',
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
  team: {
    label: 'Team',
    title: 'Meet the team',
    desc: 'The people behind Namaiki Development, from the bots and websites to the community.',
    members: {
      lio: {
        role: 'Owner & Developer',
        desc: 'Builds and runs the Namaiki and President bots, and the websites around them.',
      },
      kenzio: {
        role: 'UI/UX Designer & Developer',
        desc: 'Designs the look and feel of our bots and websites, and helps build them so they stay clean and easy to use.',
      },
      amalia: {
        role: 'Support Server Moderator',
        desc: 'Helps keep the community friendly and active as part of the moderation team.',
      },
      gibran: {
        role: 'Support Server Admin',
        desc: 'Looks after the support server and helps members with questions and reports.',
      },
    },
  },
  recruit: {
    label: 'Recruitment',
    title: 'Join the team',
    desc: 'We are a small team and we grow slowly. See the roles below. Applications are sent by email.',
    stepsLabel: 'How it works',
    stepsTitle: 'From email to teammate',
    steps: [
      { title: 'Send us an email', desc: 'Mail your CV or portfolio to team@namaiki.xyz and tell us which role you are after.' },
      { title: 'We read it together', desc: 'The whole team goes through every application.' },
      { title: 'You hear back', desc: 'We answer by email, so keep an eye on your inbox and spam folder.' },
      { title: 'Trial run', desc: 'A short trial so both sides can see how working together feels.' },
      { title: 'Welcome aboard', desc: 'You join Namaiki Development and help build our bots and community.' },
    ],
    rolesLabel: 'Open positions',
    rolesTitle: 'Pick a role',
    open: 'OPEN',
    closed: 'CLOSED',
    dutiesTitle: 'What you will do',
    qualsTitle: 'What we look for',
    apply: 'Apply via email',
    closedNote: 'All roles are closed for now. Join our Discord server to hear when we open again.',
    statusOpen: 'Accepting applications',
    statusClosed: 'Not hiring right now',
    closedPanel: 'This role is closed for now. Join our Discord server and you will be among the first to know when it opens again.',
    applyHint: 'Opens your email app with a ready-made draft.',
    emailNote: 'Prefer to write the email yourself? Send it to',
    statsTeam: 'Team members',
    statsOpen: 'Open roles',
    mailSubject: 'Application',
    mailBody: 'Name:\nRole:\nCV / portfolio link:\nWhy do you want to join:\n',
    roles: {
      botDev: {
        team: 'Development Team',
        title: 'Discord Bot Developer',
        desc: 'Build and maintain features for our Discord bots.',
        duties: [
          'Write new commands and features for Namaiki and President.',
          'Fix bugs and keep the bots stable.',
          'Work with databases and the Discord API.',
          'Review code together with the team.',
        ],
        quals: [
          'Know JavaScript, TypeScript or Python and the basics of Discord bots.',
          'Comfortable using Git.',
          'Willing to learn and open to feedback.',
          'Can give regular time every week.',
        ],
      },
      webDev: {
        team: 'Development Team',
        title: 'Web Developer',
        desc: 'Build and improve our websites and dashboards.',
        duties: [
          'Build pages and dashboard features with React.',
          'Keep our sites fast, responsive and easy to use.',
          'Connect the frontend to our bot APIs.',
          'Fix visual and usability bugs.',
        ],
        quals: [
          'Know React and Tailwind CSS or similar tools.',
          'Understand responsive design.',
          'Able to work with Git and pull requests.',
          'Careful with details.',
        ],
      },
      designer: {
        team: 'Design Team',
        title: 'UI/UX Designer',
        desc: 'Design clean and friendly interfaces for our bots and websites.',
        duties: [
          'Design pages, dashboards and bot embeds.',
          'Make icons, banners and simple brand assets.',
          'Keep the look consistent across all projects.',
          'Prepare designs that developers can follow easily.',
        ],
        quals: [
          'Have a portfolio of your design work.',
          'Know Figma or a similar tool.',
          'Understand basic layout, color and typography.',
          'Open to feedback and revisions.',
        ],
      },
      moderator: {
        team: 'Moderation Team',
        title: 'Community Moderator',
        desc: 'Help keep our Discord community friendly and active.',
        duties: [
          'Welcome new members and answer their questions.',
          'Keep chats friendly and free of drama.',
          'Apply the server rules fairly.',
          'Pass bug reports and ideas on to the developers.',
        ],
        quals: [
          'Active on Discord and friendly with people.',
          'Know the server rules and basic moderation.',
          'Stay calm when handling conflicts.',
          'Can be online regularly.',
        ],
      },
    },
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
  common: {
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Could not copy',
  },
  notFound: {
    title: 'Page not found',
    desc: 'The page you are looking for does not exist or has moved.',
    home: 'Back to home',
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
    ctaTitle: 'Got a question or an idea?',
    ctaDesc: 'Drop by our Discord server and talk to us.',
  },
};

const id = {
  meta: {
    htmlLang: 'id',
    ogLocale: 'id_ID',
    notFoundTitle: 'Halaman tidak ditemukan | Namaiki Development',
    title: 'Namaiki Development | Studio bot Discord dari Majalengka, Indonesia',
    recruitTitle: 'Rekrutmen | Namaiki Development',
    recruitDesc: 'Gabung Namaiki Development. Lihat tahapan seleksi dan posisi untuk pengembang bot Discord, pengembang web, desainer, dan moderator.',
    desc: 'Namaiki Development adalah studio independen dari Majalengka, Indonesia. Kami membuat bot Discord dan dasbor web, termasuk Namaiki dan President.',
  },
  nav: {
    label: 'Navigasi utama',
    about: 'Tentang',
    projects: 'Proyek',
    recruitment: 'Rekrutmen',
    team: 'Tim',
    new: 'BARU!',
    notes: 'Catatan',
    location: 'Lokasi',
    faq: 'Tanya Jawab',
    join: 'Gabung Discord',
    menu: 'Buka menu',
    close: 'Tutup menu',
  },
  hero: {
    label: 'Namaiki Development',
    title: 'Studio Bot Discord',
    subtitle: 'Kami bikin bot Discord beserta situs web pendukungnya. Sejauh ini ada dua bot: Namaiki dan President.',
  },
  intro: {
    role: 'Studio independen',
    desc: 'Tim kecil dari Majalengka, Indonesia. Ide, kode, desain, pengelolaan server, sampai dukungan pengguna kami kerjakan sendiri.',
    projects: 'Lihat proyek',
    bots: 'Bot Discord',
  },
  about: {
    label: 'Tentang kami',
    title: 'Kami Ngapain Aja?',
    items: [
      {
        title: 'Bot Discord',
        desc: 'Bot yang cepat dan stabil, pakai perintah garis miring dan fitur Discord terbaru.',
      },
      {
        title: 'Situs web & dasbor',
        desc: 'Situs web dan dasbor supaya bot kami gampang dipahami dan gampang diatur.',
      },
      {
        title: 'Dengar komunitas',
        desc: 'Kebanyakan pembaruan datang dari saran dan laporan galat di server dukungan kami.',
      },
    ],
  },
  projects: {
    label: 'Proyek',
    title: 'Bot Buatan Kami',
    visit: 'Kunjungi situs web',
    invite: 'Tambah ke Discord',
    namaiki: {
      tag: 'Level & ekonomi',
      desc: 'Bot serba bisa: level, ekonomi, kebun binatang, gim mini, dan bagi-bagi hadiah. Semuanya bisa diatur lewat dasbor web.',
      points: ['XP & kartu peringkat', 'Ekonomi & kebun binatang', 'Gim mini & bagi-bagi hadiah', 'Dasbor web'],
    },
    president: {
      tag: 'Gim bangun negara',
      desc: 'Pimpin negaramu sendiri di Discord. Bangun ekonomi, jaga warga tetap senang, dan menangkan pemilu tiap 7 hari. Negaramu tetap jalan walau kamu sedang tidak daring.',
      points: ['Bangun ekonomimu', 'Pemilu tiap 7 hari', 'Main bareng teman', 'Tetap jalan saat tidak daring'],
    },
  },
  location: {
    label: 'Lokasi',
    title: 'Kami di Mana?',
    desc: 'Kami bekerja dari Majalengka, Jawa Barat. Jam kerja kami mengikuti WIB, jadi balasan di server dukungan bisa agak lama kalau kamu beda zona waktu.',
    clock: 'Waktu di Majalengka sekarang',
    city: 'Kota',
    region: 'Provinsi',
    regionName: 'Jawa Barat',
    country: 'Negara',
    timezone: 'Zona waktu',
    map: 'Buka di Google Maps',
    ahead: 'Majalengka {n} jam lebih cepat dari waktumu.',
    behind: 'Majalengka {n} jam lebih lambat dari waktumu.',
    same: 'Waktumu sama dengan kami.',
  },
  marquee: {
    row1: ['Bot Discord', 'Situs web & dasbor', 'Studio independen', 'Majalengka, Indonesia', 'Namaiki', 'President', 'Server Dukungan'],
    row2: ['Level', 'Ekonomi', 'Gim mini', 'Bagi-bagi hadiah', 'Perintah garis miring', 'Dasbor web', 'Gim bangun negara'],
  },
  team: {
    label: 'Tim',
    title: 'Kenalan dengan Tim',
    desc: 'Orang-orang di balik Namaiki Development, dari bot dan situs web sampai komunitasnya.',
    members: {
      lio: {
        role: 'Pemilik & Pengembang',
        desc: 'Membangun dan menjalankan bot Namaiki dan President, beserta situs web pendukungnya.',
      },
      kenzio: {
        role: 'Desainer UI/UX & Pengembang',
        desc: 'Merancang tampilan bot dan situs web kami, sekaligus ikut membangunnya supaya tetap bersih dan mudah dipakai.',
      },
      amalia: {
        role: 'Moderator Server Dukungan',
        desc: 'Membantu menjaga komunitas tetap ramah dan aktif sebagai bagian dari tim moderasi.',
      },
      gibran: {
        role: 'Admin Server Dukungan',
        desc: 'Mengurus server dukungan dan membantu anggota yang punya pertanyaan atau laporan.',
      },
    },
  },
  recruit: {
    label: 'Rekrutmen',
    title: 'Gabung Tim Kami',
    desc: 'Kami tim kecil dan tumbuh pelan-pelan. Lihat posisi di bawah. Lamaran dikirim lewat email.',
    stepsLabel: 'Alurnya',
    stepsTitle: 'Dari email sampai jadi tim',
    steps: [
      { title: 'Kirim email', desc: 'Kirim CV atau portofoliomu ke team@namaiki.xyz dan sebutkan posisi yang kamu incar.' },
      { title: 'Dibaca bareng-bareng', desc: 'Semua lamaran kami baca bersama satu tim.' },
      { title: 'Kabar lewat email', desc: 'Jawabannya kami kirim lewat email, jadi cek kotak masuk dan folder spam ya.' },
      { title: 'Coba dulu', desc: 'Masa percobaan singkat supaya kedua pihak tahu rasanya kerja bareng.' },
      { title: 'Selamat bergabung', desc: 'Kamu resmi jadi bagian Namaiki Development dan ikut membangun bot serta komunitas kami.' },
    ],
    rolesLabel: 'Posisi',
    rolesTitle: 'Pilih posisimu',
    open: 'Buka',
    closed: 'Tutup',
    dutiesTitle: 'Yang akan kamu kerjakan',
    qualsTitle: 'Yang kami cari',
    apply: 'Daftar lewat email',
    closedNote: 'Semua posisi sedang ditutup. Gabung server Discord kami untuk tahu kapan dibuka lagi.',
    statusOpen: 'Menerima lamaran',
    statusClosed: 'Belum membuka lowongan',
    closedPanel: 'Posisi ini sedang ditutup. Gabung server Discord kami supaya jadi yang pertama tahu saat dibuka lagi.',
    applyHint: 'Membuka aplikasi emailmu dengan draf yang sudah disiapkan.',
    emailNote: 'Mau menulis email sendiri? Kirim ke',
    statsTeam: 'Anggota tim',
    statsOpen: 'Loker tersedia',
    mailSubject: 'Lamaran',
    mailBody: 'Nama:\nPosisi:\nTautan CV / portofolio:\nAlasan ingin bergabung:\n',
    roles: {
      botDev: {
        team: 'Tim Pengembangan',
        title: 'Pengembang Bot Discord',
        desc: 'Bangun dan rawat fitur untuk bot Discord kami.',
        duties: [
          'Membuat perintah dan fitur baru untuk Namaiki dan President.',
          'Memperbaiki galat dan menjaga bot tetap stabil.',
          'Bekerja dengan basis data dan API Discord.',
          'Meninjau kode bersama tim.',
        ],
        quals: [
          'Menguasai JavaScript, TypeScript atau Python dan dasar bot Discord.',
          'Terbiasa memakai Git.',
          'Mau belajar dan terbuka dengan masukan.',
          'Bisa meluangkan waktu rutin tiap minggu.',
        ],
      },
      webDev: {
        team: 'Tim Pengembangan',
        title: 'Pengembang Web',
        desc: 'Bangun dan sempurnakan situs web serta dasbor kami.',
        duties: [
          'Membuat halaman dan fitur dasbor dengan React.',
          'Menjaga situs web tetap cepat, responsif dan mudah dipakai.',
          'Menghubungkan tampilan depan ke API bot kami.',
          'Memperbaiki galat tampilan dan kegunaan.',
        ],
        quals: [
          'Menguasai React dan Tailwind CSS atau alat sejenis.',
          'Paham desain responsif.',
          'Bisa bekerja dengan Git secara tim.',
          'Teliti dalam hal-hal kecil.',
        ],
      },
      designer: {
        team: 'Tim Desain',
        title: 'Desainer UI/UX',
        desc: 'Rancang tampilan yang bersih dan ramah untuk bot dan situs web kami.',
        duties: [
          'Mendesain halaman, dasbor, dan tampilan pesan bot.',
          'Membuat ikon, spanduk, dan aset identitas merek sederhana.',
          'Menjaga tampilan tetap konsisten di semua proyek.',
          'Menyiapkan desain yang mudah diikuti pengembang.',
        ],
        quals: [
          'Punya portofolio karya desain.',
          'Menguasai Figma atau alat sejenis.',
          'Paham dasar tata letak, warna dan tipografi.',
          'Terbuka dengan masukan dan revisi.',
        ],
      },
      moderator: {
        team: 'Tim Moderasi',
        title: 'Moderator Komunitas',
        desc: 'Bantu menjaga komunitas Discord kami tetap ramah dan aktif.',
        duties: [
          'Menyapa anggota baru dan menjawab pertanyaan mereka.',
          'Menjaga obrolan tetap ramah dan bebas keributan.',
          'Menerapkan aturan server secara adil.',
          'Meneruskan laporan galat dan ide ke pengembang.',
        ],
        quals: [
          'Aktif di Discord dan ramah ke sesama.',
          'Paham aturan server dan dasar moderasi.',
          'Tetap tenang saat menangani konflik.',
          'Bisa hadir daring secara rutin.',
        ],
      },
    },
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
    label: 'Tanya jawab',
    title: 'Pertanyaan Umum',
    items: [
      {
        q: 'Apa itu Namaiki Development?',
        a: 'Studio independen dari Majalengka, Indonesia. Kami membuat dan menjalankan bot Discord beserta situs webnya. Proyek kami: Namaiki dan President.',
      },
      {
        q: 'Cara menambahkan bot ke server saya?',
        a: 'Buka bagian Proyek, lalu tekan "Tambah ke Discord" di bot yang kamu mau. Tiap bot juga punya situs web sendiri berisi daftar perintah dan detailnya.',
      },
      {
        q: 'Boleh kasih saran fitur atau melaporkan galat?',
        a: 'Boleh banget. Gabung ke server dukungan kami di Discord dan sampaikan di sana. Kebanyakan pembaruan datang dari masukan komunitas.',
      },
      {
        q: 'Gimana cara menghubungi kalian?',
        a: 'Paling cepat lewat server dukungan Discord. Bisa juga lewat email ke support@namaiki.xyz.',
      },
    ],
  },
  common: {
    copy: 'Salin',
    copied: 'Tersalin',
    copyFailed: 'Gagal menyalin',
  },
  notFound: {
    title: 'Halaman tidak ditemukan',
    desc: 'Halaman yang kamu cari tidak ada atau sudah dipindahkan.',
    home: 'Kembali ke beranda',
  },
  footer: {
    about: 'Studio bot Discord independen dari Majalengka, Indonesia.',
    pages: 'Halaman',
    bots: 'Bot',
    more: 'Lainnya',
    support: 'Server Dukungan',
    privacy: 'Kebijakan Privasi',
    terms: 'Ketentuan Layanan',
    rights: 'Hak cipta dilindungi.',
    language: 'Bahasa',
    ctaTitle: 'Punya pertanyaan atau ide?',
    ctaDesc: 'Mampir ke server Discord kami dan ngobrol bareng.',
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
  // First language in the browser's preference list that we have. "in" is the old code for Indonesian.
  const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  for (const l of prefs) {
    const code = String(l).toLowerCase();
    if (code.startsWith('id') || code === 'in' || code.startsWith('in-')) return 'id';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
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

  const path = usePath();

  useEffect(() => {
    const meta = TRANSLATIONS[lang].meta;
    const known = isKnownPath(path);
    const recruit = path === '/recruitment';
    const title = !known ? meta.notFoundTitle : recruit ? meta.recruitTitle : meta.title;
    const desc = recruit ? meta.recruitDesc : meta.desc;
    const setMeta = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', value);
    };

    document.documentElement.lang = meta.htmlLang;
    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:locale"]', meta.ogLocale);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);
    // Unknown pages must not be indexed.
    setMeta('meta[name="robots"]', known ? 'index, follow' : 'noindex, follow');

    const url = `${SITE_URL}${recruit ? '/recruitment' : '/'}`;
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url);
    setMeta('meta[property="og:url"]', url);
  }, [lang, path]);

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
