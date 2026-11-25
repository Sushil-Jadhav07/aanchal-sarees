import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { fanPanels, fanRibbon } from '../../data/sections/weaves-fan'
import { fanCards, fanFold, fanWings, RIBBON_SIZE, STAGE } from '../../data/sections/weaves-fan-shapes'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import { CollectionDialog } from '../shared/dialogs'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/weaves-fan.css'

const N = fanPanels.length

/** Points along a traced path (see weaves-fan-shapes.js), fine enough to look perfectly smooth. */
function sample(path, steps = 28) {
  let from = path[0]
  const points = [from]
  path.slice(1).forEach((segment) => {
    if (segment.length === 1) {
      from = segment[0]
      points.push(from)
      return
    }
    const [c1, c2, to] = segment
    for (let i = 1; i <= steps; i += 1) {
      const t = i / steps
      const u = 1 - t
      points.push([0, 1].map((k) => u * u * u * from[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * to[k]))
    }
    from = to
  })
  return points
}

const pct = (n) => `${(n * 100).toFixed(3)}%`

/** Turns a path into a positioned box plus a clip-path relative to that box. */
function shape(path) {
  const points = sample(path)
  const xs = points.map((q) => q[0])
  const ys = points.map((q) => q[1])
  const box = { x: Math.min(...xs), y: Math.min(...ys) }
  box.w = Math.max(...xs) - box.x
  box.h = Math.max(...ys) - box.y
  const d = path
    .map((s, i) => (i === 0 ? `M${s}` : s.length === 1 ? `L${s[0]}` : `C${s.join(' ')}`))
    .join(' ')
  return {
    box,
    d,
    style: {
      left: pct(box.x / STAGE.w),
      top: pct(box.y / STAGE.h),
      width: pct(box.w / STAGE.w),
      height: pct(box.h / STAGE.h),
    },
    clip: `polygon(${points.map(([x, y]) => `${pct((x - box.x) / box.w)} ${pct((y - box.y) / box.h)}`).join(',')})`,
  }
}

/** Position of a reference rectangle inside a shape's box. */
const within = (box, x, y, w) => ({ left: pct((x - box.x) / box.w), top: pct((y - box.y) / box.h), width: pct(w / box.w) })

const CARDS = Object.fromEntries(Object.entries(fanCards).map(([id, c]) => [id, { ...c, ...shape(c.path) }]))
const FOLD = shape(fanFold)
const WINGS = Object.fromEntries(Object.entries(fanWings).map(([id, w]) => [id, { ...w, ...shape(w.path) }]))

function Wing({ side }) {
  const { box, style, clip, ribbon } = WINGS[side]
  return (
    <div aria-hidden="true" className={`wf-shape wf-wing wf-wing-${side}`} style={style} data-reveal>
      <div className="wf-clip" style={{ clipPath: clip }}>
        <img
          src={fanRibbon}
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
          style={within(box, ribbon.x, ribbon.y, RIBBON_SIZE.w * ribbon.scale)}
        />
        {/* darkens the silk where it disappears behind the card */}
        <span className="wf-shade" />
      </div>
    </div>
  )
}

function Fold() {
  const { box, style, clip } = FOLD
  // the gold rolled edge of the ribbon image, mapped onto the fold
  const s = box.w / 78
  return (
    <div aria-hidden="true" className="wf-shape wf-fold" style={{ ...style, zIndex: 2 }}>
      <div className="wf-clip" style={{ clipPath: clip }}>
        <img
          src={fanRibbon}
          alt=""
          loading="lazy"
          decoding="async"
          draggable="false"
          style={within(box, box.x - 1612 * s, box.y - 100 * s, RIBBON_SIZE.w * s)}
        />
      </div>
    </div>
  )
}

function Card({ panel, onOpen }) {
  const { box, style, clip, d, photo, color, label, z } = CARDS[panel.id]
  const placed = within(box, photo.x, photo.y, photo.w)
  const gradientId = `wf-edge-${panel.id}`
  return (
    <div className="wf-shape wf-card" style={{ ...style, zIndex: z + 2 }} data-reveal-card>
      <button
        type="button"
        onClick={onOpen}
        className="wf-clip"
        style={{ clipPath: clip, background: `linear-gradient(to bottom, ${color[0]}, ${color[1]})` }}
      >
        {/* mirrored copy continues the photo to the card's right edge when needed */}
        <img src={panel.src} alt="" aria-hidden="true" loading="lazy" decoding="async" draggable="false" className="wf-photo wf-photo-fill" style={within(box, photo.x + photo.w - 1, photo.y, photo.w)} />
        <img src={panel.src} alt={panel.alt} width={1086} height={1448} loading="lazy" decoding="async" draggable="false" className="wf-photo wf-photo-main" style={placed} />
        <span aria-hidden="true" className="wf-light" />
        <svg aria-hidden="true" className="wf-edge" viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#fff2d6" stopOpacity="0.6" />
              <stop offset="0.5" stopColor="#fff2d6" stopOpacity="0.1" />
              <stop offset="1" stopColor="#fff2d6" stopOpacity="0.26" />
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke={`url(#${gradientId})`} strokeWidth="5" />
        </svg>
        <span
          className="wf-name"
          style={{
            left: pct((label.x - box.x) / box.w),
            bottom: pct((box.y + box.h - label.bottom) / box.h),
            translate: '-50% 0',
            rotate: `${180 + label.tilt}deg`,
            fontSize: `${label.size}cqw`,
            transformOrigin: 'center',
          }}
        >
          {panel.name}
        </span>
        <span className="sr-only">: open collection preview</span>
      </button>
    </div>
  )
}

/** A journey through the weaves: curved silk fan (desktop) / swipeable cards (below 1024px). */
export default function WeavesFan() {
  const root = useRef(null)
  const [open, setOpen] = useState(null)
  const { ref: strip, index, goTo, onScroll } = useSnapScroller(N, 0)
  useReveal(root, { y: 24, stagger: 0.1 })
  useReveal(root, { selector: '[data-reveal-card]', y: 0, stagger: 0.16 })

  return (
    <section id="weaves-fan" ref={root} aria-label="A journey through the weaves" className="relative overflow-hidden bg-cream">
      {/* ------------------------------------------------ Desktop: traced from the reference */}
      <div className="hidden py-6 lg:block">
        <div className="wf-stage">
          <h2 className="wf-title" data-reveal>
            A journey through <em>the weaves.</em>
          </h2>
          <Wing side="left" />
          <Wing side="right" />
          <ul className="wf-cards" aria-label="Weave collections">
            {fanPanels.map((p, i) => (
              <li key={p.id}>
                {p.id === 'chanderi' && <Fold />}
                <Card panel={p} onOpen={() => setOpen(i)} />
              </li>
            ))}
          </ul>
          <a href="#weaves" className="wf-cta">
            Explore the weaves
            <ArrowRight style={{ width: '1.9cqw', height: '1.9cqw' }} strokeWidth={1.6} aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* ------------------------------------------------ Phone / tablet: swipeable cards */}
      <div className="px-4 py-16 lg:hidden">
        <h2 className="font-display text-center text-[2.5rem] font-semibold text-wine sm:text-6xl">
          A journey through <em className="font-medium text-gold-deep">the weaves.</em>
        </h2>
        <ul
          ref={strip}
          onScroll={onScroll}
          aria-label="Weave collections"
          className="no-scrollbar relative -mx-4 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[9vw] py-4"
        >
          {fanPanels.map((p, i) => (
            <li key={p.id} className="w-[76vw] max-w-[360px] shrink-0 snap-center">
              <button type="button" onClick={() => setOpen(i)} className="relative block aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-2xl text-left">
                <img src={p.src} alt={p.alt} width={1086} height={1448} loading="lazy" decoding="async" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
                <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-5 font-serif text-4xl leading-none text-cream">{p.name}</span>
                <span className="sr-only">: open collection preview</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-center gap-1" role="group" aria-label="Choose weave">
          {fanPanels.map((p, i) => (
            <button key={p.id} type="button" onClick={() => goTo(i)} aria-label={`Show ${p.name}`} aria-current={i === index} className="grid h-11 w-8 place-items-center">
              <span className={`block h-2 rounded-full transition-all ${i === index ? 'w-6 bg-wine' : 'w-2 bg-gold/70'}`} />
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-center">
          <a href="#weaves" className="inline-flex min-h-14 items-center gap-3 rounded-full border border-wine px-9 font-serif text-xl font-medium text-wine transition-colors hover:bg-wine hover:text-cream">
            Explore the weaves
            <ArrowRight size={20} aria-hidden="true" />
          </a>
        </div>
      </div>

      {open !== null && <CollectionDialog item={fanPanels[open]} title={fanPanels[open].name} onClose={() => setOpen(null)} />}
    </section>
  )
}
