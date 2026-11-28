// Data for the Styling Studio.
//
// DEMO DATA: the products, ids and prices below are sample values from the concept kit
// (public/AANCHAL-Styling-Kit/catalogue.json). Map `id` to real catalogue ids before production.
//
// PREVIEWS: the kit ships all 45 saree x blouse x earrings combinations as COMPLETE model images
// (looks.json is the source of truth). Exactly one image is shown at a time; nothing is layered
// or recoloured. They are generated concept previews, not exact product reproductions.
import looks from './styling-looks.json'

const base = '/images/styling-studio'

export const STUDIO_ROOM = `${base}/room.webp`
export const STUDIO_MODEL_SIZE = { width: 1024, height: 1536 }

export const SAREE_PRICE = 18500

export const sarees = [
  { id: 'emerald', name: 'Emerald saree', hex: '#0f5a3a', price: SAREE_PRICE, image: `${base}/sarees/emerald.webp` },
  { id: 'magenta', name: 'Magenta saree', hex: '#b3125f', price: SAREE_PRICE, image: `${base}/sarees/magenta.webp` },
  { id: 'mustard', name: 'Mustard saree', hex: '#d49a1c', price: SAREE_PRICE, image: `${base}/sarees/mustard.webp` },
  { id: 'ruby', name: 'Ruby saree', hex: '#a3112e', price: SAREE_PRICE, image: `${base}/sarees/ruby.webp` },
  { id: 'navy', name: 'Navy saree', hex: '#14214f', price: SAREE_PRICE, image: `${base}/sarees/navy.webp` },
]

export const blouses = [
  { id: 'gold', name: 'Gold silk blouse', price: 2800, image: `${base}/blouses/gold.webp` },
  { id: 'emerald', name: 'Emerald silk blouse', price: 2400, image: `${base}/blouses/emerald.webp` },
  { id: 'ivory', name: 'Ivory silk blouse', price: 3200, image: `${base}/blouses/ivory.webp` },
]

export const earrings = [
  { id: 'jhumkas', name: 'Gold-tone jhumkas', price: 1200, image: `${base}/jewellery/jhumkas.webp` },
  { id: 'pearl', name: 'Pearl-drop earrings', price: 1500, image: `${base}/jewellery/pearl.webp` },
  { id: 'temple', name: 'Temple earrings', price: 1800, image: `${base}/jewellery/temple.webp` },
]

export const BLOUSE_SIZES = ['XS', 'S', 'M', 'L', 'XL']

export const DEFAULT_LOOK = { saree: 'emerald', blouse: 'gold', earrings: 'jhumkas', size: '' }

export const LOOK_COUNT = looks.length

/** Look id, e.g. "navy__emerald__temple". */
export const lookKey = (l) => `${l.saree}__${l.blouse}__${l.earrings}`

const LOOK_SRC = Object.fromEntries(looks.map((l) => [l.id, `${base}/${l.image}`]))

/** Model image URL for a combination (every combination has one), or undefined for an invalid id. */
export const lookSrc = (l) => LOOK_SRC[lookKey(l)]

/**
 * Hotspots on the model. x / y are the dot on the figure, lx / ly the label centre, all as
 * fractions of the 1024x1536 model canvas (the label sits in the empty margin, off the face and hands).
 */
export const hotspots = [
  { tab: 'saree', label: 'Saree', target: 'the pallu', x: 0.62, y: 0.22, lx: 0.86, ly: 0.225 },
  { tab: 'blouse', label: 'Blouse', target: 'the sleeve', x: 0.3, y: 0.25, lx: 0.13, ly: 0.17 },
  { tab: 'jewellery', label: 'Jewellery', target: 'an earring', x: 0.532, y: 0.133, lx: 0.82, ly: 0.08 },
]

export const TABS = [
  { id: 'saree', label: 'Saree' },
  { id: 'blouse', label: 'Blouse' },
  { id: 'jewellery', label: 'Jewellery' },
  { id: 'look', label: 'Look' },
]

export const formatPrice = (n) => `₹${n.toLocaleString('en-IN')}`
