// Approved notes shown on the Notes Wall.
//
// How it works: visitors send a note through the form, you read it (email / form inbox),
// and if you approve it, add one line below and redeploy. Newest first is nicest.
// `name` is optional. Keep text under 240 characters.
// The wall shows at most 6 notes (the first 6 in this list), so keep the newest on top.
//
// Example:
//   { text: 'Botnya keren, ditunggu update berikutnya!', name: 'Rina' },
export const NOTES = [
  { text: 'Botnya keren, ditunggu update berikutnya!', name: 'Rina' },
  { text: 'The dashboard is super easy to use. Just one click and it works.', name: 'Daniel' },
  { text: '대시보드가 정말 쓰기 편해요. 앞으로 업데이트도 기대할게요!', name: '민준' },
  { text: 'Semangat terus dari Majalengka ya, semoga makin banyak fitur baru yang seru buat komunitas.' },
  { text: 'President is so much fun. The elections keep our whole server busy.' },
  { text: 'President 봇 덕분에 서버가 훨씬 활기차졌어요. 선거 기능 최고예요!', name: '서연' },
];
