import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { wornBackground, wornCopy, wornStories } from '../../data/sections/worn-beautifully'
import { useElementWidth } from '../../hooks/useElementWidth'
import { useLoopCarousel, wrapOffset } from '../../hooks/useLoopCarousel'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import { arrowKeys } from '../../hooks/useSwipe'
import StoryViewer from '../shared/StoryViewer'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/worn-beautifully.css'

const COUNT = wornStories.length
const START = 2 // "My Aanchal Bridal Story" in the centre
const AUTOPLAY_MS = 3000 // moves on to the next story by itself every 3 seconds

// The five places measured from the reference: horizontal centre and size, in reference px of a 2048 x 768 stage.
// Index 0 is the far-left place (offset -2) and index 4 the far-right one (offset +2).
const STAGE_W = 2048
const SLOTS = [
  { x: 786, w: 233, top: 152, h: 417 },
  { x: 1033, w: 232, top: 152, h: 417 },
  { x: 1315, w: 306, top: 99, h: 508 },
  { x: 1605, w: 233, top: 152, h: 417 },
  { x: 1857, w: 233, top: 152, h: 417 },
]
const lerp = (a, b, t) => a + (b - a) * t
/** Size and place of a card at a fractional offset from the centre (-2.5 … 2.5): it morphs smoothly from one place to the next. */
function slotAt(offset) {
  const c = Math.max(-2, Math.min(2, offset))
  const i = Math.min(3, Math.floor(c + 2))
  const a = SLOTS[i]
  const b = SLOTS[i + 1]
  const t = c + 2 - i
  // past the last place the card keeps moving outward while it fades, so it never visibly jumps when it wraps round
  const out = Math.sign(offset) * Math.max(0, Math.abs(offset) - 2) * 250
  return { x: lerp(a.x, b.x, t) + out, w: lerp(a.w, b.w, t), top: lerp(a.top, b.top, t), h: lerp(a.h, b.h, t) }
}

const Play = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 2.5v19l17-9.5z" />
  </svg>
)

/**
 * Worn beautifully, remembered forever. Photo stories (no video files) shown in a full-screen story viewer.
 * On desktop the five cards loop endlessly (the centre one tallest) and move on by themselves every 3 s; they can
 * also be dragged, clicked or stepped with the arrow keys. Below 1024px it is a swipeable strip.
 */
