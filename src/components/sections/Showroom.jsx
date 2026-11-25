import { useCallback, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { showroomSlides } from '../../data/sections/showroom'
import { useAutoplay } from '../../hooks/useAutoplay'
import { arrowKeys, useSwipe } from '../../hooks/useSwipe'
import { pad } from '../shared/ui'

const AUTOPLAY_MS = 3000 // the next photo comes in every 3 seconds

/** 01 — Showroom opening: image slider that moves on every 3 s (pauses on hover, touch, keyboard focus, off screen). */
export default function Showroom() {
  const root = useRef(null)
  const [active, setActive] = useState(0)
  const count = showroomSlides.length
  const go = (i) => setActive((i + count) % count)
  const advance = useCallback((i) => setActive(i), [])
  const swipe = useSwipe({ onPrev: () => go(active - 1), onNext: () => go(active + 1) })
  const { areaProps, sectionProps } = useAutoplay(root, { index: active, count, onAdvance: advance, delay: AUTOPLAY_MS })
  const slide = showroomSlides[active]

  return (
    <section
      id="top"
      ref={root}
      aria-roledescription="carousel"
      aria-label="Aanchal showroom"
      tabIndex={0}
      onKeyDown={arrowKeys({ onPrev: () => go(active - 1), onNext: () => go(active + 1) })}
      className="on-dark relative isolate h-[100svh] max-h-[900px] min-h-[560px] touch-pan-y overflow-hidden bg-wine-deep text-cream"
      {...sectionProps}
      {...swipe}
      onPointerEnter={areaProps.onPointerEnter}
      onPointerLeave={areaProps.onPointerLeave}
      onPointerDown={(e) => {
        areaProps.onPointerDown(e)
        swipe.onPointerDown(e)
      }}
      onPointerUp={(e) => {
        areaProps.onPointerUp(e)
        swipe.onPointerUp(e)
      }}
      onPointerCancel={(e) => {
        areaProps.onPointerCancel(e)
        swipe.onPointerCancel(e)
      }}
    >
      {showroomSlides.map((s, i) => (
        <img
          key={s.src}
          src={s.src}
          alt={i === active ? s.alt : ''}
          aria-hidden={i !== active}
          width={1672}
          height={941}
          loading={i === 0 ? 'eager' : 'lazy'}
          fetchPriority={i === 0 ? 'high' : 'auto'}
          decoding="async"
          draggable="false"
          style={{ objectPosition: s.position }}
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-[opacity,transform] duration-[1100ms] ease-out ${
            i === active ? 'scale-100 opacity-100' : 'scale-[1.05] opacity-0'
          }`}
        />
      ))}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-t from-wine-deep/85 via-wine-deep/25 to-wine-deep/20 md:bg-gradient-to-r md:from-wine-deep/85 md:via-wine-deep/35 md:to-transparent"
      />

      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-end px-5 pb-28 sm:pb-32 md:justify-center md:pb-0 lg:px-12">
        <div key={active} className="slide-in max-w-xl" style={{ '--slide-from': '18px' }} aria-live="polite">
          <p className="eyebrow !text-gold-light">{slide.eyebrow}</p>
          <h1 className="font-display mt-4 text-[2.9rem] text-cream sm:text-6xl lg:text-7xl">{slide.title}</h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-cream/85">{slide.text}</p>
          <a href="#silk-orbit" className="btn-outline-gold mt-8">
            Explore the collection
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 z-10 mx-auto flex max-w-[1440px] items-center justify-between px-5 lg:px-12">
        <div className="flex items-center gap-3" role="group" aria-label="Choose slide">
          {showroomSlides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1} of ${count}: ${s.eyebrow}`}
              aria-current={i === active}
              className="group grid h-11 place-items-center"
            >
              <span
                className={`block h-[3px] rounded-full transition-all duration-500 ${
                  i === active ? 'w-12 bg-gold-light' : 'w-6 bg-cream/50 group-hover:bg-cream'
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-xs tracking-[0.25em] text-cream/75">
            {pad(active + 1)} / {pad(count)}
          </span>
        </div>
        <div className="flex gap-3">
          <button type="button" className="circle-btn" onClick={() => go(active - 1)} aria-label="Previous slide">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <button type="button" className="circle-btn" onClick={() => go(active + 1)} aria-label="Next slide">
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
