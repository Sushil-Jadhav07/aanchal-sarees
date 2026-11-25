import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { styling } from '../../data/sections/styling'
import { useElementWidth } from '../../hooks/useElementWidth'
import { useLoopCarousel, wrapOffset } from '../../hooks/useLoopCarousel'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import { arrowKeys } from '../../hooks/useSwipe'
import { Lightbox } from '../shared/ui'
import '@fontsource-variable/newsreader/opsz.css'
import '../../styles/styling.css'

/** The design's long, thin arrow. */
const LongArrow = () => (
  <svg viewBox="0 0 40 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="st-long">
    <path d="M1 7h37M32 1.5 38 7l-6 5.5" />
  </svg>
)

const COUNT = styling.length
const START = 2 // "Everyday elegance" in the centre
const AUTOPLAY_MS = 3000 // moves to the next photo every 3 seconds

// Row geometry measured from the design (1672 px wide canvas; the row is 1596 px wide, 605 px tall).
// `d` = distance from the centre card in steps; x = card centre from the row centre.
const ROW = { w: 1596, h: 605 }
const SLOTS = [
  { d: 0, x: 0, w: 350, h: 605, bottom: 0 },
  { d: 1, x: 338, w: 300, h: 503, bottom: 30 },
  { d: 2, x: 649.5, w: 297, h: 452, bottom: 34 },
  { d: 3, x: 961, w: 297, h: 452, bottom: 34 },
]
const lerp = (a, b, t) => a + (b - a) * t
/** Size and place of a card for a fractional distance from the centre (smooth between the design's slots). */
function slotAt(distance) {
  const d = Math.min(3, Math.abs(distance))
  const i = Math.min(SLOTS.length - 2, Math.floor(d))
  const a = SLOTS[i]
  const b = SLOTS[i + 1]
  const t = d - i
  const sign = distance < 0 ? -1 : 1
  return { x: sign * lerp(a.x, b.x, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t), bottom: lerp(a.bottom, b.bottom, t) }
}

/**
 * Silk, in motion: five portrait cards, the chosen one tallest in the middle and the others stepping down
 * in height on either side (as in the design), each with the design's play mark. On wide screens the row loops
 * endlessly and moves on by itself every 3 s; below 900px it is a swipeable strip. There are no films yet, so
 * a card (or "View all films") opens the photos in the larger gallery.
 */
