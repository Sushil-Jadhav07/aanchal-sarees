// Data for the "moods-arches" section. Images live in public/images/.

export const archMoodFrame = `/images/moods-arches/frame.png`

// photoTop: top edge of the photo, in % of the arch box. The photo is 80.5% of the box wide, so the whole
// seated figure (head to saree hem) sits inside the arch window instead of running into the pointed tip.
export const archMoods = [
  {
    id: 'classic',
    photoTop: 13.8,
    label: 'The Classic',
    src: `/images/moods-arches/01-classic-mustard.png`,
    alt: 'Seated woman in a mustard silk saree on a carved wooden sofa.',
    blurb: 'Mustard silk and timeless borders, the sarees that never ask to be explained.',
    related: ['Mustard Paithani Saree', 'Mustard Silk'],
  },
  {
    id: 'regal',
    photoTop: 13.5,
    label: 'The Regal',
    src: `/images/moods-arches/02-regal-purple.png`,
    alt: 'Seated woman in a deep purple silk saree with a broad gold border.',
    blurb: 'Deep purple and heavy zari, made for rooms that rise when you enter.',
    related: ['Royal Purple Banarasi', 'Purple Silk'],
  },
  {
    id: 'festive',
    photoTop: 15,
    label: 'The Festive',
    src: `/images/moods-arches/03-festive-emerald.png`,
    alt: 'Seated woman in an emerald green saree with gold buttas, among garden lights.',
    blurb: 'Emerald and gold for lamp-lit evenings and family gatherings.',
    related: ['Emerald Kanjivaram Saree', 'Emerald Zari Silk'],
  },
  {
    id: 'romantic',
    photoTop: 14.2,
    label: 'The Romantic',
    src: `/images/moods-arches/04-romantic-magenta.png`,
    alt: 'Woman in a magenta silk saree reclining on a leather sofa.',
    blurb: 'Magenta and rose, softened by a pale gold border.',
    related: ['Magenta Kanjivaram', 'Rose Pink Banarasi'],
  },
  {
    id: 'artisan',
    photoTop: 15,
    label: 'The Artisan',
    src: `/images/moods-arches/05-artisan-orange.png`,
    alt: 'Seated woman in a burnt orange silk saree beside a plant, in warm light.',
    blurb: 'Warm orange and hand-woven detail, for those who look closely.',
    related: ['Coral Chanderi'],
  },
  {
    id: 'contemporary',
    photoTop: 13.3,
    label: 'The Contemporary',
    src: `/images/moods-arches/06-contemporary-blue.png`,
    alt: 'Seated woman in a royal blue saree with a gold border.',
    blurb: 'Royal blue with a clean, modern line.',
    related: ['Navy Chanderi Saree', 'Navy Silk'],
  },
]
