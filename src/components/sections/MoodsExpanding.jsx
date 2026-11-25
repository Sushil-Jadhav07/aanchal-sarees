import { useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { moods } from '../../data/sections/moods-expanding'
import { useReveal } from '../../hooks/useReveal'
import { useSnapScroller } from '../../hooks/useSnapScroller'
import { PendingLink } from '../shared/ui'
import ExpandableGallery, { GalleryViewer } from '../ui/gallery-animation'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/moods-expanding.css'

const GALLERY = moods.map((m) => ({ ...m, caption: m.label }))
// All six are equal; the expanded one is 2.34 times as wide (proportion measured from the reference).
const panelFlex = (i, openIndex) => (i === openIndex ? 2.34 : 1)

/** Long thin arrow, as drawn in the reference. Sized by the surrounding font size. */
function LongArrow() {
  return (
    <svg
      viewBox="0 0 28 12"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      style={{ width: '1.65em', height: '0.72em' }}
    >
      <path d="M0 6h26.5M21 1l6 5-6 5" />
    </svg>
  )
}

/**
 * 03 — Six moods: expanding panels (desktop) / swipeable cards (below 1024px).
 *
 * Behaviour comes from ../ui/gallery-animation: the panels are equal by default, hover expands one and dims
 * the rest, leaving makes them equal again, click opens the full-screen viewer.
 */
export default function MoodsExpanding() {
  const root = useRef(null)
  const { ref: strip, index: active, goTo, onScroll } = useSnapScroller(moods.length)
  useReveal(root)
  const [viewer, setViewer] = useState(null) // phone / tablet viewer

  return (
    <section id="moods" ref={root} aria-label="Six moods. Infinite drapes." className="relative overflow-hidden bg-cream">
      {/* ------------------------------------------------ Desktop: matches the reference composition */}
      <div className="mx-stage mx-auto hidden lg:block">
        <div className="mx-head" data-reveal>
          <p className="mx-eyebrow">Find your occasion.</p>
          <h2 className="mx-title">Six moods. Infinite drapes.</h2>
          <PendingLink href={null} className="mx-all" message="Occasion collection pages are not connected yet.">
            Explore every occasion
            <LongArrow />
          </PendingLink>
        </div>

        <ExpandableGallery
          images={GALLERY}
          getFlex={panelFlex}
          className="mx-panels"
          panelClassName="mx-panel"
          triggerClassName="mx-select"
          dimClassName="mx-dim"
          viewerLabel="Occasion photos"
          role="group"
          aria-label="Occasions"
          data-reveal
          renderPanel={(m, { open, dim, trigger }) => {
            const frame = open ? m.open : m.closed
            return (
              <div className="mx-card" style={{ '--top': `${m.top}%` }}>
                <div className="mx-frame" aria-hidden="true" />
                <div className="mx-window">
                  <div className="mx-photo">
                    <img
                      src={m.src}
                      alt={m.alt}
                      width={1086}
                      height={1448}
                      loading="lazy"
                      decoding="async"
                      draggable="false"
                      style={{ '--face': m.faceX, '--at': frame.at, '--zoom': frame.zoom }}
                    />
                  </div>
                  <div aria-hidden="true" className="mx-shade mx-shade-closed" />
                  <div aria-hidden="true" className="mx-shade mx-shade-open" />
                  {dim}
                  {/* Whole-panel selector: click, tap, hover (mouse) and keyboard focus */}
                  {trigger}
                  <span className="mx-name" aria-hidden="true">
                    <span>{m.label}</span>
                    <span />
                  </span>
                  {open && (
                    <div className="mx-open fade-up">
                      <p className="mx-open-title">{m.label}</p>
                      <span className="mx-open-rule" aria-hidden="true" />
                      <PendingLink href={m.href} className="mx-cta" message={`${m.label} collection page is not connected yet.`}>
                        {m.cta}
                        <LongArrow />
                      </PendingLink>
                    </div>
                  )}
                </div>
              </div>
            )
          }}
        />
      </div>

      {/* ------------------------------------------------ Phone / tablet: swipeable cards */}
      <div className="px-5 py-16 lg:hidden">
        <p className="eyebrow flex items-center gap-4">
          Find your occasion
          <span className="h-px w-16 bg-gold" aria-hidden="true" />
        </p>
        <h2 className="font-display mt-4 text-[2.7rem] text-wine sm:text-6xl">Six moods. Infinite drapes.</h2>
        <PendingLink href={null} className="link-under mt-5" message="Occasion collection pages are not connected yet.">
          Explore every occasion
          <ArrowRight size={18} aria-hidden="true" />
        </PendingLink>

        <div
          ref={strip}
          onScroll={onScroll}
          tabIndex={0}
          role="group"
          aria-label="Occasions, swipe to browse"
          className="no-scrollbar relative -mx-5 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-[12vw] pb-2"
        >
          {moods.map((m, i) => (
            <article
              key={m.id}
              aria-label={m.label}
              className="relative aspect-[3/4] w-[76vw] max-w-[340px] shrink-0 snap-center overflow-hidden border border-gold/80"
            >
              <img
                src={m.src}
                alt={m.alt}
                width={1086}
                height={1448}
                loading="lazy"
                decoding="async"
                draggable="false"
                className="absolute inset-0 h-full w-full object-cover"
                style={{ objectPosition: m.pos }}
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-wine-deep/80 via-transparent to-transparent" />
              <button
                type="button"
                className="absolute inset-0 cursor-pointer"
                aria-label={`View ${m.label} photo`}
                aria-haspopup="dialog"
                onClick={() => (i === active ? setViewer(i) : goTo(i))}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-cream [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
                <p className="font-serif text-4xl leading-none">{m.label}</p>
                <span className="mt-3 block h-px w-16 bg-gold-light" aria-hidden="true" />
                {i === active && (
                  <PendingLink
                    href={m.href}
                    className="fade-up mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-cream px-5 font-serif text-base font-medium text-wine"
                    message={`${m.label} collection page is not connected yet.`}
                  >
                    {m.cta}
                    <ArrowRight size={15} aria-hidden="true" />
                  </PendingLink>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <GalleryViewer images={GALLERY} index={viewer} onIndex={setViewer} onClose={() => setViewer(null)} label="Occasion photos" />
    </section>
  )
}
