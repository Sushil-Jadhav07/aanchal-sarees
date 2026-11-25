// Data for the "wardrobe" section ("Your wardrobe, beautifully woven").
// Images live in public/images/wardrobe/: cropped, resized copies of the supplied cut-outs in
// public/images/shade-selector/0N-*/ (the originals are untouched). `aspect` is width / height of
// the cropped image and `pivot` is where the hanger hook sits across it (0 = left edge, 1 = right).

const DIR = '/images/wardrobe'
const BASE_H = 494 // a full-length saree is 494 px tall in the 1672 px wide design

export const categories = [
  { id: 'sarees', label: 'Sarees' },
  { id: 'half-sarees', label: 'Half Sarees' },
  { id: 'blouses', label: 'Blouses' },
  { id: 'dupattas', label: 'Dupattas' },
  { id: 'dress-materials', label: 'Dress Materials' },
]

// height of each garment relative to a saree, taken from the design
const HEIGHT = { sarees: 1, 'half-sarees': 0.9, dupattas: 1, 'dress-materials': 0.67 }
// blouses are wide and short: sized by their width in the design (about 190 px)
const blouseSize = (aspect) => Math.min(0.46, 190 / (BASE_H * aspect))

function make(category, folder, file, o) {
  return {
    id: `${category}-${o.slug}`,
    category,
    label: o.short,
    title: o.title,
    note: o.note,
    price: o.price ?? null, // only the price shown in the design; no others are invented
    hex: o.hex,
    image: `${DIR}/${folder}/${file}`,
    aspect: o.aspect,
    pivot: o.pivot,
    size: category === 'blouses' ? blouseSize(o.aspect) : HEIGHT[category],
    alt: `${o.title} hanging on a wooden hanger`,
    card: o.card ?? null, // a styled photo for the side card, where the design has one
    cardAlt: o.cardAlt ?? null,
  }
}

