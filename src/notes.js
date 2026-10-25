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
  { text: 'Bot Namaiki keren jir, ditunggu update selanjutnya.', name: 'Afka' },
  { text: 'President बॉट की वजह से हमारा सर्वर बहुत एक्टिव हो गया है। चुनाव फीचर शानदार है!', name: 'प्रिया' },
  { text: 'Namaiki 대시보드가 정말 쓰기 편해요. 앞으로 업데이트도 기대할게요!', name: '민준' },
  { text: 'Semoga makin banyak fitur baru.' },
  { text: 'President is so much fun. The elections keep our whole server busy.' },
  { text: 'The Namaiki dashboard is super easy to use. Just one click and it works.', name: 'Daniel' },
];
