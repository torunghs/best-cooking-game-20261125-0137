// DAPUR BARA — constants: the playfield, the palette, the pantry bins,
// the recipes and the shift rules. One file, no logic: every other module
// reads from here so a balance tweak is a one-line change.

export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;
export const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";
export const BEST_KEY = 'dapur-bara-best';

export const PALETTE = {
  wall: '#7a3b1e',
  wallDark: '#5e2c15',
  floor: '#3d2b1f',
  floorTile: '#4a3626',
  counter: '#8a5a2e',
  counterTop: '#b07a3e',
  steel: '#c8ccd4',
  steelDark: '#9aa0ab',
  board: '#e8c88f',
  cream: '#fff3d6',
  ink: '#2b1608',
  ember: '#ff7a1a',
  flame: '#ffc21a',
  fire: '#ff4d00',
  green: '#58b368',
  red: '#e5484d',
  gold: '#ffc21a',
  ticket: '#fff8e1',
  ticketEdge: '#d9b96a',
  chalk: '#f5e6c4',
};

export const SHIFT_SECONDS = 180;
export const TARGET_COINS = { one: 120, two: 200, three: 300 };
export const MAX_REPUTATION = 3;
export const HAND_MAX = 2;

// The pantry: every bin on the counter. `key` is the keyboard shortcut,
// `color` tints the bin, `label` is shown under it.
export const BINS = [
  { id: 'nasi',   name: 'Nasi',    key: '1', color: '#f2ead8' },
  { id: 'mie',    name: 'Mie',     key: '2', color: '#f7c948' },
  { id: 'telur',  name: 'Telur',   key: '3', color: '#fff6d8' },
  { id: 'ayam',   name: 'Ayam',    key: '4', color: '#f2a594' },
  { id: 'sayur',  name: 'Sayur',   key: '5', color: '#7dc383' },
  { id: 'tahu',   name: 'Tahu',    key: '6', color: '#fdf3d0' },
  { id: 'kecap',  name: 'Kecap',   key: '7', color: '#5a2d12' },
  { id: 'sambal', name: 'Sambal',  key: '8', color: '#d92b1f' },
  { id: 'kacang', name: 'Kacang',  key: '9', color: '#a06a2c' },
];

// Station transforms: what a station does to an item, how long it takes,
// and what comes out. A station only accepts the items listed here.
export const STATIONS = {
  board: {
    name: 'Talenan', verb: 'Memotong', seconds: 2.5,
    turns: { ayam: 'ayam-potong', sayur: 'sayur-potong' },
  },
  wok: {
    name: 'Wajan Bara', verb: 'Menggoreng', seconds: 5,
    turns: { nasi: 'nasi-goreng', mie: 'mie-goreng', telur: 'telur-orak', tahu: 'tahu-crispy' },
  },
  grill: {
    name: 'Panggangan', verb: 'Memanggang', seconds: 7,
    turns: { 'ayam-potong': 'sate-matang', ayam: 'ayam-bakar' },
  },
};

// Seconds a finished item may sit on a hot station before it burns.
export const BURN_SECONDS = 5;

// Recipes: `components` are the finished pieces a plate must hold, in any
// order. `price` is the base pay; the tip rides on patience left.
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng Bara', short: 'Nasi Goreng', price: 24, color: '#e8821e',
    blurb: 'Nasi + telur di wajan, kecap di piring.',
    components: ['nasi-goreng', 'telur-orak', 'kecap'],
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', short: 'Mie Goreng', price: 22, color: '#f7c948',
    blurb: 'Mie di wajan, sayur dipotong dulu.',
    components: ['mie-goreng', 'sayur-potong'],
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam Bara', short: 'Sate Ayam', price: 28, color: '#c65a1e',
    blurb: 'Ayam dipotong, dipanggang, saus kacang.',
    components: ['sate-matang', 'kacang'],
  },
  {
    id: 'ayam-bakar', name: 'Ayam Bakar', short: 'Ayam Bakar', price: 30, color: '#a03d12',
    blurb: 'Ayam langsung di panggangan + kecap + sambal.',
    components: ['ayam-bakar', 'kecap', 'sambal'],
  },
  {
    id: 'tahu-crispy', name: 'Tahu Crispy', short: 'Tahu Crispy', price: 18, color: '#e8b64c',
    blurb: 'Tahu digoreng garing, sambal di piring.',
    components: ['tahu-crispy', 'sambal'],
  },
];

// Item names for labels and the recipe book.
export const ITEM_NAMES = {
  nasi: 'Nasi', mie: 'Mie', telur: 'Telur', ayam: 'Ayam', sayur: 'Sayur',
  tahu: 'Tahu', kecap: 'Kecap', sambal: 'Sambal', kacang: 'Saus Kacang',
  'ayam-potong': 'Ayam Potong', 'sayur-potong': 'Sayur Potong',
  'nasi-goreng': 'Nasi Goreng', 'mie-goreng': 'Mie Goreng',
  'telur-orak': 'Telur Orak-arik', 'tahu-crispy': 'Tahu Crispy',
  'sate-matang': 'Sate Matang', 'ayam-bakar': 'Ayam Bakar',
};

// Faces for the order tickets: a few regulars with their own look.
export const REGULARS = [
  { name: 'Bu Ratna', skin: '#f2c89b', hair: '#3a2a1a', style: 'bun' },
  { name: 'Pak Dedi', skin: '#d9a066', hair: '#1a1a1a', style: 'cap' },
  { name: 'Mbak Sari', skin: '#f7d7a8', hair: '#5a2d12', style: 'long' },
  { name: 'Mas Joko', skin: '#c98d54', hair: '#241a12', style: 'short' },
  { name: 'Nenek Ani', skin: '#e8b88a', hair: '#e8e8e8', style: 'bun' },
  { name: 'Dek Budi', skin: '#f2c89b', hair: '#2a1a0e', style: 'spiky' },
];
