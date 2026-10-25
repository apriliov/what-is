// Roles shown in the Recruitment section.
//
// open: true  -> card is active and the button opens an email to RECRUIT_EMAIL.
// open: false -> card is grey, labelled CLOSED, and the button cannot be clicked.
//
// To add a role: add an entry here, then add its texts under `recruit.roles.<key>`
// in src/i18n.jsx (both `en` and `id`), and an icon for it in src/sections/Recruitment.jsx.
export const ROLES = [
  { key: 'botDev', open: false },
  { key: 'webDev', open: false },
  { key: 'designer', open: false },
  { key: 'moderator', open: false },
];
