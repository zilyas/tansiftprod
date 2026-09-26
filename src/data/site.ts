// Business details used across the site, in structured data and in the brief form.
// Anything left empty is hidden on the site rather than shown as a placeholder.

export const site = {
  name: 'Tansift Production',
  city: 'Essaouira',
  region: 'Marrakech-Safi',
  country: 'MA',
  // Approximate city centre. Replace with the studio's exact coordinates.
  geo: { lat: 31.5085, lng: -9.7595 },

  // TODO: fill these in with the studio's real contact details.
  whatsapp: '', // international format without "+" or spaces, e.g. "212600000000"
  email: '',
  phone: '',
  streetAddress: '',
  foundingYear: '',

  instagram: 'https://www.instagram.com/tansift_prod/',
  instagramHandle: '@tansift_prod',
  portfolio: 'https://tansiftproduction66f.myportfolio.com/work',
};

export type Site = typeof site;
