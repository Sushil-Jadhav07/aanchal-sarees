// Site-wide data: header menu and footer links.
// href: null means the destination does not exist yet (the UI says so explicitly).

export const NAV = [
  { label: 'Silk Orbit', href: '#silk-orbit' },
  { label: 'Occasions', href: '#moods' },
  { label: 'Weaves', href: '#weaves' },
  { label: 'Wardrobe', href: '#wardrobe' },
  { label: 'Craft', href: '#craft' },
  { label: 'Bridal', href: '#bridal' },
  { label: 'Styling', href: '#styling' },
  { label: 'Shop', href: '#shop' },
]

export const footerColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Sarees', href: '#shop' },
      { label: 'New Arrivals', href: null },
      { label: 'Collections', href: '#weaves' },
      { label: 'By Weave', href: '#weaves' },
      { label: 'By Occasion', href: '#moods' },
    ],
  },
  {
    title: 'About',
    links: [
      { label: 'Our Story', href: '#craft' },
      { label: 'The Weaves', href: '#weaves' },
      { label: 'Craft & Artisans', href: '#craft' },
      { label: 'Journal', href: null },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'FAQs', href: null },
      { label: 'Shipping', href: null },
      { label: 'Returns & Exchanges', href: null },
      { label: 'Contact Us', href: null },
    ],
  },
]

// No social accounts have been supplied; these are shown as not connected.
export const socials = ['Instagram', 'Facebook', 'Pinterest', 'YouTube']
