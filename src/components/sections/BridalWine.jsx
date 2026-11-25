import { useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { bridal, bridalBackground } from '../../data/sections/bridal-wine'
import { useLoopCarousel, wrapOffset } from '../../hooks/useLoopCarousel'
import { useElementWidth } from '../../hooks/useElementWidth'
import { useReveal } from '../../hooks/useReveal'
import { arrowKeys } from '../../hooks/useSwipe'
import { PendingLink } from '../shared/ui'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/bridal-wine.css'

const COUNT = bridal.length
const START = 2 // Crimson
const AUTOPLAY_MS = 3000 // moves to the next saree every 3 seconds
const PHOTO_RATIO = 4 / 3 // the portraits are 3:4

// Card sizes per distance from the centre, derived from the stage width.
// Wide screens use the proportions of the 1672px reference (centre card 420 x 501).
function metrics(W) {
  const wide = W >= 900
  const w0 = wide ? (W * 420) / 1672 : W * 0.58
  const h0 = w0 * (wide ? 501 / 420 : 1.3)
  const w = (wide ? [1, 0.614, 0.476] : [1, 0.52, 0.4]).map((s) => w0 * s)
  const h = (wide ? [1, 0.796, 0.577] : [1, 0.8, 0.6]).map((s) => h0 * s)
  // horizontal centres: the cards sit edge to edge
  const x1 = (w[0] + w[1]) / 2
  const x2 = x1 + (w[1] + w[2]) / 2
  return { w0, w: [...w, w[2]], h: [...h, h[2]], x: [0, x1, x2, x2 + w[2]], dim: [0, 0.08, 0.56, 0.56], stageH: h0 + 24 }
}

const lerp = (a, b, t) => a + (b - a) * t
const focus = (pos) => pos.split(' ').map((v) => parseFloat(v) / 100)

const Lotus = () => (
  <svg className="br-lotus" viewBox="0 0 48 36" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
    <path d="M24 3c-5 5-7 10-7 15 0 4.5 2.8 8 7 9.5 4.2-1.5 7-5 7-9.5 0-5-2-10-7-15Z" />
    <path d="M17.5 11c-4 .5-7 1.6-8.5 3 .3 7 6 12.8 15 13.5M30.5 11c4 .5 7 1.6 8.5 3-.3 7-6 12.8-15 13.5" />
    <path d="M10 19c-3.5.2-6 1-7.5 2 2.5 5.2 10 8.5 21.5 6.5M38 19c3.5.2 6 1 7.5 2-2.5 5.2-10 8.5-21.5 6.5" />
    <path d="m24 28.5 2.6 3.200L24 35l-2.6-3.300Z" fill="currentColor" stroke="none" />
  </svg>
)

/** 11 — The Bridal edit: an endlessly looping, auto-playing focus carousel. Dimming is CSS only. */
export default function BridalWine() {
  const root = useRef(null)
  const [stageRef, W] = useElementWidth()
  const cards = useRef([])
  const photos = useRef([])
  const dims = useRef([])
  const drag = useRef(null)
  const swiped = useRef(false)
  useReveal(root)
  const m = metrics(W || 1200)

  // Draws every card for a fractional carousel position. Sizes blend smoothly between the design's slots.
  const paint = useCallback(
    (position) => {
      const size = metrics(W || 1200)
      bridal.forEach((b, i) => {
        const card = cards.current[i]
        if (!card) return
        const offset = wrapOffset(i - position, COUNT)
        const k = Math.abs(offset)
        const lo = Math.min(Math.floor(k), 2)
        const t = k - lo
        const w = lerp(size.w[lo], size.w[lo + 1], t)
        const h = lerp(size.h[lo], size.h[lo + 1], t)
        const x = Math.sign(offset) * lerp(size.x[lo], size.x[lo + 1], t)
        // fully visible up to the outer slots, then fades out before it wraps to the other side
        const opacity = k <= 2 ? 1 : Math.max(0, 1 - (k - 2) / 0.36)
        card.style.width = `${w}px`
        card.style.height = `${h}px`
        card.style.transform = `translate3d(${x - w / 2}px, ${-h / 2}px, 0)`
        card.style.opacity = opacity
        card.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
        card.style.zIndex = 30 - Math.round(k * 10)
        card.dataset.offset = offset.toFixed(3)
        // the photo is moved and scaled (not resized) to behave like object-fit: cover
        const baseW = size.w0
        const baseH = baseW * PHOTO_RATIO
        const scale = Math.max(w / baseW, h / baseH)
        const [fx, fy] = focus(b.pos)
        photos.current[i].style.transform = `translate3d(${(w - baseW * scale) * fx}px, ${(h - baseH * scale) * fy}px, 0) scale(${scale})`
        dims.current[i].style.opacity = lerp(size.dim[lo], size.dim[lo + 1], t)
      })
    },
    [W],
  )

  const loop = useLoopCarousel({ count: COUNT, start: START, delayMs: AUTOPLAY_MS, paint, areaRef: stageRef })
  const { index: active, step } = loop
  const item = bridal[active]
  const prev = () => step(-1)
  const next = () => step(1)

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
    const unit = m.w0 * 0.8 // pixels of finger travel for one card
    d.speed = (e.clientX - d.lastX) / Math.max(1, e.timeStamp - d.time)
    d.lastX = e.clientX
    d.time = e.timeStamp
    loop.dragMove(d.from - dx / unit)
  }
  const onPointerEnd = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || d.from === null) return
    // a throw only counts if the hand was still moving when it let go
    const speed = e.timeStamp - d.time < 90 ? d.speed : 0
    loop.dragEnd(Math.max(-1, Math.min(1, (-speed * 160) / (m.w0 * 0.8))))
  }

  return (
    <section
      id="bridal"
      ref={root}
      aria-labelledby="bridal-title"
      className="on-dark relative isolate overflow-hidden bg-[#3d0614] font-['Newsreader_Variable',serif] text-cream"
      onKeyDown={arrowKeys({ onPrev: prev, onNext: next })}
      onFocus={(e) => e.target.matches(':focus-visible') && loop.setFocus(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && loop.setFocus(false)}
    >
      <div className="br-bg" aria-hidden="true">
        <img src={bridalBackground} alt="" loading="lazy" decoding="async" />
        <div className="br-bg-slices">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ backgroundImage: `url(${bridalBackground})` }} />
          ))}
        </div>
      </div>

      <div className="br-stage">
        <div className="br-head" data-reveal>
          <Lotus />
          <p className="br-eyebrow">
            <i aria-hidden="true" />
            The bridal edit
            <i aria-hidden="true" />
          </p>
          <h2 id="bridal-title" className="br-title">
            For your <span className="whitespace-nowrap">once-in-a-lifetime.</span>
          </h2>
        </div>

        <div
          className="br-group touch-pan-y"
          role="group"
          aria-roledescription="carousel"
          aria-label="Bridal sarees"
          tabIndex={0}
          data-reveal
        >
          <div
            ref={stageRef}
            className="br-carousel"
            style={{ '--stage-h': `${m.stageH}px` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            {bridal.map((b, i) => (
              <div key={b.id} ref={(el) => (cards.current[i] = el)} data-card={b.id} className="br-card">
                <img
                  ref={(el) => (photos.current[i] = el)}
                  src={b.src}
                  alt={i === active ? b.alt : b.name}
                  width={1086}
                  height={1448}
                  loading="lazy"
                  decoding="async"
                  draggable="false"
                  className="absolute left-0 top-0 max-w-none origin-top-left"
                  style={{ width: m.w0, height: m.w0 * PHOTO_RATIO }}
                />
                <span ref={(el) => (dims.current[i] = el)} aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[#24060a]" />
                {i !== active && (
                  <button
                    type="button"
                    className="absolute inset-0 z-10 cursor-pointer"
                    aria-label={`Show ${b.name}`}
                    onClick={() => !swiped.current && loop.goTo(i)}
                  />
                )}
              </div>
            ))}
          </div>

          <button type="button" className="br-arrow br-prev" onClick={prev} aria-label="Previous bridal saree">
            <ChevronLeft strokeWidth={1.7} aria-hidden="true" />
          </button>
          <button type="button" className="br-arrow br-next" onClick={next} aria-label="Next bridal saree">
            <ChevronRight strokeWidth={1.7} aria-hidden="true" />
          </button>
        </div>

        <div className="br-foot" data-reveal>
          {/* announced only after a manual move, not on every automatic step */}
          <p className="br-name" aria-live={loop.byUser ? 'polite' : 'off'}>
            <i aria-hidden="true" />
            <span key={item.id} className="fade-up inline-block">
              {item.name}
            </span>
            <i aria-hidden="true" />
          </p>
          <PendingLink href={item.href} className="br-cta" message={`${item.name}: bridal collection pages are not connected yet.`}>
            Discover bridal
          </PendingLink>
          <div className="br-dots" role="group" aria-label="Choose bridal saree">
            {bridal.map((b, i) => {
              const far = Math.min(2, Math.abs(wrapOffset(i - active, COUNT)))
              return (
                <button key={b.id} type="button" onClick={() => loop.goTo(i)} aria-label={`Show ${b.name}`} aria-current={i === active}>
                  <span style={{ '--dot': ['0.81cqw', '0.72cqw', '0.6cqw'][far] }} className="max-lg:![--dot:0.65rem]" />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
