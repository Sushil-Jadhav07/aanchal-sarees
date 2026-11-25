import { useRef, useState } from 'react'
import { ArrowRight, Flower2 } from 'lucide-react'
import { craftPhotos } from '../../data/sections/craftsmanship'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import BrandLogo from '../shared/BrandLogo'
import { Lightbox, pad } from '../shared/ui'

/** 06 — Craftsmanship: image experience (no video). "View the craft" opens an image gallery. */
export default function Craftsmanship() {
  const root = useRef(null)
  const [open, setOpen] = useState(null) // index or null
  const { ref: strip, index, goTo, onScroll } = useSnapScroller(craftPhotos.length, 0)
  useReveal(root)

  const [main, thread, weave] = craftPhotos

  const renderPhoto = ({ i, photo, className, imgClass, label }) => (
    <button
      type="button"
      onClick={() => setOpen(i)}
      aria-label={`Open larger image: ${photo.caption}`}
      className={`group relative block min-h-0 overflow-hidden ${className}`}
    >
      <img
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
        draggable="false"
        className={`h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03] ${imgClass}`}
      />
      {label && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/60 to-transparent" />
      )}
      {label && (
        <span className="absolute left-5 top-5 flex items-center gap-3 font-serif text-cream drop-shadow">
          <span className="text-2xl italic text-gold-light">{pad(i)}</span>
          <span className="text-xl">{photo.caption}</span>
        </span>
      )}
      {label && <span aria-hidden="true" className="absolute left-5 top-14 h-px w-9 bg-gold-light" />}
    </button>
  )

  return (
    <section id="craft" ref={root} aria-labelledby="craft-title" className="bg-cream py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-12">
        <div className="grid grid-cols-[minmax(0,1fr)] items-stretch gap-8 lg:h-[640px] lg:grid-rows-[640px] lg:grid-cols-[minmax(0,0.9fr)_1px_minmax(0,1.75fr)_minmax(0,1fr)] lg:gap-6">
          <div className="flex flex-col justify-between gap-10 lg:pr-4" data-reveal>
            <div>
              <BrandLogo className="h-20 lg:h-24" />
            </div>
            <div>
              <h2 id="craft-title" className="font-display text-[3.1rem] text-wine sm:text-6xl lg:text-[4.2rem]">
                Every fold
                <br />
                has a story.
              </h2>
              <span className="my-6 block h-0.5 w-14 bg-gold" aria-hidden="true" />
              <p className="max-w-xs text-lg leading-snug text-ink">Meet the hands behind the weave.</p>
              <button
                type="button"
                onClick={() => setOpen(0)}
                className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-sm bg-wine px-7 text-[0.78rem] uppercase tracking-[0.28em] text-cream transition-colors hover:bg-wine-deep"
              >
                View the craft
                <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <span className="hidden bg-gold/50 lg:block" aria-hidden="true" />

          {/* Desktop: weaver + two stacked details */}
          {renderPhoto({ i: 0, photo: main, className: 'hidden h-full lg:block', imgClass: 'object-[38%_50%]' })}
          <div className="hidden grid-rows-2 gap-3 lg:grid">
            {renderPhoto({ i: 1, photo: thread, className: 'min-h-0', imgClass: 'object-center', label: true })}
            {renderPhoto({ i: 2, photo: weave, className: 'min-h-0', imgClass: 'object-[50%_60%]', label: true })}
          </div>

          {/* Mobile: swipeable craft images */}
          <div className="lg:hidden">
            <div
              ref={strip}
              onScroll={onScroll}
              tabIndex={0}
              role="group"
              aria-label="Craft images, swipe to browse"
              className="no-scrollbar relative -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5"
            >
              {craftPhotos.map((p, i) => (
                <div key={p.src} className="aspect-[4/5] w-[84vw] max-w-[520px] shrink-0 snap-center">
                  {renderPhoto({ i, photo: p, className: 'h-full w-full', imgClass: '', label: i > 0 })}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-1" role="group" aria-label="Choose craft image">
              {craftPhotos.map((p, i) => (
                <button
                  key={p.src}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1}: ${p.caption}`}
                  aria-current={i === index}
                  className="grid h-11 w-8 place-items-center"
                >
                  <span className={`block h-2 rounded-full transition-all ${i === index ? 'w-6 bg-wine' : 'w-2 bg-gold/70'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-4 text-gold" aria-hidden="true" data-reveal>
          <span className="h-px flex-1 bg-gold/60" />
          <span className="h-1 w-1 rounded-full bg-gold" />
          <Flower2 size={28} strokeWidth={1.2} />
          <span className="h-1 w-1 rounded-full bg-gold" />
          <span className="h-px flex-1 bg-gold/60" />
        </div>
      </div>

      {open !== null && (
        <Lightbox items={craftPhotos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} label="Craft image gallery" />
      )}
    </section>
  )
}
