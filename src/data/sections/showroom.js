// Data for the opening scroll hero. The frames live in public/saree-hero/{1..4}/ezgif-frame-001..240.jpg.
// The four folders are one continuous walk: storefront → doors → the showroom floor → the silk racks,
// and play back-to-back, 1 → 2 → 3 → 4.

export const HERO_FOLDERS = 4
export const FRAMES_PER_FOLDER = 240
export const HERO_TOTAL_FRAMES = HERO_FOLDERS * FRAMES_PER_FOLDER
export const HERO_FRAME_SIZE = { width: 1280, height: 720 }

/** URL of the n-th frame (0-based) of the whole 960-frame sequence. */
export function heroFrameSrc(n) {
  const folder = Math.floor(n / FRAMES_PER_FOLDER) + 1
  const frame = (n % FRAMES_PER_FOLDER) + 1
  return `/saree-hero/${folder}/ezgif-frame-${String(frame).padStart(3, '0')}.jpg`
}

export const HERO_ALT =
  'A walk through the Aanchal showroom: from the ivory storefront through its carved doors, to a woman in a green and gold silk saree among racks of Banarasi silks.'

// One chapter per folder, in order.
export const heroChapters = [
  {
    eyebrow: 'Welcome to Aanchal',
    title: 'Silk, woven with patience.',
    text: 'Arrive at a house of Banarasi, Kanjivaram and Paithani silks.',
  },
  {
    eyebrow: 'Step inside',
    title: 'Every drape, a heirloom.',
    text: 'Carved doors open onto brass lamps, red roses and halls of folded zari.',
  },
  {
    eyebrow: 'Made to be worn',
    title: 'Find the one you will pass on.',
    text: 'See how green silk and gold zari move in the light of the showroom.',
  },
  {
    eyebrow: 'The collection',
    title: 'Colour, weave and border.',
    text: 'Walk the racks at your own pace, and choose the drape that is yours.',
    cta: { label: 'Explore the collection', href: '#silk-orbit' },
  },
]