export default function WornBeautifully() {
  const root = useRef(null)
  const cards = useRef([])
  const drag = useRef(null)
  const swiped = useRef(false)
  const [stageRef, W] = useElementWidth() // the desktop card layer; 0 while it is hidden (phone / tablet)
  const [story, setStory] = useState(null) // index of the story open in the viewer
  const { ref: strip, index: active, goTo, onScroll } = useSnapScroller(COUNT, START)
  useReveal(root, { y: 30, stagger: 0.1 })
  const k = (W || STAGE_W) / STAGE_W // screen px per reference px

  // draws every card for a fractional position; the loop hook calls this on every animation frame
  const paint = useCallback(
    (position) => {
      const scale = (W || STAGE_W) / STAGE_W
      wornStories.forEach((_, i) => {
        const el = cards.current[i]
        if (!el) return
        const offset = wrapOffset(i - position, COUNT)
        const distance = Math.abs(offset)
        const q = slotAt(offset)
        // fully faded just before it wraps round at 2.5
        const opacity = distance <= 2 ? 1 : Math.max(0, 1 - (distance - 2) / 0.45)
        el.style.width = `${q.w * scale}px`
        el.style.height = `${q.h * scale}px`
        el.style.transform = `translate3d(${(q.x - q.w / 2) * scale}px, ${q.top * scale}px, 0)`
        el.style.opacity = opacity
        el.style.visibility = opacity > 0.01 ? 'visible' : 'hidden'
        el.style.zIndex = 40 - Math.round(distance * 10)
      })
    },
    [W],
  )
  const loop = useLoopCarousel({ count: COUNT, start: START, delayMs: AUTOPLAY_MS, paint, areaRef: stageRef })
  const wide = W > 0
  const step = (d) => loop.step(d)

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
    loop.dragMove(d.from - dx / (270 * k))
  }
  const onPointerEnd = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || d.from === null) return
    const speed = e.timeStamp - d.time < 90 ? d.speed : 0
    loop.dragEnd(Math.max(-1, Math.min(1, (-speed * 160) / (270 * k))))
  }
  // a click that ends a drag must not also select / open a card
  const open = (i) => {
    if (!swiped.current) setStory(i)
  }

  return (
    <section id="worn-beautifully" ref={root} aria-labelledby="worn-title" className="on-dark relative isolate overflow-hidden bg-[#4b0412] text-cream">
      <img src={wornBackground} alt="" aria-hidden="true" loading="lazy" decoding="async" className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[#38000a]/65" />

      {/* ------------------------------------------------ Desktop: matches the reference composition */}
      <div className="wb-stage hidden lg:block">
        <div data-reveal>
          <h2 id="worn-title" className="wb-title">
            <span>{wornCopy.title}</span>
            <em>{wornCopy.highlight}</em>
          </h2>
          <p className="wb-sub">
            {wornCopy.lines.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
          <span className="wb-rule" aria-hidden="true" />
        </div>

        <div
          ref={stageRef}
          role="group"
          aria-roledescription="carousel"
          aria-label="Styling stories"
          className="absolute inset-0 touch-pan-y"
          onKeyDown={arrowKeys({ onPrev: () => step(-1), onNext: () => step(1) })}
          onFocus={(e) => e.target.matches(':focus-visible') && loop.setFocus(true)}
          onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && loop.setFocus(false)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          data-reveal
        >
          {wornStories.map((s, i) => {
            const centre = wide && i === loop.index
            return (
              // no data-reveal here: the entrance animation would clear the card's inline transform
              <div key={s.id} ref={(el) => (cards.current[i] = el)} className="wb-card" data-centre={centre}>
                <div className="wb-face">
                  <img src={s.src} alt={s.alt} width={1086} height={1448} loading="lazy" decoding="async" draggable="false" style={{ objectPosition: s.pos }} />
                  <span aria-hidden="true" className="wb-shade" />
                  <button
                    type="button"
                    className="wb-select"
                    aria-label={centre ? `${s.caption}: open story` : `Show ${s.caption}`}
                    aria-current={centre}
                    onClick={() => !swiped.current && (centre ? setStory(i) : loop.goTo(i))}
                  />
                  <button type="button" className="wb-play" aria-label={`Play stories from ${s.caption}`} onClick={() => open(i)}>
                    <Play />
                  </button>
                  <p className="wb-caption" aria-hidden="true">
                    {s.lines.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        <p className="sr-only" aria-live="polite">
          {loop.byUser ? `Showing ${wornStories[loop.index].caption}` : ''}
        </p>
      </div>

      {/* ------------------------------------------------ Phone / tablet: swipeable cards */}
      <div className="px-5 py-16 lg:hidden">
        <h2 className="font-display text-[3rem] font-medium text-cream sm:text-6xl">
          {wornCopy.title}
          <br />
          <em className="font-medium text-gold-light">{wornCopy.highlight}</em>
        </h2>
        <p className="mt-5 text-lg leading-relaxed text-cream/90">{wornCopy.lines.join(' ')}</p>
        <span className="mt-5 block h-0.5 w-24 bg-gold-light" aria-hidden="true" />

        <div
          ref={strip}
          onScroll={onScroll}
          tabIndex={0}
          role="group"
          aria-label="Styling stories, swipe to browse"
          className="no-scrollbar relative -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[15vw] pb-2"
        >
          {wornStories.map((s, i) => (
            <div key={s.id} className="relative aspect-[9/16] w-[70vw] max-w-[320px] shrink-0 snap-center overflow-hidden rounded-3xl border-2 border-gold-light/80">
              <img src={s.src} alt={s.alt} width={1086} height={1448} loading="lazy" decoding="async" draggable="false" className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: s.pos }} />
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
              <button type="button" className="absolute inset-0 w-full cursor-pointer" aria-label={`${s.caption}: open story`} onClick={() => (i === active ? setStory(i) : goTo(i))} />
              <button
                type="button"
                className="absolute bottom-24 left-1/2 grid h-14 w-14 -translate-x-1/2 place-items-center rounded-full border-2 border-white bg-black/20 text-white"
                aria-label={`Play stories from ${s.caption}`}
                onClick={() => setStory(i)}
              >
                <span className="ml-1 block h-5 w-5">
                  <Play />
                </span>
              </button>
              <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-center font-serif text-2xl leading-tight text-cream">
                {s.caption}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-5">
          <button type="button" className="circle-btn" onClick={() => goTo(active - 1)} disabled={active === 0} aria-label="Previous story">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <span className="text-xs tracking-[0.25em] text-cream/80" aria-live="polite">
            {String(active + 1).padStart(2, '0')} / {String(COUNT).padStart(2, '0')}
          </span>
          <button type="button" className="circle-btn" onClick={() => goTo(active + 1)} disabled={active === COUNT - 1} aria-label="Next story">
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <StoryViewer stories={wornStories} start={story} onClose={() => setStory(null)} />
    </section>
  )
}
