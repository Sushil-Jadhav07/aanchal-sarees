// Outlines of the curved arch row, traced from the 1832 x 859 reference design (numbers are reference px).
//
// Every outline has the same 12 parts in the same order, so one can morph smoothly into another while the
// carousel turns. Each part is [control1, control2, end]; a straight part is [end] only.
//   0 left edge · 1,2 left shoulder · 3,4 top · 5,6 right shoulder · 7 right edge · 8 corner · 9,10 curved base · 11 corner

export const REF = { w: 1832, h: 859, centreX: 916, rowTop: 125, rowHeight: 495 }

// distance 0 (centre): the ornate temple arch
const centre = {
  start: [720, 566],
  parts: [
    [[720, 305]],
    [[722, 264], [752, 228], [793, 221]],
    [[797, 197], [822, 180], [849, 174]],
    [[878, 167], [902, 152], [916, 132]],
    [[930, 152], [954, 167], [983, 174]],
    [[1010, 180], [1035, 197], [1039, 221]],
    [[1080, 228], [1110, 264], [1112, 305]],
    [[1112, 566]],
    [[1112, 574], [1108, 577], [1100, 576]],
    [[1040, 567], [980, 562], [916, 562]],
    [[852, 562], [792, 567], [732, 576]],
    [[724, 577], [720, 574], [720, 566]],
  ],
}

// distances 1, 2, 3 on the LEFT side (the right side is their mirror image)
const side1 = {
  start: [514, 592],
  parts: [
    [[514, 299]],
    [[514, 280], [521, 266], [534, 255]],
    [[544, 247], [556, 244], [563, 238]],
    [[578, 215], [607, 204], [640, 204]],
    [[680, 204], [716, 221], [734, 238]],
    [[742, 245], [748, 252], [750, 258]],
    [[751, 262], [752, 266], [752, 272]],
    [[752, 554]],
    [[752, 561], [749, 565], [742, 567]],
    [[706, 574], [668, 582], [628, 589]],
    [[594, 595], [560, 602], [528, 608]],
    [[518, 609], [514, 603], [514, 592]],
  ],
}
const side2 = {
  start: [314, 590],
  parts: [
    [[314, 307]],
    [[314, 292], [318, 284], [328, 274]],
    [[338, 264], [350, 261], [361, 257]],
    [[376, 232], [404, 218], [438, 218]],
    [[473, 218], [506, 231], [528, 249]],
    [[537, 256], [544, 262], [547, 268]],
    [[549, 272], [550, 276], [550, 282]],
    [[550, 558]],
    [[550, 565], [547, 569], [540, 570]],
    [[508, 575], [476, 580], [444, 586]],
    [[404, 592], [366, 597], [330, 601]],
    [[319, 602], [314, 598], [314, 590]],
  ],
}
const side3 = {
  start: [138, 550],
  parts: [
    [[138, 350]],
    [[138, 336], [142, 327], [153, 317]],
    [[163, 308], [174, 307], [183, 303]],
    [[196, 285], [220, 277], [245, 277]],
    [[275, 277], [303, 289], [320, 302]],
    [[328, 308], [335, 314], [338, 320]],
    [[339, 323], [340, 327], [340, 333]],
    [[340, 551]],
    [[340, 558], [337, 561], [330, 561]],
    [[298, 564], [266, 566], [236, 567]],
    [[205, 568], [175, 567], [158, 566]],
    [[146, 564], [138, 560], [138, 550]],
  ],
}

const STEPS = 12 // points sampled on every part

/** Samples one outline into 12 lists of points. */
function sample({ start, parts }) {
  let from = start
  return parts.map((part) => {
    const to = part[part.length - 1]
    const [c1, c2] = part.length === 1 ? [from, to] : part
    const points = Array.from({ length: STEPS + 1 }, (_, i) => {
      const t = i / STEPS
      if (part.length === 1) return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t]
      const u = 1 - t
      return [0, 1].map((k) => u * u * u * from[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * to[k])
    })
    from = to
    return points
  })
}

// which part becomes which when an outline is flipped left to right
const PARTNER = [7, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9, 8]
const mirror = (shape) =>
  PARTNER.map((source) => shape[source].map(([x, y]) => [REF.centreX * 2 - x, y]).reverse())

const flat = (shape) => shape.flat()
const left = [centre, side1, side2, side3].map(sample)
// distance 4: just outside the row, where an arch is invisible before it comes round the other side
left.push(left[3].map((part) => part.map(([x, y]) => [x - 150, y + 14])))
const LEFT = left.map(flat)
const RIGHT = [LEFT[0], ...left.slice(1).map((shape) => flat(mirror(shape)))]

/** Outline points for a card `offset` places from the centre (may be fractional, negative = left). */
export function outlineAt(offset) {
  const set = offset < 0 ? LEFT : RIGHT
  const distance = Math.min(4, Math.abs(offset))
  const lo = Math.min(3, Math.floor(distance))
  const t = distance - lo
  const a = set[lo]
  const b = set[lo + 1]
  return a.map(([x, y], i) => [x + (b[i][0] - x) * t, y + (b[i][1] - y) * t])
}

/** Cream haze over the arch (the two outermost ones are washed out in the design). */
export function hazeAt(offset) {
  const levels = [0, 0, 0.03, 0.52, 0.8]
  const distance = Math.min(4, Math.abs(offset))
  const lo = Math.min(3, Math.floor(distance))
  return levels[lo] + (levels[lo + 1] - levels[lo]) * (distance - lo)
}
