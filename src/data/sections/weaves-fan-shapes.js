// Shapes of the curved weave fan, traced from the 1896px-wide reference design.
// All numbers are reference pixels inside a 1896 x 800 stage.
//
// A path is [startPoint, ...segments]. A segment with one point is a straight line,
// with three points it is a cubic curve (control 1, control 2, end).

export const STAGE = { w: 1896, h: 800 }

export const fanCards = {
  banarasi: {
    path: [
      [104, 172],
      [[170, 157], [232, 153], [300, 157]],
      [[380, 163], [448, 186], [501, 214]],
      [[526, 350], [552, 500], [575, 636]],
      [[452, 646], [298, 664], [153, 703]],
      [[138, 530], [121, 350], [104, 172]],
    ],
    // photo position: left, top, width (height follows the 3:4 photo)
    photo: { x: 108, y: 150, w: 436 },
    color: ['#c2740a', '#9a5501'],
    label: { x: 226, bottom: 526, tilt: -4, size: 4.15 },
    z: 1,
  },
  kanjivaram: {
    path: [
      [493, 177],
      [[550, 169], [622, 170], [690, 179]],
      [[790, 192], [868, 216], [940, 249]],
      [[964, 616]],
      [[850, 605], [708, 612], [576, 634]],
      [[548, 480], [516, 320], [493, 177]],
    ],
    photo: { x: 474, y: 150, w: 496 },
    color: ['#4a1229', '#2e0918'],
    label: { x: 630, bottom: 590, tilt: -4, size: 3.8 },
    z: 2,
  },
  paithani: {
    path: [
      [932, 208],
      [[990, 224], [1052, 231], [1122, 230]],
      [[1218, 229], [1296, 212], [1367, 188]],
      [[1362, 340], [1350, 510], [1342, 653]],
      [[1224, 640], [1082, 623], [953, 614]],
      [[946, 480], [938, 330], [932, 208]],
    ],
    photo: { x: 937, y: 188, w: 424 },
    color: ['#03442a', '#012d16'],
    label: { x: 1030, bottom: 551, tilt: 0.5, size: 3.98 },
    z: 4,
  },
  chanderi: {
    path: [
      [1346, 228],
      [[1440, 212], [1522, 186], [1612, 163]],
      [[1682, 146], [1744, 146], [1793, 161]],
      [[1788, 330], [1782, 550], [1776, 721]],
      [[1640, 692], [1492, 664], [1332, 647]],
      [[1346, 228]],
    ],
    photo: { x: 1304, y: 139, w: 482 },
    color: ['#d2593a', '#a8401f'],
    label: { x: 1428, bottom: 576, tilt: 1.5, size: 4.05 },
    z: 3,
  },
}

// Folded orange edge peeking out behind the last card.
export const fanFold = [
  [1776, 199],
  [[1798, 197], [1822, 202], [1839, 208]],
  [[1828, 340], [1806, 540], [1782, 690]],
  [[1760, 686]],
  [[1776, 199]],
]

// Silk "wings" behind the outer cards. They run off both ends of the stage, i.e. to the screen edges.
export const fanWings = {
  left: {
    path: [
      [192, 262],
      [[150, 254], [112, 253], [73, 258]],
      [[44, 261], [16, 268], [-4, 278]],
      [[-4, 668]],
      [[34, 641], [66, 624], [102, 611]],
      [[128, 601], [160, 598], [192, 597]],
      [[192, 262]],
    ],
    // ribbon image placement: scale, x, y
    ribbon: { scale: 0.858, x: -4, y: 70 },
  },
  right: {
    path: [
      [1750, 330],
      [[1778, 315], [1806, 306], [1830, 296]],
      [[1854, 286], [1874, 275], [1900, 264]],
      [[1900, 704]],
      [[1856, 696], [1818, 686], [1780, 669]],
      [[1770, 664], [1760, 662], [1750, 660]],
      [[1750, 330]],
    ],
    ribbon: { scale: 0.952, x: 1747, y: 92 },
  },
}

export const RIBBON_SIZE = { w: 2172, h: 724 }