export const wardrobe = [
  make('sarees', 'sarees', '01-ruby-banarasi.png', { slug: 'ruby', short: 'Ruby Banarasi', title: 'Ruby Silk Saree', note: 'Banarasi', hex: '#9b1630', aspect: 0.3509, pivot: 0.502, price: '₹18,500', card: `${DIR}/card-ruby-saree.png`, cardAlt: 'A ruby silk saree with gold borders, draped in soft folds.' }),
  make('sarees', 'sarees', '02-emerald-kanjivaram.png', { slug: 'emerald', short: 'Emerald Kanjivaram', title: 'Emerald Silk Saree', note: 'Kanjivaram', hex: '#1f5a3a', aspect: 0.3227, pivot: 0.532 }),
  make('sarees', 'sarees', '03-purple-paithani.png', { slug: 'purple', short: 'Purple Paithani', title: 'Purple Silk Saree', note: 'Paithani', hex: '#7a2a78', aspect: 0.3773, pivot: 0.508 }),
  make('sarees', 'sarees', '04-ivory-chanderi.png', { slug: 'ivory', short: 'Ivory Chanderi', title: 'Ivory Silk Saree', note: 'Chanderi', hex: '#e7dcc0', aspect: 0.3909, pivot: 0.505 }),

  make('half-sarees', 'half-sarees', '01-emerald-gold.png', { slug: 'emerald', short: 'Emerald & Gold', title: 'Emerald Gold Half Saree', hex: '#1f5a3a', aspect: 0.6045, pivot: 0.499 }),
  make('half-sarees', 'half-sarees', '02-ruby-gold.png', { slug: 'ruby', short: 'Ruby & Gold', title: 'Ruby Gold Half Saree', hex: '#a01832', aspect: 0.6409, pivot: 0.502 }),
  make('half-sarees', 'half-sarees', '03-royal-blue-pink.png', { slug: 'royal', short: 'Royal Blue & Pink', title: 'Royal Blue Half Saree', hex: '#2a3ca0', aspect: 0.5936, pivot: 0.511 }),
  make('half-sarees', 'half-sarees', '04-mustard-purple.png', { slug: 'mustard', short: 'Mustard & Purple', title: 'Mustard Half Saree', hex: '#d49a1c', aspect: 0.5873, pivot: 0.52 }),

  make('blouses', 'blouses', '01-gold-half-sleeve.png', { slug: 'gold', short: 'Gold', title: 'Gold Half-Sleeve Blouse', note: 'Half sleeve', hex: '#c9a04a', aspect: 1.1377, pivot: 0.49 }),
  make('blouses', 'blouses', '02-emerald-elbow-sleeve.png', { slug: 'emerald', short: 'Emerald', title: 'Emerald Elbow-Sleeve Blouse', note: 'Elbow sleeve', hex: '#1f5a3a', aspect: 1.3694, pivot: 0.496 }),
  make('blouses', 'blouses', '03-ruby-full-sleeve.png', { slug: 'ruby', short: 'Ruby', title: 'Ruby Full-Sleeve Blouse', note: 'Full sleeve', hex: '#9b1630', aspect: 0.9316, pivot: 0.505 }),
  make('blouses', 'blouses', '04-ivory-sleeveless.png', { slug: 'ivory', short: 'Ivory', title: 'Ivory Sleeveless Blouse', note: 'Sleeveless', hex: '#e7dcc0', aspect: 0.8539, pivot: 0.501 }),

  make('dupattas', 'dupattas', '01-rose-pink.png', { slug: 'rose', short: 'Rose Pink', title: 'Rose Pink Dupatta', hex: '#c0245c', aspect: 0.3518, pivot: 0.479 }),
  make('dupattas', 'dupattas', '02-ivory-organza.png', { slug: 'ivory', short: 'Ivory Organza', title: 'Ivory Organza Dupatta', hex: '#e7dcc0', aspect: 0.4218, pivot: 0.5 }),
  make('dupattas', 'dupattas', '03-emerald-banarasi.png', { slug: 'emerald', short: 'Emerald Banarasi', title: 'Emerald Banarasi Dupatta', hex: '#1f5a3a', aspect: 0.3755, pivot: 0.459 }),
  make('dupattas', 'dupattas', '04-mustard-chanderi.png', { slug: 'mustard', short: 'Mustard Chanderi', title: 'Mustard Chanderi Dupatta', hex: '#d49a1c', aspect: 0.3827, pivot: 0.518 }),

  make('dress-materials', 'dress-materials', '01-ivory-floral.png', { slug: 'ivory', short: 'Ivory Floral', title: 'Ivory Floral Dress Material', hex: '#e7dcc0', aspect: 0.4645, pivot: 0.54 }),
  make('dress-materials', 'dress-materials', '02-indigo-floral.png', { slug: 'indigo', short: 'Indigo Floral', title: 'Indigo Floral Dress Material', hex: '#26357a', aspect: 0.4845, pivot: 0.462 }),
  make('dress-materials', 'dress-materials', '03-blush-pink.png', { slug: 'blush', short: 'Blush Pink', title: 'Blush Pink Dress Material', hex: '#e7a5b0', aspect: 0.5364, pivot: 0.471 }),
  make('dress-materials', 'dress-materials', '04-sage-green.png', { slug: 'sage', short: 'Sage Green', title: 'Sage Green Dress Material', hex: '#9db08a', aspect: 0.5218, pivot: 0.431 }),
]

/** One piece from every category, as on the design's rail. */
export const collection = categories.map((c) => wardrobe.find((w) => w.category === c.id))

// inside one category the pieces are shown larger than on the all-collections rail
const BLOUSE_WIDTH = 300
const roomier = (w) => {
  if (w.category === 'blouses') return { ...w, size: Math.min(0.66, BLOUSE_WIDTH / (BASE_H * w.aspect)) }
  if (w.category === 'dress-materials') return { ...w, size: 0.78 }
  return w
}

/** The pieces shown for a tab ('all' = one from every category). */
export const piecesFor = (tab) => (tab === 'all' ? collection : wardrobe.filter((w) => w.category === tab).map(roomier))

export const categoryLabel = (id) => categories.find((c) => c.id === id)?.label ?? ''