export default function StylingGallery() {
  const root = useRef(null)
  const cards = useRef([])
  const drag = useRef(null)
  const swiped = useRef(false)
  const [rowRef, W] = useElementWidth()
  const [open, setOpen] = useState(null)
  const { ref: stripRef, index: stripIndex, goTo: stripGoTo, onScroll: stripScroll } = useSnapScroller(COUNT, START)
  useReveal(root)
  const count = COUNT
  const wide = W > 0 // the looping row is only shown (and measured) on wide screens
  const k = (W || ROW.w) / ROW.w // screen px per design px

  // draws every card for a fractional position; sizes and places morph smoothly from one slot to the next
  const paint = useCallback(
    (position) => {
      const scale = (W || ROW.w) / ROW.w
      styling.forEach((_, i) => {
        const el = cards.current[i]
        if (!el) return
        const offset = wrapOffset(i - position, COUNT)
        const distance = Math.abs(offset)
        const q = slotAt(offset)
        // fully faded just before it wraps round at 2.5, so the jump is never seen
        const opacity = distance <= 2 ? 1 : Math.max(0, 1 - (distance - 2) / 0.45)
        el.style.width = `${q.w * scale}px`
        el.style.height = `${q.h * scale}px`
        el.style.transform = `translate3d(${(ROW.w / 2 + q.x - q.w / 2) * scale}px, ${(ROW.h - q.bottom - q.h) * scale}px, 0)`
        el.style.opacity = opacity
        el.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
        el.style.zIndex = 40 - Math.round(distance * 10)
        el.dataset.level = Math.min(2, Math.round(distance))
      })
    },
    [W],
  )

  const loop = useLoopCarousel({ count, start: START, delayMs: AUTOPLAY_MS, paint, areaRef: rowRef })
  const active = wide ? loop.index : stripIndex
  const prev = () => (wide ? loop.step(-1) : stripGoTo(stripIndex - 1))
  const next = () => (wide ? loop.step(1) : stripGoTo(stripIndex + 1))
  const jump = (i) => (wide ? loop.goTo(i) : stripGoTo(i))

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    swiped.current = false
    drag.current = { x: e.clientX, lastX: e.clientX, time: e.timeStamp, speed: 0, from: null }
  }
  const onPointerMove = (e) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (d.from === null) {
      if (Math.abs(dx) < 8) return
      d.from = loop.dragStart()
      swiped.current = true
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    d.speed = (e.clientX - d.lastX) / Math.max(1, e.timeStamp - d.time)
    d.lastX = e.clientX
    d.time = e.timeStamp
    loop.dragMove(d.from - dx / (338 * k))
  }
  const onPointerEnd = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || d.from === null) return
    const speed = e.timeStamp - d.time < 90 ? d.speed : 0
    loop.dragEnd(Math.max(-1, Math.min(1, (-speed * 160) / (338 * k))))
  }

  const photo = (s) => (
    <>
      <img src={s.src} alt={s.alt} width={1024} height={1536} loading="lazy" decoding="async" draggable="false" className="st-card-img" style={{ objectPosition: s.pos }} />
      <span aria-hidden="true" className="st-shade" />
      {/* the design's play mark; there are no films yet, so it opens the photo in the larger viewer */}
      <span aria-hidden="true" className="st-play">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.6-6.8a.6.6 0 0 0 0-1L8.92 4.7A.6.6 0 0 0 8 5.2Z" />
        </svg>
      </span>
      <span className="st-cap">
        {s.caption}
        <span className="st-dot">.</span>
      </span>
    </>
  )

  return (
    <section id="styling" ref={root} aria-labelledby="styling-title" className="st-section">
      <div className="st-wrap">
        <div className="st-canvas">
          <div className="st-head">
            <p className="st-eyebrow" data-reveal>
              Ways to wear. Moments to remember.
            </p>
            <h2 id="styling-title" className="st-title" data-reveal>
              Silk, in motion.
            </h2>
            <button type="button" className="st-all" onClick={() => setOpen(0)} data-reveal>
              View all films
              <LongArrow />
            </button>
          </div>

          {/* wide screens: an endless loop; the card in the middle is tallest, the rest step down on both sides */}
          <div
            ref={rowRef}
            className="st-row touch-pan-y"
            role="group"
            aria-roledescription="carousel"
            aria-label="Styling photos"
            tabIndex={0}
            onKeyDown={arrowKeys({ onPrev: prev, onNext: next })}
            onFocus={(e) => e.target.matches(':focus-visible') && loop.setFocus(true)}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && loop.setFocus(false)}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            data-reveal
          >
            {styling.map((s, i) => {
              const sel = i === active
              return (
                <button
                  key={s.id}
                  ref={(el) => (cards.current[i] = el)}
                  type="button"
                  className="st-card"
                  onClick={() => !swiped.current && (sel ? setOpen(i) : loop.goTo(i))}
                >
                  {photo(s)}
                  <span className="sr-only">{sel ? '. Open larger view' : '. Show this photo'}</span>
                </button>
              )
            })}
          </div>

          {/* narrow screens: one main card with a partial next card */}
          <div ref={stripRef} onScroll={stripScroll} tabIndex={0} role="group" aria-label="Styling photos, swipe to browse" className="st-strip">
            {styling.map((s, i) => (
              <button key={s.id} type="button" className="st-card-m" onClick={() => (i === active ? setOpen(i) : stripGoTo(i))}>
                {photo(s)}
                <span className="sr-only">{i === active ? '. Open larger view' : '. Show this photo'}</span>
              </button>
            ))}
          </div>

          <div className="st-controls" data-reveal>
            <button type="button" className="st-circle" onClick={prev} disabled={!wide && active === 0} aria-label="Previous photo">
              <ArrowLeft size={20} strokeWidth={1.4} aria-hidden="true" />
            </button>
            <div
              className="st-line"
              role="progressbar"
              aria-label="Photo position"
              aria-valuemin={1}
              aria-valuemax={count}
              aria-valuenow={active + 1}
              aria-valuetext={`Photo ${active + 1} of ${count}`}
            >
              <span style={{ width: `${100 / count}%`, left: `${(active * 100) / count}%` }} />
            </div>
            <button type="button" className="st-circle" onClick={next} disabled={!wide && active === count - 1} aria-label="Next photo">
              <ArrowRight size={20} strokeWidth={1.4} aria-hidden="true" />
            </button>
          </div>

          <div className="st-cta-wrap" data-reveal>
            <button type="button" className="st-cta" onClick={() => setOpen(active)}>
              Explore styling
              <LongArrow />
            </button>
          </div>
        </div>
      </div>

      {open !== null && (
        <Lightbox
          items={styling.map((s) => ({ src: s.src, alt: s.alt, caption: s.caption }))}
          index={open}
          onIndex={(i) => {
            setOpen(i)
            jump(i)
          }}
          onClose={() => setOpen(null)}
          label="Styling gallery"
        />
      )}
    </section>
  )
}
