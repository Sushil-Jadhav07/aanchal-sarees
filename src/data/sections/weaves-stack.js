// Data for the "weaves-stack" section. Images live in public/images/.
// Each card is built from two layers so it can move in 3D:
//   backdrop  the silk behind (opaque)
//   model     transparent cut-out of the model, same size as its backdrop
// shade: colour of the soft gradient behind the card's name, matched to its silk.

const DIR = '/images/weaves-stack/layers'

export const weaves = [
  {
    id: 'banarasi',
    name: 'Banarasi',
    cta: 'Explore Banarasi',
    model: `${DIR}/01-banarasi-model.png`,
    backdrop: `${DIR}/01-banarasi-backdrop.png`,
    shade: '#470819',
    alt: 'Woman in a ruby Banarasi saree with gold zari and jasmine in her hair.',
    href: null,
  },
  {
    id: 'kanjivaram',
    name: 'Kanjivaram',
    cta: 'Explore Kanjivaram',
    model: `${DIR}/02-kanjivaram-model.png`,
    backdrop: `${DIR}/02-kanjivaram-backdrop.png`,
    shade: '#062a1a',
    alt: 'Woman in an emerald green Kanjivaram saree with a broad gold border and jasmine in her hair.',
    href: null,
  },
  {
    id: 'paithani',
    name: 'Paithani',
    cta: 'Explore Paithani',
    model: `${DIR}/03-paithani-model.png`,
    backdrop: `${DIR}/03-paithani-backdrop.png`,
    shade: '#35062c',
    alt: 'Woman in a magenta Paithani saree with gold borders, peacocks and pink flowers.',
    href: null,
  },
  {
    id: 'peacock-paithani',
    name: 'Peacock Paithani',
    cta: 'Explore Peacock Paithani',
    model: `${DIR}/04-peacock-paithani-model.png`,
    backdrop: `${DIR}/04-peacock-paithani-backdrop.png`,
    shade: '#3d0536',
    alt: 'Woman in a magenta Paithani saree with peacock borders and jasmine in her hair.',
    href: null,
  },
]
