// Central place for every link and constant used by the site.
export const SITE_URL = 'https://dev.namaiki.xyz';

// Studio
export const STUDIO_NAME = 'Namaiki Development';
export const SUPPORT_URL = 'https://discord.gg/WQjWWbDEKu';
export const SUPPORT_EMAIL = 'support@namaiki.xyz';
// Address used by the Notes Wall (fallback email when NOTES_ENDPOINT is empty).
export const NOTES_EMAIL = 'no-reply@namaiki.xyz';
// Where job applications are sent (Recruitment section).
export const RECRUIT_EMAIL = 'team@namaiki.xyz';
export const OWNER_NAME = 'Apriliov';
export const OWNER_URL = 'https://github.com/apriliov';
export const COPYRIGHT_YEAR = 2026;

// Location
export const LOCATION_CITY = 'Majalengka';
export const LOCATION_REGION = 'West Java';
export const LOCATION_COUNTRY = 'Indonesia';
export const LOCATION_TZ = 'WIB (UTC+7)';
export const MAPS_URL = 'https://www.google.com/maps/search/?api=1&query=Majalengka%2C+West+Java%2C+Indonesia';

// Projects
export const NAMAIKI_URL = 'https://www.namaiki.xyz';
export const NAMAIKI_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1201260757258612817&permissions=1126451810658368&integration_type=0&scope=bot+applications.commands';
export const NAMAIKI_PRIVACY_URL = 'https://www.namaiki.xyz/privacy-policy';
export const NAMAIKI_TERMS_URL = 'https://www.namaiki.xyz/terms-of-service';

export const PRESIDENT_URL = 'https://president.namaiki.xyz';
export const PRESIDENT_INVITE_URL =
  'https://discord.com/oauth2/authorize?client_id=1558929981294514226&permissions=1125902323148993&integration_type=0&scope=bot+applications.commands';

// IANA zone used for the live clock (WIB).
export const LOCATION_IANA_TZ = 'Asia/Jakarta';
// UTC offset in hours for WIB.
export const LOCATION_UTC_OFFSET = 7;

// Notes wall. Visitors' notes are sent to this form endpoint (Formspree, Web3Forms, ...).
// Leave it empty to fall back to opening the visitor's email app addressed to NOTES_EMAIL.
export const NOTES_ENDPOINT = '';
// Only for Web3Forms: your public access key. Leave empty for other services.
export const NOTES_ACCESS_KEY = '';
export const NOTES_MAX_LENGTH = 240;
