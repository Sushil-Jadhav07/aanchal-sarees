import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { wornBackground, wornCopy, wornStories } from '../../data/sections/worn-beautifully'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import { arrowKeys, useSwipe } from '../../hooks/useSwipe'
import StoryViewer from '../shared/StoryViewer'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/worn-beautifully.css'

const COUNT = wornStories.length
const START = 2 // "My Aanchal Bridal Story" in the centre

// The five places measured from the reference: horizontal centre and size, in reference px of a 2048 x 768 stage.
const SLOTS = {
  '-2': { x: 786, w: 233, top: 152, h: 417 },
  '-1': { x: 1033, w: 232, top: 152, h: 417 },
  0: { x: 1315, w: 306, top: 99, h: 508 },
  1: { x: 1605, w: 233, top: 152, h: 417 },
  2: { x: 1857, w: 233, top: 152, h: 417 },
}
/** Which place (-2 … 2) story `i` takes when `centre` is in the middle. */
const placeOf = (i, centre) => ((i - centre + COUNT + 2) % COUNT) - 2
const pctW = (n) => `${((n / 2048) * 100).toFixed(3)}%`
const pctH = (n) => `${((n / 768) * 100).toFixed(3)}%`

const Play = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M4 2.5v19l17-9.5z" />
  </svg>
)

/** Worn beautifully, remembered forever. Photo stories (no video files) shown in a full-screen story viewer. */
export default function WornBeautifully() {
  const root = useRef(null)
  // `turn` and `prev` let a card that wraps from one end to the other fade in instead of sliding across.
  const [view, setView] = useState({ centre: START, prev: START, turn: 0 })
  const [story, setStory] = useState(null) // index of the story open in the viewer
  const { ref: strip, index: active, goTo, onScroll } = useSnapScroller(COUNT, START)
  useReveal(root, { y: 30, stagger: 0.1 })

  const rotateTo = (i) =>
    setView((v) => {
      const centre = (i + COUNT) % COUNT
      return centre === v.centre ? v : { centre, prev: v.centre, turn: v.turn + 1 }
    })
  const step = (d) => rotateTo(view.centre + d)
  const swipe = useSwipe({ onPrev: () => step(-1), onNext: () => step(1) })

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
          role="group"
          aria-roledescription="carousel"
          aria-label="Styling stories"
          className="absolute inset-0 touch-pan-y"
          onKeyDown={arrowKeys({ onPrev: () => step(-1), onNext: () => step(1) })}
          {...swipe}
        >
          {wornStories.map((s, i) => {
            const place = placeOf(i, view.centre)
            const slot = SLOTS[place]
            const centre = place === 0
            const wrapped = Math.abs(place - placeOf(i, view.prev)) > 2
            return (
              <div
                key={wrapped ? `${s.id}-${view.turn}` : s.id}
                className={`wb-card${wrapped ? ' wb-enter' : ''}`}
                data-centre={centre}
                data-place={place}
                data-reveal
                style={{ left: pctW(slot.x - slot.w / 2), top: pctH(slot.top), width: pctW(slot.w), height: pctH(slot.h), zIndex: 3 - Math.abs(place) }}
              >
                <div className="wb-face">
                  <img src={s.src} alt={s.alt} width={1086} height={1448} loading="lazy" decoding="async" draggable="false" style={{ objectPosition: s.pos }} />
                  <span aria-hidden="true" className="wb-shade" />
                  <button
                    type="button"
                    className="wb-select"
                    aria-label={centre ? `${s.caption}: open story` : `Show ${s.caption}`}
                    aria-current={centre}
                    onClick={() => (centre ? setStory(i) : rotateTo(i))}
                  />
                  <button type="button" className="wb-play" aria-label={`Play stories from ${s.caption}`} onClick={() => setStory(i)}>
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
