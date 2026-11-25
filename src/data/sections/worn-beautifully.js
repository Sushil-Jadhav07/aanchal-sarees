// Data for the "worn-beautifully" section. Images live in public/images/.

export const wornBackground = `/images/shared/backgrounds/wine-brocade.png`

// Wording copied from the reference design. The photos are illustrative (generated) imagery, so before
// launch either use real customer stories or soften "Real stories. Real drapes." and "My Aanchal Bridal Story".
export const wornCopy = {
  title: 'Worn beautifully.',
  highlight: 'Remembered forever.',
  lines: ['Real stories. Real drapes.', 'Moments made special with Aanchal.'],
}

// `lines` = caption line breaks; `pos` = which part of the photo stays in view.
export const wornStories = [
  {
    id: 'mothers-heirloom',
    silk: 'Emerald silk',
    caption: 'A Mother’s Heirloom',
    lines: ['A Mother’s', 'Heirloom'],
    text: 'An emerald drape passed down and worn again, styled in a garden.',
    src: `/images/worn-beautifully/01-mothers-heirloom.png`,
    alt: 'Woman in a green and gold saree looking up in a leafy garden.',
    pos: '61% 25%',
  },
  {
    id: 'festive-return',
    silk: 'Mustard silk',
    caption: 'The Festive Return',
    lines: ['The Festive', 'Return'],
    text: 'Mustard silk by lamplight, styled for coming home.',
    src: `/images/worn-beautifully/02-festive-return.png`,
    alt: 'Woman in a mustard silk saree among glowing lamps.',
    pos: '65% 22%',
  },
  {
    id: 'bridal-aanchal-story',
    silk: 'Crimson bridal silk',
    caption: 'My Aanchal Bridal Story',
    lines: ['My Aanchal', 'Bridal Story'],
    text: 'A crimson bridal drape with temple jewellery and fresh flowers.',
    src: `/images/worn-beautifully/03-bridal-noolam.png`,
    alt: 'Bride in a crimson saree with gold jewellery, looking upward.',
    pos: '51% 25%',
  },
  {
    id: 'draped-for-diwali',
    silk: 'Purple and gold silk',
    caption: 'Draped for Diwali',
    lines: ['Draped', 'for Diwali'],
    text: 'A purple blouse and gold pallu for the festival of lights.',
    src: `/images/worn-beautifully/04-draped-for-diwali.png`,
    alt: 'Woman with a purple blouse and gold saree, looking towards the light.',
    pos: '50% 25%',
  },
  {
    id: 'every-chapter',
    silk: 'Green and gold silk',
    caption: 'A Silk for Every Chapter',
    lines: ['A Silk', 'for Every Chapter'],
    text: 'Green and gold, seated and unhurried.',
    src: `/images/worn-beautifully/05-every-chapter.png`,
    alt: 'Seated woman in a green silk saree with a gold border.',
    pos: '67% 20%',
  },
]
