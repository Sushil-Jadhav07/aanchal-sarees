// Data for the "signature-drape" section. Images live in public/images/.

export const drapeModels = {
  emerald: {
    src: `/images/signature-drape/01-emerald-model.png`,
    alt: 'Model in an emerald green silk saree with a gold zari border, standing full length.',
    // hotspot positions are % of the 887x1774 image box
    hotspots: [
      { id: 'pallu', x: 56, y: 19, title: 'The pallu', text: 'The decorated end of the saree, draped over the shoulder.' },
      { id: 'pleats', x: 43, y: 58, title: 'The pleats', text: 'Pleats gathered at the waist so the border falls cleanly.' },
      { id: 'hem', x: 36, y: 86, title: 'The border', text: 'A woven zari border at the hem, finished with tasselled ends.' },
    ],
  },
  magenta: {
    src: `/images/signature-drape/02-magenta-model.png`,
    alt: 'Model in a magenta and gold silk saree, standing full length.',
    hotspots: [
      { id: 'pallu', x: 61, y: 23, title: 'The pallu', text: 'A rich zari pallu is the focal point of this drape.' },
      { id: 'border', x: 54, y: 53, title: 'The border', text: 'A broad traditional border runs down the front of the saree.' },
    ],
  },
}

export const drapeProducts = [
  { id: 'sig-emerald-zari', name: 'Emerald Zari Silk', note: 'Woven zari buttas', hex: '#0c6b4b', fabric: `/images/shared/fabrics/emerald.png`, fabricAlt: 'Close-up of emerald silk with a gold paisley border.', model: 'emerald' },
  { id: 'sig-magenta-kanjivaram', name: 'Magenta Kanjivaram', note: 'Traditional border', hex: '#a3206a', fabric: `/images/shared/fabrics/purple-peacock.png`, fabricAlt: 'Close-up of magenta silk with a gold peacock border.', model: 'magenta', approx: true },
  { id: 'sig-mustard-silk', name: 'Mustard Silk', note: 'Temple weave', hex: '#d69a1c', fabric: `/images/shared/fabrics/mustard.png`, fabricAlt: 'Close-up of mustard silk with a gold floral border.', model: null },
  { id: 'sig-ruby-banarasi', name: 'Ruby Banarasi Silk', note: 'Floral zari', hex: '#9a1630', fabric: `/images/shared/fabrics/ruby.png`, fabricAlt: 'Close-up of ruby red silk with gold floral zari.', model: null },
  { id: 'sig-navy-silk', name: 'Navy Silk', note: 'Gold floral borders', hex: '#1d2a5b', fabric: `/images/shared/fabrics/navy.png`, fabricAlt: 'Close-up of navy silk with gold floral zari.', model: null },
]
