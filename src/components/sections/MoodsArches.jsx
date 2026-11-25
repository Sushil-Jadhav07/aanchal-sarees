import { useRef, useState } from 'react'
import { archMoodFrame, archMoods } from '../../data/sections/moods-arches'
import { useReveal } from '../../hooks/useReveal'
import { CollectionDialog } from '../shared/dialogs'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '../../styles/moods-arches.css'

// Even zig-zag: arches 1, 3, 5 share the upper line and 2, 4, 6 share the lower line.
const DROP = 2.6 // how far the lower line sits below the upper one, in cqw

/**
 * 04 — Classic six moods: temple arches.
 * Each photo is placed inside the frame's inner window, clipped to its exact shape (.clip-arch-moods,
 * traced from the frame PNG), and the transparent gold frame is overlaid on top.
 */
export default function MoodsArches() {
  const root = useRef(null)
  const [open, setOpen] = useState(null)
  useReveal(root, { y: 44, stagger: 0.12 })

  return (
    <section id="moods-arches" ref={root} aria-labelledby="moods-arches-title" className="relative overflow-hidden bg-cream">
      <div className="ma-stage px-4 py-16 lg:px-0">
        <div className="ma-head flex items-center justify-center gap-6 text-center" data-reveal>
          <span className="ma-rule hidden h-px w-16 bg-gold md:block" aria-hidden="true" />
          <h2 id="moods-arches-title" className="ma-title text-[2.4rem] text-wine sm:text-5xl">
            Six moods. <em className="ml-[0.08em] font-medium text-gold-deep">Infinite drapes.</em>
          </h2>
          <span className="ma-rule hidden h-px w-16 bg-gold md:block" aria-hidden="true" />
        </div>

        <ul
          aria-label="Occasions"
          className="ma-row no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory items-start gap-2 overflow-x-auto px-[10vw] pb-4 pt-4 lg:mx-0 lg:snap-none lg:gap-0 lg:overflow-visible lg:p-0"
        >
          {archMoods.map((m, i) => (
            <li
              key={m.id}
              data-reveal
              className="ma-item w-[64vw] max-w-[320px] shrink-0 snap-center sm:w-[44vw] lg:max-w-none"
              style={{ '--stagger': `${i % 2 ? DROP : 0}cqw` }}
            >
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="ma-card group block w-full cursor-pointer text-center focus-visible:outline-offset-0"
              >
                <span className="ma-box relative block aspect-[1086/1448] transition-transform duration-500 ease-[var(--ease-silk)] group-hover:-translate-y-2 group-focus-visible:-translate-y-2">
                  <span className="clip-arch-moods absolute inset-0 block overflow-hidden bg-[#3a2012]">
                    <span className="ma-zoom block" style={{ '--photo-top': `${m.photoTop}%` }}>
                      <img src={m.src} alt="" aria-hidden="true" width={1086} height={1448} loading="lazy" decoding="async" draggable="false" className="ma-mirror" />
                      <img src={m.src} alt={m.alt} width={1086} height={1448} loading="lazy" decoding="async" draggable="false" />
                    </span>
                  </span>
                  <img
                    src={archMoodFrame}
                    alt=""
                    aria-hidden="true"
                    width={1086}
                    height={1448}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 h-full w-full drop-shadow-[0_14px_16px_rgba(71,8,25,0.22)]"
                  />
                </span>
                <span className="ma-label relative -mt-[3%] block text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-wine sm:text-[0.82rem]" style={{ fontFamily: 'var(--font-sans)' }}>
                  {m.label}
                  <span className="sr-only">: open collection preview</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open !== null && <CollectionDialog item={archMoods[open]} title={archMoods[open].label} onClose={() => setOpen(null)} />}
    </section>
  )
}
