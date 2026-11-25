import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { paisley } from '../../data/shared'
import { weaves } from '../../data/sections/weaves-stack'
import { useAutoplay } from '../../hooks/useAutoplay'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import SilkCard3D from '../shared/SilkCard3D'
import { PendingLink, StepTrack } from '../shared/ui'

// How long each weave stays in front before the next one slides forward.
const AUTOPLAY_MS = 4000

// Card geometry per stack position (0 = front), in % of the stack area. The front card keeps the original
// size; the cards behind share the space to its right. `covered` = hidden share of the card, `shift` slides
// the model sideways so the face stays visible.
const POS = [
  { left: 0, top: 0, width: 56, height: 100, covered: 0, shift: '0%', strength: 1 },
  { left: 27, top: 6, width: 44, height: 88, covered: 66, shift: '31%', strength: 0.55 },
  { left: 46, top: 11.5, width: 40, height: 77, covered: 62.5, shift: '29%', strength: 0.55 },
  { left: 64, top: 17, width: 36, height: 66, covered: 61, shift: '28%', strength: 0.55 },
]

function Cta({ weave, className = '' }) {
  return (
    <PendingLink
      href={weave.href}
      className={`fade-up inline-flex items-center gap-2 border-b border-cream/60 pb-1 font-serif italic ${className}`}
      message={`${weave.name} collection page is not connected yet.`}
    >
      {weave.cta}
      <ArrowRight size={16} aria-hidden="true" />
    </PendingLink>
  )
}

/** Unfold the weave: auto-playing stack of 3D silk cards (desktop) / swipeable slider (below 1024px). */
export default function WeavesStack() {
  const root = useRef(null)
  const { ref: strip, index: active, goTo, onScroll } = useSnapScroller(weaves.length, 0)
  useReveal(root)
  const n = weaves.length
  const { areaProps, sectionProps } = useAutoplay(root, { index: active, count: n, onAdvance: goTo, delay: AUTOPLAY_MS })

  return (
    <section id="weaves" ref={root} aria-labelledby="weave-title" className="relative overflow-hidden bg-cream py-20 lg:py-24" {...sectionProps}>
      <img
        src={paisley}
        alt=""
        aria-hidden="true"
        width={1312}
        height={1199}
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -bottom-6 -left-16 w-[260px] opacity-40 sm:w-[320px] lg:-left-10 lg:bottom-4 lg:w-[340px] lg:opacity-60"
      />

      <div className="relative mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] items-center gap-10 px-5 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-14 lg:px-12">
        <div className="relative z-10" data-reveal>
          <h2 id="weave-title" className="font-display text-[3.2rem] text-wine sm:text-6xl lg:text-[4.6rem]">
            Unfold
            <br />
            the weave.
          </h2>
          <span className="my-6 block h-0.5 w-14 bg-gold" aria-hidden="true" />
          <p className="max-w-xs font-serif text-xl italic leading-snug text-ink-soft lg:text-[1.35rem]">
            Different regions. Distinct techniques. A shared love of silk.
          </p>
          <div className="mt-8 hidden max-w-[17rem] lg:block" {...areaProps}>
            <StepTrack items={weaves.map((w) => w.name)} active={active} onSelect={goTo} label="Choose a weave" />
          </div>
        </div>

        {/* Desktop stack */}
        <div className="hidden lg:block" data-reveal>
          <div className="relative h-[640px] [container-type:inline-size]" role="group" aria-label="Weave collections" {...areaProps}>
            {weaves.map((w, i) => {
              const pos = (i - active + n) % n
              const g = POS[pos]
              const front = pos === 0
              return (
                <SilkCard3D
                  key={w.id}
                  weave={w}
                  strength={g.strength}
                  shift={g.shift}
                  className="absolute transition-[left,top,width,height] duration-[800ms] ease-[var(--ease-silk)]"
                  style={{ left: `${g.left}%`, top: `${g.top}%`, width: `${g.width}%`, height: `${g.height}%`, zIndex: n - pos }}
                  labelClassName="pb-9 pr-2 text-cream transition-[padding] duration-[800ms] ease-[var(--ease-silk)]"
                  labelStyle={{ paddingLeft: front ? '2.5rem' : `calc(${g.covered}% + 0.7rem)` }}
                  label={
                    <>
                      <p
                        className="font-serif leading-none"
                        style={{ fontSize: front ? '3.6rem' : 'clamp(0.9rem, 2.7cqw, 1.4rem)' }}
                      >
                        {w.name}
                      </p>
                      <span className={`mt-4 block h-px bg-gold-light ${front ? 'w-12' : 'w-8'}`} aria-hidden="true" />
                      {front && <Cta weave={w} className="mt-5 text-xl" />}
                    </>
                  }
                >
                  {!front && (
                    <button
                      type="button"
                      className="absolute inset-0 z-30 cursor-pointer rounded-[1.1rem] [transform:translateZ(60px)]"
                      aria-label={`Bring ${w.name} forward`}
                      onClick={() => goTo(i)}
                    />
                  )}
                </SilkCard3D>
              )
            })}
          </div>
          <p className="mt-6 text-center font-serif text-lg italic text-ink-soft">Select a weave to bring it forward.</p>
        </div>

        {/* Mobile / tablet slider: the centred card rises out of its frame */}
        <div className="lg:hidden">
          <div
            ref={strip}
            onScroll={onScroll}
            {...areaProps}
            tabIndex={0}
            role="group"
            aria-label="Weave collections, swipe to browse"
            className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-[9vw] pb-8 pt-14"
          >
            {weaves.map((w, i) => (
              <SilkCard3D
                key={w.id}
                weave={w}
                lifted={i === active}
                className="aspect-[4/5] w-[82vw] max-w-[440px] shrink-0 snap-center"
                labelClassName="p-6 text-cream"
                label={
                  <>
                    <p className="font-serif text-[2.6rem] leading-none sm:text-5xl">{w.name}</p>
                    <span className="mt-4 block h-px w-12 bg-gold-light" aria-hidden="true" />
                    {i === active && <Cta weave={w} className="mt-4 min-h-11 text-xl" />}
                  </>
                }
              />
            ))}
          </div>
          <div className="mx-auto max-w-[17rem]" {...areaProps}>
            <StepTrack items={weaves.map((w) => w.name)} active={active} onSelect={goTo} label="Choose a weave" />
          </div>
        </div>
      </div>
    </section>
  )
}
